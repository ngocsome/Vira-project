# Báo cáo nghiệm thu kỹ thuật — Vira

_Cập nhật ngày 09/09/2026. Phạm vi: mã nguồn hiện tại, Docker local và CI._

## Tổng quan

Vira là hệ thống quản lý công việc theo workspace/project, hỗ trợ Kanban, Backlog, Sprint, cộng tác task, phân quyền và báo cáo. Các hạng mục chức năng đã được triển khai ở backend và frontend; môi trường Docker hiện gồm API, MySQL, Mailpit và Redis.

## Đã hoàn thành

### Xác thực và bảo mật

- Đăng ký, đăng nhập, refresh token, đổi mật khẩu và đăng xuất.
- Quên mật khẩu bằng email: tạo token một lần có thời hạn, gửi email qua Mailpit và đặt lại mật khẩu bằng token.
- Phân quyền workspace/project/task; người ngoài workspace không thể đọc dữ liệu task, comment, audit hoặc báo cáo của project khác.
- Kiểm tra IDOR qua E2E với hai workspace độc lập.
- Rate limit cho login, quên mật khẩu và upload. Khi chạy Docker, bộ đếm dùng Redis để dùng chung giữa nhiều API instance; request vượt giới hạn nhận HTTP 429.

### Workspace, project và task

- Quản lý workspace/project, thành viên và role project.
- Lưu trữ và khôi phục task, project, workspace.
- Backlog kéo-thả có thuật toán reindex để tránh trùng `position` khi di chuyển nhiều vị trí.
- Kanban có cấu hình cột và giới hạn WIP.
- Tìm kiếm/lọc task phía server, phân trang và lưu bộ lọc cá nhân.

### Cộng tác và theo dõi

- Assignee, watcher, join/leave task.
- Comment, upload/download attachment, notification các thao tác chính.
- Nhãn task, liên kết task (`BLOCKS`, `RELATES_TO`, `DUPLICATES`).
- Màn quản trị nhãn theo project: tạo, sửa, xóa.
- Audit log cho task, project, comment, attachment, assignment, watcher, nhãn, liên kết, trạng thái và archive/restore.

### Báo cáo

- Burndown, Velocity, workload theo thành viên và bug theo severity.
- Cumulative Flow theo lịch sử trạng thái task. Migration V9 ghi event trạng thái cho task mới; V10 tạo mốc nền cho task đã tồn tại trước khi bổ sung lịch sử.

### Frontend

- Font hệ thống Be Vietnam Pro.
- Giao diện quản lý task/cộng tác, reports, audit, filter, Kanban WIP, profile/đổi mật khẩu, archive/restore và nhãn.
- Đã regression bằng Desktop Chrome và Pixel 5 qua Playwright.

## Kiểm thử đã chạy

| Hạng mục | Kết quả |
| --- | --- |
| Maven unit/service test + JaCoCo | Pass; có quality gate instruction baseline 5% |
| Frontend production build | Pass |
| Playwright Desktop Chrome | 4/4 pass |
| Playwright Pixel 5 | 4/4 pass |
| Reset password email/token qua Mailpit | Pass |
| Upload/download thực tế | Pass |
| Task/project/workspace archive–restore | Pass |
| IDOR hai workspace độc lập | Pass; API trả 403/404 an toàn, không lộ dữ liệu |
| Join/watch collaboration | Pass |
| Redis rate limit | Xác nhận chuỗi `200, 200, 200, 429` |
| Backup/restore MySQL và uploads | Đã chạy Docker, API health hoạt động sau restore |
| Performance smoke local | 40 request search, concurrency 8, 0 lỗi, p50 28 ms, p95 75 ms |

## CI và vận hành

GitHub Actions thực hiện:

1. Maven test và JaCoCo.
2. Build API và frontend.
3. Cài Playwright Chromium.
4. Khởi động Docker MySQL, Mailpit, Redis và API.
5. Chờ health endpoint, chạy E2E Chromium và lưu Playwright report làm artifact.

Các script backup/restore hỗ trợ MySQL và thư mục upload. Các thao tác restore yêu cầu gõ `RESTORE` để tránh ghi đè nhầm dữ liệu.

## Giới hạn còn lại trước production

- E2E hiện là smoke/regression cho luồng trọng yếu, chưa phải ma trận mọi role × mọi endpoint. Endpoint mới cần được bổ sung test cùng lúc.
- CFD chính xác tuyệt đối kể từ lúc V9 được áp dụng. Dữ liệu task cũ chỉ có mốc nền, không thể dựng lại các lần đổi trạng thái quá khứ nếu không có nguồn log cũ.
- Performance smoke là số liệu trên máy local, không phải SLA production. Nên thực hiện k6/Gatling trên hạ tầng mục tiêu trước khi công bố ngưỡng tải.
- JaCoCo 5% là quality gate nền để chặn hồi quy; cần nâng dần coverage theo module sau khi chốt đặc tả nghiệm thu.
- Responsive đã được tự động kiểm tra ở desktop và Pixel 5; nếu phạm vi nghiệm thu yêu cầu thì cần QA thủ công iOS/Android và thiết bị thật.

## Cách chạy lại kiểm thử

```powershell
cd D:\Vira
docker compose -f backend\compose.yaml up -d --build
.\backend\mvnw.cmd -f backend\pom.xml test
npm run build
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome
npm run test:performance
```

Các địa chỉ local:

- Frontend: `http://localhost:5173`
- API/Swagger: `http://localhost:8080/api/v1/swagger-ui/index.html`
- Mailpit: `http://localhost:8025`
