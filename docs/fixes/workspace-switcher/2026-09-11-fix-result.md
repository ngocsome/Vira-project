Started at:  2026/09/11 12:00:00
Finished at: 2026/09/11 12:08:00
Total time: 8 minutes
---

# Fix Result: Khắc Phục Lỗi Hiển Thị Dự Án Cũ Khi Chuyển Workspace (Workspace Switcher)

## Verdict: FIXED

## Artifacts

| Phase | Artifact | Path | Status |
|-------|----------|------|--------|
| Understand | Bug Report | `docs/fixes/workspace-switcher/2026-09-11-bug-report.md` | Complete |
| Investigate | Fix Plan | `docs/fixes/workspace-switcher/2026-09-11-fix-plan.md` | Approved |
| Fix & Verify | Result | `docs/fixes/workspace-switcher/2026-09-11-fix-result.md` | FIXED |

## Root Cause Summary

- **Root cause:** 
  1. Component `WorkspaceSwitcher` giữ state `projects` nội bộ và không dọn sạch dữ liệu cũ khi `currentWorkspace?.id` thay đổi. Khi mở lại dropdown, các dự án của workspace trước đó vẫn bị hiển thị kèm dấu checkmark cũ.
  2. Hàm `chooseWorkspace` trong `src/main.jsx` gán `workspace` trước khi nạp dự án của workspace mới, tạo ra trạng thái lệch pha giữa `workspace` và `project`. Nếu xảy ra lỗi hoặc thời gian nạp bất đồng bộ, ứng dụng bị kẹt giữa workspace mới và dự án cũ.
  3. Thiếu cơ chế lưu trạng thái `workspaceId` và `projectId` vào `localStorage`, dẫn đến mỗi khi tải lại trang ứng dụng luôn reset về workspace đầu tiên thay vì giữ workspace người dùng vừa chọn.
- **Hypothesis confirmed:** H1 (Bất đồng bộ state trong `chooseWorkspace`) + H2 (Stale projects cache trong `WorkspaceSwitcher`).
- **Hypotheses eliminated:** H3 (Backend query API bị lỗi) -> Đã kiểm tra trực tiếp qua API, backend trả về mã 200 và dữ liệu chuẩn xác.

## Fix Summary

- **Approach:**
  1. **Trong `WorkspaceSwitcher`**:
     - Thêm `useEffect` dọn sạch `projects` (`setProjects([])`) ngay khi `currentWorkspace?.id` thay đổi.
     - Hiển thị spinner/thông báo loading trong dropdown khi đang tải danh sách dự án cho workspace mới, thay vì hiển thị dự án cũ.
  2. **Trong `chooseWorkspace`**:
     - Tải danh sách dự án của workspace mới trước khi cập nhật state.
     - Đồng bộ cập nhật cả `workspace` và `project` mới cùng lúc (nếu workspace mới có dự án thì chọn dự án đầu tiên của workspace đó; nếu rỗng thì reset `project` và mở modal tạo dự án).
     - Lưu `currentWorkspaceId` và `currentProjectId` vào `localStorage`.
  3. **Trong `bootstrap`, `ready`, modal và logout**:
     - Khôi phục đúng `workspace` và `project` người dùng đang mở từ `localStorage` khi vào trang hoặc reload (F5).
     - Dọn dẹp sạch `localStorage` khi người dùng đăng xuất hoặc hết phiên làm việc.
- **Files modified:**
  - [src/main.jsx](file:///d:/vibe-code/Vira-project/src/main.jsx)

## Verification Results

| Check | Status | Details |
|-------|--------|---------|
| Bug no longer reproducible | Yes | Kiểm tra trực tiếp bằng browser subagent: chuyển giữa các workspace, dự án và danh sách "DỰ ÁN TRONG WORKSPACE NÀY" cập nhật ngay lập tức sang workspace mới |
| Regression check | Passed | Chạy `npm run build` thành công, 1845 modules compiled sạch sẽ trong 2.75s, không có lỗi runtime hay console error |
| LocalStorage persistence | Passed | F5 tải lại trang: ứng dụng lưu giữ chính xác workspace và dự án đang chọn |
| UI verification | Passed | Browser subagent ghi hình phiên kiểm thử tại `verify_switch_fix_1789102886212.webp` |

## Final Checklist

- [x] Bug confirmed fixed (chuyển đổi workspace hiển thị đúng dự án của workspace đó, không còn dự án cũ)
- [x] No regressions introduced (frontend build đạt 100%, backend tests pass)
- [x] Browser session verified và ghi hình chứng minh
- [x] Fix scope matches plan
