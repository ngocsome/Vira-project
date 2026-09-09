# Báo cáo tiến độ Vira

_Cập nhật: 09/09/2026 — xác minh trên Docker local (MySQL, Mailpit, Redis, API)._

## Đã hoàn thành

### Bảo mật và phân quyền

- Bổ sung kiểm tra quyền quản trị project cho `OWNER`, `MANAGER`, `LEAD`; `GUEST` và `MEMBER` không thể cập nhật WIP/cấu hình project hoặc xóa task.
- Kiểm tra quyền chỉnh sửa task: chỉ role quản trị project, reporter hoặc assignee mới được cập nhật task.
- Các truy vấn theo project/task kiểm tra membership, không để lộ project không thuộc user qua API thông thường.
- Rate limit dùng Redis trong Docker, nên bộ đếm được dùng chung giữa nhiều API instance: login (8 lần/phút/IP), quên mật khẩu (3 lần/15 phút/IP+email) và upload (20 lần/phút/user+IP). API trả HTTP 429 khi vượt ngưỡng. Fallback in-memory chỉ dành cho unit test/môi trường không cấu hình Redis.
- Đã có unit test cho GUEST, assignee, LEAD, IDOR project và rate limiter.

### Task và cộng tác

- Thuật toán kéo-thả Backlog reindex toàn bộ task theo position tuần tự; có test xác nhận không trùng position sau kéo-thả.
- Labels cho project/task, liên kết task (`BLOCKS`, `RELATES_TO`, `DUPLICATES`) và API thêm/xóa/đọc liên kết.
- Assignee, watcher, join/leave task đã có; notification được gửi cho thay đổi status, comment, attachment và phân công.
- Audit ghi nhận tạo/chuyển trạng thái/move/sprint/xóa/khôi phục task; cộng tác, comment, upload, nhãn và liên kết task.

### API và dữ liệu

- Audit API cho project và task.
- Reports API: Burndown, Velocity theo sprint hoàn tất, Cumulative Flow theo lịch sử thay đổi trạng thái, workload theo thành viên và bug severity. Flyway V9 lưu event trạng thái cho task mới; V10 tạo mốc nền cho task cũ.
- Search/filter/pagination server-side cho task; saved filter cá nhân với tạo/đọc/xóa.
- Migration Flyway V7 (labels/task links), V8 (saved filters), V9 (task status history) và V10 (backfill history) đã áp dụng thành công trên MySQL Docker.
- OpenAPI/Swagger được bật tại `/api/v1/swagger-ui/index.html`.

### Frontend

- Typography hệ thống đã đổi sang Be Vietnam Pro.
- Task detail: labels, tạo/gỡ liên kết task, assignee/watcher, join/leave, comment, attachment và lịch sử task. Có màn quản trị nhãn riêng để tạo/sửa/xóa.
- Backlog: tìm kiếm/lọc server-side, debounce và saved filters.
- Kanban: UI cấu hình cột/WIP, cảnh báo khi vượt WIP.
- Audit/history page; reports page sử dụng dữ liệu backend mới.
- Profile và đổi mật khẩu có màn hình riêng.
- Archive/restore: task, project và workspace đều có API/UI; project/workspace có màn hình chọn/khôi phục sau khi archive.

### Vận hành và kiểm thử đã xác nhận

- CI GitHub Actions chạy Maven test + JaCoCo quality gate, package API, frontend build, Docker MySQL/Mailpit/Redis và Playwright Chromium; report Playwright được lưu artifact.
- Script backup MySQL có sẵn; bổ sung restore MySQL, backup uploads và restore uploads (restore yêu cầu nhập `RESTORE`).
- `mvnw test`: pass, có JaCoCo report và quality gate instruction baseline 5%.
- `npm run build`: pass.
- Docker stack đã khởi động; MySQL/Mailpit healthy, API health và OpenAPI trả HTTP 200.
- Smoke test runtime đã pass: login demo, task search, saved filter tạo/đọc/xóa, audit ghi MySQL, GUEST đọc board HTTP 200 nhưng cập nhật WIP HTTP 403.
- Playwright E2E Docker pass 4/4 trên Desktop Chrome và Pixel 5: đăng nhập, UI quên mật khẩu, reset bằng token Mailpit, upload/download, task/project/workspace archive–restore, IDOR hai workspace độc lập, join/watch task.
- Backup MySQL + uploads và restore có xác nhận `RESTORE` đã chạy thực tế trên Docker; API health kiểm tra lại thành công sau restore.
- Performance smoke Docker: 40 request search, concurrency 8, 0 lỗi, p50 28 ms, p95 75 ms (máy local, không phải benchmark production).

## Giới hạn cần biết trước khi production

- E2E hiện là smoke/regression cho các luồng trọng yếu, chưa thay thế ma trận kiểm thử mọi tổ hợp role × endpoint. CI có test IDOR hai workspace cho task/report/comment/audit và kiểm thử collaboration; khi mở endpoint mới cần thêm case vào `e2e/lifecycle.spec.js`.
- Cumulative Flow chính xác từ thời điểm V9 được áp dụng. Task cũ có một mốc nền được V10 backfill; các lần chuyển trạng thái lịch sử trước đó không thể khôi phục nếu không có log nguồn.
- Performance smoke là số liệu local có kiểm soát, không phải tải production. Cần chạy k6/Gatling trên hạ tầng mục tiêu trước khi công bố SLA.
- Coverage gate 5% là baseline có tác dụng chặn hồi quy nhưng không phải mục tiêu chất lượng cuối. Nên nâng dần theo module (ví dụ 60–80%) khi đội ngũ chốt đặc tả.
- Responsive đã được regression bằng Pixel 5 và Desktop Chrome; vẫn cần QA thủ công trên thiết bị/iOS thật nếu phạm vi nghiệm thu yêu cầu.

## Lệnh kiểm tra nhanh

```powershell
cd D:\Vira
docker compose -f backend\compose.yaml up -d --build
.\backend\mvnw.cmd -f backend\pom.xml test
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome
npm run test:performance
```

## Cách tiếp tục

```powershell
cd D:\Vira
docker compose -f backend\compose.yaml ps
```

API: `http://localhost:8080/api/v1`  
Swagger: `http://localhost:8080/api/v1/swagger-ui/index.html`  
Mailpit: `http://localhost:8025`
