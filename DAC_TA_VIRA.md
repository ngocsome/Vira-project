# Đặc tả yêu cầu phần mềm — Vira

**Tên đề tài:** Đảm bảo chất lượng dự án ứng dụng web quản lý dự án Vira  
**Phiên bản:** 1.0  
**Kiến trúc:** Modular Monolith, Java Spring Boot, MySQL 8

## 1. Mục tiêu và phạm vi

Vira là ứng dụng web quản lý tiến độ dự án theo tư duy Jira, với toàn bộ giao diện và thuật ngữ bằng tiếng Việt. Hệ thống phục vụ các nhóm phát triển phần mềm, lớp học hoặc doanh nghiệp nhỏ cần lập kế hoạch, phân công, theo dõi Sprint, xử lý lỗi và báo cáo tiến độ.

Vira không thay thế công cụ quản lý mã nguồn trong phiên bản đầu. Việc tích hợp GitHub/GitLab, lịch và gửi thông báo thời gian thực là hạng mục mở rộng.

### 1.1. Thuật ngữ

| Thuật ngữ | Ý nghĩa trong Vira |
|---|---|
| Không gian làm việc | Khu vực chung chứa thành viên và nhiều dự án |
| Dự án | Một sản phẩm/công việc cần quản lý, ví dụ `VIRA` |
| Công việc | Đơn vị thực hiện; gồm User Story, Task, Bug, Cải tiến hoặc công việc con |
| Backlog | Danh sách công việc chưa đưa vào Sprint |
| Sprint | Chu kỳ thực hiện có ngày bắt đầu, kết thúc và mục tiêu |
| Bảng công việc | Bảng Kanban/Scrum trực quan hóa các trạng thái công việc |
| Vấn đề | Rủi ro/trở ngại không nhất thiết là lỗi phần mềm |

## 2. Người dùng, vai trò và phân quyền

| Vai trò | Phạm vi quyền |
|---|---|
| Quản trị hệ thống | Quản trị người dùng, dữ liệu hệ thống, sao lưu và nhật ký |
| Chủ sở hữu dự án | Toàn quyền trong dự án, kể cả cấu hình và thành viên |
| Quản lý dự án | Dự án, Backlog, Sprint, báo cáo và phân công |
| Trưởng nhóm | Phân công, cập nhật bảng và theo dõi nhóm phụ trách |
| Thành viên | Tạo/cập nhật công việc được cho phép, bình luận, báo lỗi |
| Khách | Chỉ xem dữ liệu được chia sẻ |

Phân quyền phải được kiểm tra ở backend cho từng API. Các quyền tối thiểu: `PROJECT_VIEW`, `PROJECT_EDIT`, `MEMBER_MANAGE`, `TASK_CREATE`, `TASK_EDIT`, `TASK_ASSIGN`, `SPRINT_MANAGE`, `BOARD_MANAGE`, `REPORT_VIEW`, `PROJECT_ARCHIVE`.

## 3. Yêu cầu chức năng

### FR-01 — Đăng ký, đăng nhập và hồ sơ

- Người dùng đăng ký bằng họ tên, email và mật khẩu; email là duy nhất.
- Người dùng đăng nhập, đăng xuất, làm mới phiên đăng nhập, quên/đặt lại mật khẩu và đổi mật khẩu.
- Người dùng sửa ảnh đại diện và thông tin hồ sơ.
- Hệ thống không tiết lộ email nào đã tồn tại trong luồng quên mật khẩu.

**Tiêu chí chấp nhận:** mật khẩu không bao giờ được lưu dạng rõ; thông tin xác thực sai trả về thông báo chung; token hết hạn không truy cập được API cần xác thực.

### FR-02 — Không gian làm việc và dự án

- Tạo, xem, sửa và lưu trữ không gian làm việc/dự án.
- Dự án có: tên, mã dự án duy nhất trong không gian, mô tả, loại (Scrum/Kanban), chủ sở hữu, ngày bắt đầu/kết thúc dự kiến và trạng thái.
- Lưu trữ dự án không xóa lịch sử; dự án lưu trữ không tạo được công việc mới.
- Trang tổng quan hiển thị tiến độ, việc quá hạn, Sprint hiện tại và lỗi đang mở.

### FR-03 — Nhóm, thành viên và quyền

- Mời thành viên qua email, thay đổi vai trò hoặc ngừng quyền truy cập.
- Tạo nhóm theo chuyên môn (ví dụ Backend, Frontend, Kiểm thử) và gán thành viên.
- Người bị xóa khỏi dự án vẫn được giữ trong lịch sử thao tác; không còn được truy cập dữ liệu dự án.

### FR-04 — Công việc và phân công

- Tạo, xem, sửa, xóa mềm và khôi phục công việc.
- Trường bắt buộc: mã việc tự sinh (`VIRA-101`), tiêu đề, loại, trạng thái, độ ưu tiên, người tạo và dự án.
- Trường tùy chọn: mô tả, một/nhiều người thực hiện, người theo dõi, hạn hoàn thành, ước lượng giờ, Story Point, nhãn, Sprint, công việc cha.
- Hỗ trợ công việc con và liên kết công việc (liên quan, chặn, bị chặn bởi).

### FR-05 — Ưu tiên, thời hạn và trạng thái

- Độ ưu tiên: Thấp, Trung bình, Cao, Khẩn cấp.
- Trạng thái mặc định: Cần thực hiện, Đang thực hiện, Chờ kiểm tra, Hoàn thành; có thể có Bị chặn, Tạm dừng, Đã hủy.
- Khi quá hạn mà chưa hoàn thành, hệ thống gắn cờ quá hạn và gửi thông báo.
- Không thể hoàn thành công việc cha khi còn công việc con chưa hoàn thành.
- Mọi thay đổi trạng thái, hạn hoặc người thực hiện được ghi vào lịch sử.

### FR-06 — Backlog

- Hiển thị công việc chưa thuộc Sprint hoặc chưa hoàn thành.
- Sắp xếp bằng kéo-thả, lọc và tìm kiếm; ưu tiên thứ tự được lưu bền vững.
- Thêm/bỏ một hoặc nhiều công việc khỏi Sprint.
- Cảnh báo công việc chưa ước lượng khi đưa vào Sprint.

### FR-07 — Sprint

- Tạo Sprint với tên, mục tiêu, ngày bắt đầu/kết thúc và danh sách công việc.
- Chỉ một Sprint có trạng thái `ĐANG_DIEN_RA` trong mỗi dự án Scrum.
- Bắt đầu/kết thúc Sprint; khi kết thúc, chuyển việc chưa hoàn thành về Backlog hoặc Sprint đích do quản lý chọn.
- Tính tổng Story Point kế hoạch và hoàn thành.

### FR-08 — Bảng Kanban/Scrum

- Mỗi dự án có bảng mặc định với các cột Cần thực hiện, Đang thực hiện, Chờ kiểm tra, Hoàn thành.
- Quản lý có thể thêm, đổi tên, đổi thứ tự cột và đặt giới hạn WIP.
- Kéo-thả thẻ công việc giữa cột/cùng cột để đổi trạng thái và thứ tự.
- Hiển thị mã việc, tiêu đề, ưu tiên, hạn, người thực hiện và cờ bị chặn.
- Cảnh báo nhưng không chặn thao tác khi vượt WIP (có thể cấu hình thành chặn ở tương lai).

### FR-09 — Lỗi và vấn đề

- Bug là một loại công việc có thêm: môi trường, mức nghiêm trọng, bước tái hiện, kết quả mong đợi/thực tế, phiên bản ảnh hưởng.
- Luồng Bug: Mới ghi nhận → Đã xác nhận → Đang sửa → Chờ kiểm thử → Đã đóng; có trạng thái Không tái hiện được.
- Vấn đề/Blocker có mức ảnh hưởng, người phụ trách, ngày phát hiện và kế hoạch xử lý.

### FR-10 — Bình luận và tệp đính kèm

- Bình luận, phản hồi bình luận, nhắc thành viên bằng `@`, ghim bình luận.
- Đính kèm PDF, DOCX, XLSX, ZIP hoặc ảnh theo cấu hình loại tệp/dung lượng.
- Kiểm tra quyền tải/xem tệp theo quyền xem công việc.

### FR-11 — Thông báo, tìm kiếm và lọc

- Thông báo khi được giao việc, bị nhắc tên, thay đổi trạng thái/hạn, có bình luận, sắp quá hạn/quá hạn, Sprint sắp kết thúc.
- Cho phép đánh dấu đã đọc và xem danh sách thông báo chưa đọc.
- Tìm theo mã, tiêu đề và mô tả; lọc theo dự án, Sprint, trạng thái, ưu tiên, người thực hiện, nhãn, loại và hạn.
- Người dùng lưu được bộ lọc cá nhân.

### FR-12 — Tiến độ, báo cáo và thống kê

- Dashboard dự án: tổng việc, % hoàn thành, việc quá hạn, việc theo trạng thái, lỗi mở và Sprint đang chạy.
- Báo cáo Burndown theo Sprint, Velocity qua các Sprint, Cumulative Flow, khối lượng theo thành viên, lỗi theo mức nghiêm trọng và báo cáo quá hạn.
- Dữ liệu báo cáo được lọc theo quyền người xem.

## 4. Quy tắc nghiệp vụ quan trọng

1. Một mã dự án chỉ duy nhất trong một không gian; mã công việc duy nhất trong dự án.
2. Ngày kết thúc Sprint phải không sớm hơn ngày bắt đầu.
3. Công việc thuộc Sprint chỉ thuộc một Sprint tại một thời điểm.
4. Người được phân công phải là thành viên hoạt động của dự án.
5. Khách không được tạo/sửa/xóa dữ liệu.
6. Dữ liệu xóa mềm giữ nguyên để audit và khôi phục.
7. Hạn hoàn thành không được sớm hơn ngày tạo; ngoại lệ phải được ghi nhận bởi người có quyền.
8. Khi hai người cùng sửa công việc, dùng `version` (optimistic locking) để từ chối ghi đè im lặng.
9. Chỉ API có quyền mới được chuyển trạng thái hoặc thay đổi vị trí thẻ.

## 5. Kiến trúc kỹ thuật

Vira sử dụng **modular monolith**: triển khai một Spring Boot application nhưng phân tách theo miền nghiệp vụ để dễ bảo trì và có thể tách dịch vụ về sau.

```text
Trình duyệt (Desktop/Mobile)
          │ HTTPS / REST API
          ▼
Spring Boot Monolith
 ├─ security, auth, user
 ├─ workspace, project, member
 ├─ task, backlog, sprint, board
 ├─ bug, comment, attachment
 ├─ notification, search, report, audit
          │
          ├── MySQL 8 (dữ liệu giao dịch)
          ├── Redis (cache, rate-limit, token/queue tùy chọn)
          ├── MinIO/S3 (tệp đính kèm)
          └── SMTP provider (email)
```

Khuyến nghị: Java 21, Spring Boot 3.x, Spring Security, Spring Data JPA, Flyway, MySQL 8, Redis, MinIO, OpenAPI/Swagger, Docker Compose, JUnit 5, Mockito và Testcontainers.

## 6. Mô hình dữ liệu cốt lõi

```text
users ─< workspace_members >─ workspaces ─< projects
users ─< project_members  >─ projects ─< sprints
projects ─< tasks ─< comments
                  ├─< attachments
                  ├─< task_assignees >─ users
                  ├─< task_watchers  >─ users
                  ├─< task_labels >─ labels
                  └─< activity_logs
tasks ──(parent_task_id)──> tasks
projects ─< boards ─< board_columns
```

Các bảng bổ sung: `roles`, `permissions`, `role_permissions`, `task_links`, `notifications`, `refresh_tokens`, `saved_filters`, `audit_logs`.

`tasks` cần có tối thiểu: `id`, `project_id`, `parent_task_id`, `sprint_id`, `task_code`, `title`, `description`, `type`, `priority`, `status`, `reporter_id`, `due_date`, `estimated_hours`, `story_points`, `position`, `version`, `created_at`, `updated_at`, `completed_at`, `deleted_at`.

## 7. API REST tối thiểu

| Nhóm | Endpoint tiêu biểu |
|---|---|
| Xác thực | `POST /api/v1/auth/register`, `/login`, `/refresh`, `/forgot-password` |
| Dự án | `GET/POST /api/v1/projects`, `GET/PUT /api/v1/projects/{id}` |
| Thành viên | `GET/POST /api/v1/projects/{id}/members`, `PUT /members/{userId}` |
| Công việc | `GET/POST /api/v1/projects/{id}/tasks`, `GET/PUT /api/v1/tasks/{id}` |
| Bảng | `GET /api/v1/projects/{id}/board`, `PATCH /api/v1/tasks/{id}/move` |
| Sprint | `POST /api/v1/projects/{id}/sprints`, `PATCH /api/v1/sprints/{id}/start`, `/complete` |
| Cộng tác | `POST /api/v1/tasks/{id}/comments`, `/attachments` |
| Báo cáo | `GET /api/v1/projects/{id}/reports/overview`, `/burndown` |

Mọi API trả về cấu trúc thống nhất gồm `success`, `data`, `message`, `timestamp`, và khi phân trang có `page`, `size`, `totalElements`, `totalPages`.

## 8. Yêu cầu phi chức năng và nghiệm thu

| Mã | Yêu cầu | Cách chứng minh |
|---|---|---|
| NFR-01 | 100% giao diện tiếng Việt, dễ hiểu | Review UI và test người dùng mới |
| NFR-02 | Responsive từ 360px tới desktop | Test giao diện tại 360, 768, 1024, 1440px |
| NFR-03 | API thông dụng p95 ≤ 2 giây | Kịch bản tải: đăng nhập, bảng, danh sách việc, tìm kiếm |
| NFR-04 | Bảo mật/phân quyền | Integration test theo ma trận vai trò-quyền; kiểm thử truy cập trái quyền |
| NFR-05 | Toàn vẹn dữ liệu | FK, unique index, transaction, validation, optimistic locking và test concurrency |
| NFR-06 | Mở rộng | Module hóa, API stateless, Docker hóa; có cache cho truy vấn đọc nhiều |
| NFR-07 | Sao lưu/phục hồi | Backup MySQL hằng ngày, lưu bản sao tối thiểu 7 ngày, diễn tập restore |
| NFR-08 | Nhất quán/dễ dùng | Design system, trạng thái và màu nhất quán; kiểm thử usability |

## 9. Kế hoạch đảm bảo chất lượng

| Tầng kiểm thử | Phạm vi | Công cụ gợi ý |
|---|---|---|
| Unit test | Quy tắc Sprint, quyền, chuyển trạng thái, tính tiến độ | JUnit 5, Mockito |
| Integration test | Controller, DB, Security, API | Spring Boot Test, Testcontainers MySQL |
| E2E | Đăng nhập → tạo dự án → tạo Sprint → kéo việc → báo cáo | Playwright hoặc Cypress |
| Security test | RBAC, IDOR, XSS, SQL injection, upload tệp | OWASP ZAP, test API tự động |
| Performance test | Dashboard, board, danh sách và tìm kiếm | k6 hoặc JMeter |
| Backup test | Backup rồi phục hồi trên DB sạch | mysqldump/mysql hoặc công cụ quản trị |
| UAT | Nhóm người dùng mới thực hiện kịch bản nghiệp vụ | Biên bản nghiệm thu |

Tiêu chí phát hành MVP: 100% test bắt buộc pass; không còn lỗi Critical/High; Service coverage từ 70%; p95 các API thường dùng không quá 2 giây; kiểm thử khôi phục dữ liệu thành công.

## 10. Lộ trình triển khai

1. **Nền tảng:** xác thực, cấu trúc module, migration, người dùng, workspace, dự án và RBAC.
2. **Luồng công việc MVP:** Task, phân công, trạng thái, hạn, Kanban, bình luận và thông báo trong hệ thống.
3. **Scrum:** Backlog, Sprint, Story Point, Burndown và Velocity.
4. **Chất lượng và vận hành:** Bug/Issue, tệp đính kèm, tìm kiếm, báo cáo, backup/restore, audit, performance/security test.
5. **Mở rộng:** WebSocket, PWA, tích hợp GitHub/GitLab/Google Calendar, Gantt/Roadmap.

## 11. Gợi ý màn hình MVP

- Đăng nhập / Đăng ký / Quên mật khẩu.
- Trang chủ cá nhân: việc của tôi, việc sắp quá hạn, thông báo.
- Danh sách dự án và trang tổng quan dự án.
- Backlog, Sprint và bảng công việc.
- Chi tiết công việc dạng modal/trang riêng: mô tả, người phụ trách, bình luận, lịch sử, tệp.
- Thành viên & quyền, lỗi/vấn đề, báo cáo, cài đặt dự án.

Nguyên tắc UI: dùng nhãn tiếng Việt dễ hiểu, màu ưu tiên nhất quán (xanh/vàng/cam/đỏ), luôn có thông tin bằng văn bản song song với màu, nút “+ Tạo công việc” dễ thấy, và ưu tiên thao tác xem/cập nhật trạng thái trên điện thoại.
