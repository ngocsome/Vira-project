Started at:  2026/09/11 11:40:00
Finished at: 2026/09/11 11:41:00
Total time: 1 minute
---

# Bug Report: Workspace Switcher Vẫn Hiển Thị Dự Án Của Workspace Cũ Khi Chuyển Workspace

## Symptoms

- **Error message:** Không có thông báo lỗi hiển thị trên UI, nhưng dữ liệu dự án không đổi.
- **Stack trace:** None.
- **Affected area:** Component `WorkspaceSwitcher` và hàm `chooseWorkspace` trong `src/main.jsx` (kèm theo endpoint lấy danh sách dự án theo workspace).

## Reproduction

1. Đăng nhập tài khoản có từ 2 workspace trở lên (ví dụ: `Test1` và `Công ty cc`).
2. Đang ở workspace công ty A (`Test1`), mở dropdown `WorkspaceSwitcher` từ sidebar.
3. Click vào công ty B (`Công ty cc`) trong danh sách **KHÔNG GIAN LÀM VIỆC CỦA BẠN**.
4. Kiểm tra lại dự án đang hiển thị.
- **Reproducibility:** Always
- **Environment:** React Frontend + Spring Boot Backend (local dev).

## Expected vs Actual

- **Expected:** Hệ thống chuyển ngữ cảnh sang Workspace B, tải và hiển thị danh sách dự án của Workspace B.
- **Actual:** Hệ thống vẫn hiển thị dự án của Workspace A.

## Context

- **Recent changes:** Cập nhật cơ chế phân quyền dự án và truy vấn dự án theo thành viên trong backend; đồng thời cấu trúc `WorkspaceSwitcher` quản lý state độc lập.
- **Domain skills referenced:** `debug-fe`, `api-design`.

## Hypotheses

| # | Hypothesis | Likelihood | Mechanism | Evidence Needed | Where to Look |
|---|-----------|-----------|-----------|-----------------|---------------|
| 1 | Hàm `chooseWorkspace` trong `src/main.jsx` gặp lỗi hoặc không đồng bộ `project` và `workspace`, khiến dropdown/app giữ `project` của workspace cũ | High | `chooseWorkspace` gọi `viraApi.projects` nhưng nếu có lỗi hoặc logic đồng bộ state bị lệch giữa `workspace` và `project`, dropdown vẫn nhận `currentProject` cũ | Kiểm tra `chooseWorkspace` và state `workspace`/`project` trong `App` | `src/main.jsx` (hàm `chooseWorkspace`, component `App`) |
| 2 | Component `WorkspaceSwitcher` dùng state `projects` nội bộ tải theo `currentWorkspace.id` khi mở dropdown, nhưng khi click chuyển workspace thì dropdown đóng và không re-sync hoặc lấy nhầm `currentWorkspace` cũ | High | `loadData` trong `WorkspaceSwitcher` chỉ chạy khi `isOpen = true`, nếu `currentWorkspace` thay đổi khi đóng thì lần sau mở ra có thể gặp race condition hoặc stale data | Kiểm tra lifecycle và useEffect trong `WorkspaceSwitcher` | `src/main.jsx` (component `WorkspaceSwitcher`) |
| 3 | API backend `/workspaces/{workspaceId}/projects` trả về lỗi (403 Forbidden / 404 / 500) do logic `isWorkspaceAdmin` hoặc `findActiveByWorkspaceIdAndMemberUserId` vừa thay đổi gần đây | Medium | User `tam@gmail.com` ở `Công ty cc` có role `MEMBER`, câu truy vấn `findActiveByWorkspaceIdAndMemberUserId` có thể bị lỗi JPQL hoặc security | Kiểm tra kết quả gọi API backend cho workspace mới | `backend/.../ProjectService.java`, logs |
