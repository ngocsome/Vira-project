Started at:  2026/09/10 23:49:00
Finished at: 2026/09/11 00:05:00
Total time: 16 minutes
---

# Improvement Walkthrough: project-roles

## Execution Summary

- **Scope:** [2026-09-10-scope.md](file:///d:/vibe-code/Vira-project/docs/improvements/project-roles/2026-09-10-scope.md)
- **Analysis:** [2026-09-10-analysis.md](file:///d:/vibe-code/Vira-project/docs/improvements/project-roles/2026-09-10-analysis.md)
- **Items approved:** 11
- **Items implemented:** 11
- **Items skipped:** 0

## Implementation Log

### 1. Chuẩn hóa enum `ProjectRole`
- **Category:** Refactoring
- **Location:** `backend/src/main/java/vn/vira/project/domain/ProjectRole.java`
- **Status:** Completed
- **Approach:** Tinh giản enum từ 5 vai trò cũ (`OWNER`, `MANAGER`, `LEAD`, `MEMBER`, `GUEST`) thành 4 vai trò rõ ràng: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.
- **Maps to success criterion:** Criterion 1.

### 2. Sửa lỗi đọc Sprint (`SprintService.findByProject`)
- **Category:** Robustness
- **Location:** `backend/src/main/java/vn/vira/sprint/application/SprintService.java`
- **Status:** Completed
- **Approach:** Đổi từ `requireManager` sang `requireMember` khi xem danh sách Sprint, giúp `MEMBER` và `VIEWER` tải được dự án mà không bị lỗi 403. Quản lý sprint (`create`, `start`, `complete`) yêu cầu `requireAdmin`.
- **Maps to success criterion:** Criterion 5.

### 3. Mở quyền tạo Task cho Member (`TaskService.create`)
- **Category:** Robustness
- **Location:** `backend/src/main/java/vn/vira/task/application/TaskService.java`
- **Status:** Completed
- **Approach:** Chuyển từ `requireManager` sang `requireMember` + `taskAuthorizationService.requireTaskCreator(projectId)`. `OWNER`, `ADMIN`, `MEMBER` được phép tạo task. Chặn triệt để `VIEWER`.
- **Maps to success criterion:** Criterion 2, Criterion 3.

### 4. Mở quyền gán Assignee cho Member (`TaskCollaborationService`)
- **Category:** Robustness
- **Location:** `backend/src/main/java/vn/vira/task/application/TaskCollaborationService.java`
- **Status:** Completed
- **Approach:** `requireParticipantManager` và `canManage` mở quyền cho `MEMBER`, chặn triệt để `VIEWER` ném `AccessDeniedException`.
- **Maps to success criterion:** Criterion 2, Criterion 3.

### 5. Bảo vệ toàn vẹn vai trò Chủ sở hữu (`ProjectMemberService`)
- **Category:** Security / Integrity
- **Location:** `backend/src/main/java/vn/vira/project/application/ProjectMemberService.java`
- **Status:** Completed
- **Approach:** Cấm mời hoặc nâng cấp thành viên lên vai trò `OWNER`. Đổi `requireManager` thành `requireAdmin` (`OWNER` hoặc `ADMIN`).
- **Maps to success criterion:** Criterion 1.

### 6. Cập nhật `TaskAuthorizationService`
- **Category:** Robustness
- **Location:** `backend/src/main/java/vn/vira/task/application/TaskAuthorizationService.java`
- **Status:** Completed
- **Approach:** `requireTaskEditor` chặn tuyệt đối `VIEWER` ném `AccessDeniedException`. Bổ sung `requireTaskCreator`. Cập nhật `isAdmin` kiểm tra `OWNER` hoặc `ADMIN`.
- **Maps to success criterion:** Criterion 2, Criterion 3.

### 7. Đồng bộ UI `MembersPage`
- **Category:** Refactoring
- **Location:** `src/main.jsx`, `src/styles.css`
- **Status:** Completed
- **Approach:** Cập nhật dropdown mời và sửa vai trò với 3 giá trị: `ADMIN`, `MEMBER`, `VIEWER`. Ẩn form mời và dropdown chọn nếu không phải Admin/Owner. Thêm badge hiển thị màu sắc trực quan: Chủ sở hữu (vàng), Quản trị viên (xanh dương), Thành viên (xanh lá), Chỉ xem (xám).
- **Maps to success criterion:** Criterion 4.

### 8. Frontend Permission Guards
- **Category:** UX / Robustness
- **Location:** `src/main.jsx`
- **Status:** Completed
- **Approach:** Tính toán `myRole`, `isViewer`, `isAdmin` từ `members` của dự án. Ẩn nút "Tạo công việc", "Thêm công việc", vô hiệu hóa kéo thả Kanban và phân bổ Sprint nếu là `VIEWER`. Ẩn nút "Cài đặt dự án", "Cấu hình cột/WIP" nếu không phải `ADMIN`/`OWNER`. Hiển thị role pill tại góc user sidebar.
- **Maps to success criterion:** Criterion 3, Criterion 4.

### 9. Cập nhật Demo Seed Scripts
- **Category:** Refactoring
- **Location:** `scripts/seed-demo-data.mjs`, `scripts/seed-members.sql`
- **Status:** Completed
- **Approach:** Khởi tạo tài khoản demo theo 4 vai trò: `Demo Owner` (OWNER), `Demo Admin` (ADMIN), `Demo Member` (MEMBER), `Demo Viewer` (VIEWER). Sửa lỗi chèn `'ADMIN'` vào enum `WorkspaceRole` trong `seed-members.sql` thành `'MEMBER'`.
- **Maps to success criterion:** Criterion 5.

### 10. Cập nhật & Bổ sung Unit Tests
- **Category:** Testing
- **Location:** `backend/src/test/java/vn/vira/task/application/TaskAuthorizationServiceTest.java`, `ProjectServiceAuthorizationTest.java`
- **Status:** Completed
- **Approach:** Bổ sung test case `viewerCannotCreateTask`, `memberCanCreateTask`, `adminCanEditProjectTask`, `adminCanManageProject`, `viewerCannotManageProject`.
- **Maps to success criterion:** Criterion 5.

### 11. Cập nhật Tài liệu dự án
- **Category:** Documentation
- **Location:** `AGENTS.md`, `README.md`
- **Status:** Completed
- **Approach:** Đồng bộ bảng tài khoản demo và ma trận phân quyền 4 vai trò.
- **Maps to success criterion:** Criterion 1.

## Deviations from Backlog
Implementation followed the approved backlog exactly.

## Known Limitations
None identified. Hệ thống phân quyền hiện tại hoạt động đồng nhất, bảo mật và tinh gọn.
