Started at:  2026/09/11 10:03:50
Finished at: 2026/09/11 10:08:15
Total time: 4 minutes
---

# Improvement Walkthrough: Loại bỏ vai trò VIEWER (Project Role)

## Execution Summary

- **Scope:** [2026-09-11-scope.md](file:///d:/vibe-code/Vira-project/docs/improvements/project-roles/2026-09-11-scope.md)
- **Analysis:** [2026-09-11-analysis.md](file:///d:/vibe-code/Vira-project/docs/improvements/project-roles/2026-09-11-analysis.md)
- **Items approved:** 5
- **Items implemented:** 5
- **Items skipped:** 0

## Implementation Log

### Item 1: Xóa `VIEWER` khỏi enum `ProjectRole` và dọn dẹp logic rẽ nhánh ngoại lệ tại backend
- **Category:** Refactoring
- **Location:** `backend/src/main/java/vn/vira/project/domain/ProjectRole.java:7`, `TaskAuthorizationService.java:24,41`, `TaskCollaborationService.java:120,143`
- **Status:** Completed
- **Files modified:**
  - `backend/src/main/java/vn/vira/project/domain/ProjectRole.java`
  - `backend/src/main/java/vn/vira/task/application/TaskAuthorizationService.java`
  - `backend/src/main/java/vn/vira/task/application/TaskCollaborationService.java`
- **Approach:**
  - Tinh giản `ProjectRole` còn 3 vai trò: `OWNER`, `ADMIN`, `MEMBER`.
  - Trong `TaskAuthorizationService`: gỡ bỏ các đoạn kiểm tra `== ProjectRole.VIEWER`. Mọi thành viên trong project đều có quyền tạo công việc và gán/nhận quyền sửa theo quy tắc chuẩn.
  - Trong `TaskCollaborationService`: gỡ bỏ `requireParticipantManager` ngoại lệ `VIEWER` và đơn giản hóa `canManage` để mọi active project member đều có quyền cộng tác.
- **Maps to success criterion:** Criterion 1 & 2

### Item 2: Tạo Flyway migration `V12` chuyển đổi an toàn các bản ghi `VIEWER` sang `MEMBER`
- **Category:** Robustness
- **Location:** `backend/src/main/resources/db/migration/V12__remove_viewer_role.sql`
- **Status:** Completed
- **Files modified:**
  - `backend/src/main/resources/db/migration/V12__remove_viewer_role.sql`
- **Approach:** Viết script SQL `UPDATE project_members SET role = 'MEMBER' WHERE role = 'VIEWER';` để tự động nâng cấp dữ liệu lịch sử khi Spring Boot khởi động, chống lỗi ánh xạ enum.
- **Maps to success criterion:** Criterion 3

### Item 3: Dọn dẹp cờ/prop `isViewer`, bỏ tùy chọn `VIEWER` ở các dropdown và CSS frontend
- **Category:** Refactoring
- **Location:** `src/main.jsx`, `src/styles.css`
- **Status:** Completed
- **Files modified:**
  - `src/main.jsx`
  - `src/styles.css`
- **Approach:**
  - Xóa `ROLE_LABELS.VIEWER`.
  - Bỏ `<option value="VIEWER">` ở cả form mời thành viên và dropdown sửa quyền thành viên.
  - Xóa biến `isViewer` và prop `isViewer` truyền vào `Overview`, `Board`, `Backlog`, `SprintPage`.
  - Xóa các điều kiện ẩn nút "Tạo công việc", "+ Thêm công việc", mở khóa kéo thả trong Backlog và chọn sprint cho toàn bộ thành viên.
  - Xóa class CSS `.role-badge.viewer` và `.role-pill.viewer`.
- **Maps to success criterion:** Criterion 4

### Item 4: Cập nhật Backend Unit Tests
- **Category:** Test Coverage
- **Location:** `TaskAuthorizationServiceTest.java`, `ProjectServiceAuthorizationTest.java`
- **Status:** Completed
- **Files modified:**
  - `backend/src/test/java/vn/vira/task/application/TaskAuthorizationServiceTest.java`
  - `backend/src/test/java/vn/vira/project/application/ProjectServiceAuthorizationTest.java`
- **Approach:**
  - Đổi `viewerCannotManageProject` thành `memberCannotManageProject` (sử dụng `ProjectRole.MEMBER`).
  - Đổi `viewerCannotEditTask` thành `unassignedMemberCannotEditTask` (kiểm tra thành viên không được gán không sửa được task).
  - Đổi `viewerCannotCreateTask` thành `nonMemberCannotCreateTask` (kiểm tra người ngoài dự án bị từ chối tạo task).
  - Loại bỏ stubbing dư thừa trong `memberCanCreateTask`.
- **Maps to success criterion:** Criterion 6

### Item 5: Cập nhật dữ liệu seed demo và tài liệu dự án
- **Category:** Maintenance
- **Location:** `scripts/seed-demo-data.mjs`, `README.md`, `AGENTS.md`
- **Status:** Completed
- **Files modified:**
  - `scripts/seed-demo-data.mjs`
  - `README.md`
  - `AGENTS.md`
- **Approach:** Cập nhật tài khoản `guest@vira.local` mang role `MEMBER` (Demo Contributor); cập nhật ma trận phân quyền dự án chỉ còn 3 vai trò: `OWNER`, `ADMIN`, `MEMBER`.
- **Maps to success criterion:** Criterion 5

## Deviations from Backlog
Implementation followed the approved backlog exactly.

## Known Limitations
None identified. Hệ thống vai trò dự án đã được thu gọn hoàn chỉnh và đồng bộ 100% giữa Database, Backend, Frontend và Test suite.
