# Báo cáo tiến độ Vira

_Cập nhật: 09/09/2026 — trạng thái tại thời điểm tạm dừng triển khai._

## Đã hoàn thành

### Bảo mật và phân quyền

- Bổ sung kiểm tra quyền quản trị project cho `OWNER`, `MANAGER`, `LEAD`; `GUEST` và `MEMBER` không thể cập nhật WIP/cấu hình project hoặc xóa task.
- Kiểm tra quyền chỉnh sửa task: chỉ role quản trị project, reporter hoặc assignee mới được cập nhật task.
- Các truy vấn theo project/task kiểm tra membership, không để lộ project không thuộc user qua API thông thường.
- Rate limit in-memory cho login (8 lần/phút/IP), quên mật khẩu (3 lần/15 phút/IP) và upload (20 lần/phút/user+IP); API trả HTTP 429 khi vượt ngưỡng.
- Đã có unit test cho GUEST, assignee, LEAD, IDOR project và rate limiter.

### Task và cộng tác

- Thuật toán kéo-thả Backlog reindex toàn bộ task theo position tuần tự; có test xác nhận không trùng position sau kéo-thả.
- Labels cho project/task, liên kết task (`BLOCKS`, `RELATES_TO`, `DUPLICATES`) và API thêm/xóa/đọc liên kết.
- Assignee, watcher, join/leave task đã có; notification được gửi cho thay đổi status, comment, attachment và phân công.
- Audit ghi nhận tạo/chuyển trạng thái/move/sprint/xóa/khôi phục task; cộng tác, comment, upload, nhãn và liên kết task.

### API và dữ liệu

- Audit API cho project và task.
- Reports API: Burndown, Velocity theo sprint hoàn tất, Cumulative Flow theo trạng thái hiện tại, workload theo thành viên và bug severity.
- Search/filter/pagination server-side cho task; saved filter cá nhân với tạo/đọc/xóa.
- Migration Flyway V7 (labels/task links) và V8 (saved filters) đã áp dụng thành công trên MySQL Docker.
- OpenAPI/Swagger được bật tại `/api/v1/swagger-ui/index.html`.

### Frontend

- Typography hệ thống đã đổi sang Be Vietnam Pro.
- Task detail: labels, tạo/gỡ liên kết task, assignee/watcher, join/leave, comment, attachment và lịch sử task.
- Backlog: tìm kiếm/lọc server-side, debounce và saved filters.
- Kanban: UI cấu hình cột/WIP, cảnh báo khi vượt WIP.
- Audit/history page; reports page sử dụng dữ liệu backend mới.
- Profile và đổi mật khẩu có màn hình riêng.
- Archive/restore: task, project và workspace đều có API/UI; project/workspace có màn hình chọn/khôi phục sau khi archive.

### Vận hành và kiểm thử đã xác nhận

- CI GitHub Actions chạy Maven test, npm install và frontend build.
- Script backup MySQL có sẵn; bổ sung restore MySQL, backup uploads và restore uploads (restore yêu cầu nhập `RESTORE`).
- `mvnw test`: pass (9 tests).
- `npm run build`: pass.
- Docker stack đã khởi động; MySQL/Mailpit healthy, API health và OpenAPI trả HTTP 200.
- Smoke test runtime đã pass: login demo, task search, saved filter tạo/đọc/xóa, audit ghi MySQL, GUEST đọc board HTTP 200 nhưng cập nhật WIP HTTP 403.
- E2E reset password đã pass với tài khoản tạm: đăng ký → forgot password → Mailpit nhận email token → reset → đăng nhập bằng mật khẩu mới.

## Chưa hoàn thành hoặc chưa đủ bằng chứng nghiệm thu

- Chưa có bộ E2E tự động hoàn chỉnh (Playwright/Cypress) cho toàn bộ login/reset/collaboration/upload/archive-restore; các luồng mới chỉ được smoke test thủ công qua API ở mức nêu trên.
- Chưa có integration test chạy trên database thật cho mọi nhánh IDOR giữa **hai workspace/project/task độc lập**. Hiện có unit/service test và smoke test phân quyền GUEST.
- Chưa chạy kiểm thử upload/download thực tế, rate-limit ở HTTP runtime, task collaboration đầy đủ, archive/restore đầy đủ và backup–restore end-to-end trên bản Docker hiện tại.
- Chưa có benchmark performance/load test hay báo cáo responsive thực nghiệm trên trình duyệt/thiết bị thật.
- Cumulative Flow hiện là snapshot theo trạng thái hiện tại, chưa phải chuỗi lịch sử theo ngày; để có CFD lịch sử chính xác cần lưu snapshot hoặc event trạng thái theo thời gian.
- Rate limiter hiện lưu trong memory của một instance; khi chạy nhiều instance cần chuyển sang Redis/gateway distributed rate limit.
- Chưa đo coverage/đặt ngưỡng coverage bằng JaCoCo hoặc quality gate. Vì vậy chưa thể tuyên bố đạt coverage nghiệm thu.
- UI labels hiện hỗ trợ gán label; màn hình quản trị tạo/xóa/chỉnh label riêng chưa hoàn thiện.
- Workspace/project archive UI đã có, nhưng cần kiểm thử đầy đủ trong trình duyệt trước khi nghiệm thu.

## Việc cần làm tiếp theo

1. Chạy E2E có kiểm soát trên Docker: upload/download, comment/watch/assignment, archive/restore task-project-workspace, và xác nhận email reset trong Mailpit.
2. Tạo hai workspace/project test tách biệt để kiểm thử toàn bộ IDOR bằng HTTP (task, attachment, comment, sprint, label, link, report, audit).
3. Chạy backup MySQL + uploads, khôi phục vào môi trường test sạch và so sánh dữ liệu/tệp.
4. Thêm Playwright/Cypress và đưa E2E smoke vào CI có service MySQL/Mailpit.
5. Thêm JaCoCo, đặt ngưỡng coverage theo đặc tả và mở rộng integration test.
6. Làm Cumulative Flow lịch sử đúng chuẩn bằng event/snapshot theo ngày; thực hiện load/performance test.
7. QA responsive trên mobile/tablet/desktop, kiểm tra upload kích thước/định dạng và sửa lỗi UI phát hiện được.

## Cách tiếp tục

```powershell
cd D:\Vira
docker compose -f backend\compose.yaml ps
```

API: `http://localhost:8080/api/v1`  
Swagger: `http://localhost:8080/api/v1/swagger-ui/index.html`  
Mailpit: `http://localhost:8025`
