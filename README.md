# Vira — Quản lý dự án và cộng tác công việc

Vira là ứng dụng quản lý công việc theo **workspace → project → task**, gồm frontend React/Vite và backend Spring Boot. Ứng dụng hỗ trợ Kanban, Backlog, Sprint, thành viên dự án, bình luận, tệp đính kèm, báo cáo tổng quan, thông báo trong ứng dụng và cộng tác trực tiếp trên từng task.

## Chức năng

- Xác thực JWT: đăng ký, đăng nhập, refresh token, quên/reset mật khẩu qua email, đổi mật khẩu và hồ sơ cá nhân.
- Tạo/cập nhật/lưu trữ workspace và project; mời thành viên, quản lý vai trò project.
- Task, task con, Backlog, Kanban, Sprint, kéo-thả, xóa mềm/khôi phục, comments, bug details và attachments.
- Cộng tác task: nhiều người thực hiện, người theo dõi, tự tham gia/rời task và thông báo khi được giao việc.
- Cấu hình WIP cột Kanban, báo cáo overview và notification bell.

## Kiến trúc

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Frontend | React 19, Vite, Lucide | SPA tại cổng 5173 |
| Backend | Java 21, Spring Boot 3.5, Security, JPA | REST API tại cổng 8080 |
| Database | MySQL 8.4 + Flyway | Schema migration `V1`–`V6` |
| Email local | Mailpit | Nhận email reset tại cổng 8025 |
| Upload | Docker volume `backend/uploads` | Lưu tệp đính kèm local |

```text
Browser (5173) ──► React/Vite ── Bearer JWT ──► Spring API (8080/api/v1)
                                                   ├── MySQL (3307)
                                                   ├── Mailpit (8025/1025)
                                                   └── uploads/
```

## Khởi chạy nhanh

### Điều kiện cần

- Node.js 20+ và npm
- Java 21 để package backend
- Docker Desktop

### Backend, database và Mailpit

Docker image backend sử dụng JAR ở `backend/target`, vì vậy package trước khi build image:

```powershell
cd D:\Vira\backend
.\mvnw.cmd package -DskipTests
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/actuator/health
```

### Frontend

```powershell
cd D:\Vira
npm install
npm run dev -- --host 0.0.0.0
```

| Dịch vụ | Địa chỉ |
| --- | --- |
| Frontend | http://localhost:5173 |
| REST API | http://localhost:8080/api/v1 |
| Health | http://localhost:8080/api/v1/actuator/health |
| Mailpit | http://localhost:8025 |
| Swagger UI | http://localhost:8080/api/v1/swagger-ui/index.html |
| MySQL host port | `localhost:3307` |

Để dừng các container mà vẫn giữ dữ liệu: `docker compose down`. Chỉ dùng `docker compose down -v` khi muốn xóa toàn bộ dữ liệu local.

Sao lưu MySQL: `cd backend; .\scripts\backup-mysql.ps1`. Khôi phục: `cd backend; .\scripts\restore-mysql.ps1 -BackupFile .\backups\vira-YYYYMMDD-HHMMSS.sql`. Sao lưu tệp đính kèm: `cd backend; .\scripts\backup-uploads.ps1`; khôi phục: `cd backend; .\scripts\restore-uploads.ps1 -BackupFile .\backups\vira-uploads-YYYYMMDD-HHMMSS.zip`. Khi khôi phục môi trường, dùng cả backup MySQL và backup upload cùng mốc thời gian. Các script restore đều yêu cầu gõ `RESTORE` trước khi ghi dữ liệu.

## Tài khoản và phân quyền

| Tài khoản | Email | Mật khẩu | Vai trò project demo |
| --- | --- | --- | --- |
| Demo Owner | `demo@vira.local` | `Demo@12345` | `OWNER` |
| Demo Admin | `manager@vira.local` | `Demo@12345` | `ADMIN` |
| Demo Member | `member@vira.local` | `Demo@12345` | `MEMBER` |
| Demo Viewer | `guest@vira.local` | `Demo@12345` | `VIEWER` |

Tất cả tài khoản trên đã là thành viên của workspace/project demo và có thể dùng ngay trên task `DEMO-101`. Workspace role tương ứng là Owner cho tài khoản đầu tiên, Member cho các tài khoản còn lại.

### Vai trò

| Cấp | Vai trò | Ý nghĩa |
| --- | --- | --- |
| Workspace | `OWNER`, `MEMBER` | Chủ sở hữu, thành viên workspace |
| Project | `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` | Kiểm soát phạm vi thao tác trong project (Chủ dự án, Quản trị viên, Thành viên thực thi, Người quan sát chỉ xem) |

`OWNER`, `ADMIN`, `MEMBER` có thể tạo công việc và gán người thực hiện cho task. `VIEWER` ở chế độ chỉ xem (read-only), không thể chỉnh sửa hay đổi trạng thái công việc. Mọi participant đều được kiểm tra là thành viên còn hiệu lực của chính project đó.

## Luồng cộng tác task

1. Owner/Manager tạo project, sau đó mời tài khoản khác ở **Thành viên**.
2. Tạo task từ Board hoặc Backlog và mở chi tiết task.
3. Owner/Manager/Lead mở **Phân công thành viên**, tick một hay nhiều người thực hiện.
4. Người được giao nhận notification `TASK_ASSIGNED` trong chuông thông báo.
5. Thành viên có thể bấm **Tham gia công việc**; thao tác này thêm họ vào cả assignees và watchers.
6. Bấm **Theo dõi** nếu chỉ cần theo dõi, hoặc **Rời công việc** để bỏ cả hai vai trò của chính mình.

## API

### Quy ước

- Base URL: `http://localhost:8080/api/v1`.
- Route trừ `/auth/**` và actuator yêu cầu `Authorization: Bearer <accessToken>`.
- API trả envelope:

```json
{ "success": true, "message": "Mô tả kết quả", "data": {} }
```

- Task dùng `version` để optimistic locking. Khi đổi trạng thái, move, xóa hoặc khôi phục phải gửi version mới nhất.

### Xác thực và hồ sơ

| Method | Endpoint | Payload/chức năng |
| --- | --- | --- |
| POST | `/auth/register` | `fullName`, `email`, `password` |
| POST | `/auth/login` | `email`, `password` |
| POST | `/auth/refresh` | `refreshToken` |
| POST | `/auth/forgot-password` | `email` |
| POST | `/auth/reset-password` | `token`, `newPassword` |
| GET | `/users/me` | Hồ sơ hiện tại |
| PUT | `/users/me` | `fullName`, `avatarUrl` |
| PUT | `/users/me/password` | `currentPassword`, `newPassword` |

Ví dụ đăng nhập:

```powershell
$body = @{ email = 'demo@vira.local'; password = 'Demo@12345' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/auth/login -ContentType application/json -Body $body
```

### Workspace, project và thành viên

| Method | Endpoint | Payload/chức năng |
| --- | --- | --- |
| GET/POST | `/workspaces` | Liệt kê/tạo: `name`, `description` |
| PUT | `/workspaces/{workspaceId}` | Cập nhật `name`, `description` |
| PATCH | `/workspaces/{workspaceId}/archive` | Lưu trữ workspace |
| GET/POST | `/workspaces/{workspaceId}/projects` | Liệt kê/tạo project |
| GET/PUT | `/projects/{projectId}` | Xem/cập nhật project |
| PATCH | `/projects/{projectId}/archive` | Lưu trữ project |
| GET/POST | `/projects/{projectId}/members` | Liệt kê/mời: `email`, `role` |
| PUT/DELETE | `/projects/{projectId}/members/{userId}` | Đổi role/gỡ thành viên |

Project mới yêu cầu `name`, `projectKey`, `projectType`; `projectKey` theo mẫu `[A-Za-z][A-Za-z0-9]{1,11}`. Các trường tùy chọn: `description`, `startDate`, `targetEndDate`.

### Task, Board và Backlog

| Method | Endpoint | Payload/chức năng |
| --- | --- | --- |
| GET | `/projects/{projectId}/tasks` | Task chưa xóa |
| GET | `/projects/{projectId}/tasks/backlog` | Backlog chưa hoàn thành |
| GET | `/projects/{projectId}/tasks/deleted` | Task đã xóa mềm |
| POST | `/projects/{projectId}/tasks` | Tạo task |
| PATCH | `/projects/{projectId}/tasks/{taskId}/status` | `status`, `version` |
| PATCH | `/projects/{projectId}/tasks/{taskId}/move` | `status`, `position`, `version` |
| PATCH | `/projects/{projectId}/tasks/{taskId}/sprint` | `sprintId` hoặc `null` |
| DELETE | `/projects/{projectId}/tasks/{taskId}?version={version}` | Xóa mềm |
| PATCH | `/projects/{projectId}/tasks/{taskId}/restore?version={version}` | Khôi phục |
| GET | `/projects/{projectId}/board` | Board mặc định |
| PATCH | `/projects/{projectId}/board/columns/{columnId}` | `name`, `wipLimit` |

Task create:

```json
{
  "title": "Thiết kế màn hình đăng nhập",
  "description": "Thiết kế desktop và mobile",
  "taskType": "TASK",
  "priority": "HIGH",
  "dueDate": "2026-09-30",
  "estimatedHours": 8,
  "storyPoints": 3
}
```

`taskType`: `STORY`, `TASK`, `BUG`, `IMPROVEMENT`, `SUBTASK`.

`priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

`status`: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `BLOCKED`, `ON_HOLD`, `CANCELLED`.

### Cộng tác task

| Method | Endpoint | Quyền/chức năng |
| --- | --- | --- |
| GET | `/projects/{projectId}/tasks/{taskId}/collaboration` | Assignees, watchers và quyền hiện tại |
| PUT | `/projects/{projectId}/tasks/{taskId}/collaboration/assignees` | Owner/Manager/Lead gán `userIds` |
| POST | `/projects/{projectId}/tasks/{taskId}/collaboration/join` | Tự thêm vào assignees + watchers |
| DELETE | `/projects/{projectId}/tasks/{taskId}/collaboration/leave` | Tự gỡ khỏi assignees + watchers |
| POST | `/projects/{projectId}/tasks/{taskId}/collaboration/watch` | Tự theo dõi |
| DELETE | `/projects/{projectId}/tasks/{taskId}/collaboration/watch` | Tự bỏ theo dõi |

Ví dụ gán nhiều người:

```json
{ "userIds": [12, 18] }
```

### Sprint, comments, bug, attachments, reports và notifications

| Method | Endpoint | Payload/chức năng |
| --- | --- | --- |
| GET/POST | `/projects/{projectId}/sprints` | Liệt kê/tạo Sprint |
| PATCH | `/projects/{projectId}/sprints/{sprintId}/start` | Bắt đầu Sprint |
| PATCH | `/projects/{projectId}/sprints/{sprintId}/complete` | Hoàn thành Sprint |
| GET/POST | `/projects/{projectId}/tasks/{taskId}/comments` | Lấy/tạo `body`, `parentCommentId` |
| PATCH | `/projects/{projectId}/tasks/{taskId}/comments/{commentId}/pin` | Ghim/bỏ ghim |
| GET/PUT | `/projects/{projectId}/tasks/{taskId}/bug` | Chi tiết bug |
| GET/POST | `/projects/{projectId}/tasks/{taskId}/attachments` | Liệt kê/tải `multipart/form-data` field `file` |
| GET | `/projects/{projectId}/tasks/{taskId}/attachments/{attachmentId}/download` | Tải file |
| GET | `/projects/{projectId}/reports/overview` | Báo cáo tổng quan |
| GET | `/notifications` | Tối đa 50 notification gần nhất |
| PATCH | `/notifications/{notificationId}/read` | Đánh dấu đã đọc |

## Cấu hình

| Biến | Mặc định local | Ý nghĩa |
| --- | --- | --- |
| `DB_URL` | JDBC MySQL Docker | Chuỗi kết nối database |
| `DB_USERNAME` / `DB_PASSWORD` | `vira_app` / `vira_app_dev` | Database credential local |
| `JWT_SECRET` | Development secret | Bắt buộc thay ở production, tối thiểu 32 byte |
| `SPRING_MAIL_HOST` / `SPRING_MAIL_PORT` | `localhost` / `1025` | SMTP |
| `RESET_PASSWORD_URL` | `http://localhost:5173/reset-password` | URL reset password frontend |
| `SERVER_PORT` | `8080` | Backend port |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Base URL frontend |

Không dùng JWT secret, database password hoặc Mailpit mặc định ở production.

## Kiểm thử và kiểm tra API

```powershell
cd D:\Vira\backend
.\mvnw.cmd test

cd D:\Vira
npm run build
```

Đợt kiểm tra ngày 08/09/2026:

- Health trả `UP`.
- 15/15 API đọc có xác thực trên dữ liệu demo trả HTTP `200`: profile, workspaces, projects, project detail, tasks, backlog, deleted tasks, board, reports overview, members, sprints, notifications, collaboration, comments và attachments.
- Luồng API collaboration đã được gọi thật: `join → leave`; cả `currentUserAssigned` lẫn `currentUserWatching` thay đổi đúng và được trả về trạng thái ban đầu.
- Maven test pass, Vite production build pass, Flyway `V6__task_watchers.sql` đã migrate thành công.

## Giới hạn hiện tại

- Notification là in-app; chưa có WebSocket/SSE hoặc push realtime.
- Docker dùng Mailpit cho email local; production cần SMTP thật.
- Backend hiện có report `overview`; biểu đồ chuyên sâu hoàn toàn server-side cần endpoint riêng.
- Upload dùng filesystem local; production nên dùng object storage, antivirus scanning và backup.
- README này mô tả endpoint có trong source hiện tại; có thể bổ sung Swagger/OpenAPI nếu cần tài liệu API tương tác.
