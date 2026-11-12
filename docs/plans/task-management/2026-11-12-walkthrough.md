Started at:  2026/11/12 22:16:00
Finished at: 2026/11/12 22:24:00
Total time: 8 minutes
---

# Implementation Walkthrough: Hoàn thiện quản lý Task & Subtask

## Execution Summary
- **Spec:** [2026-11-12-spec.md](2026-11-12-spec.md)
- **Plan:** [2026-11-12-plan.md](2026-11-12-plan.md)
- **Branch:** main (chưa commit)
- **Implementation approach:** Standard
- **Execution mode:** Sequential Parallel (T1/T2 cùng sửa `TaskService`, T3/T4 cùng sửa `main.jsx`)
- **Tasks completed:** 5/5

## Task Execution Log

### T1: Backend update API — Completed (group A)
- `task/api/UpdateTaskRequest.java` (mới), `task/api/TaskController.java` (`PATCH /{taskId}`), `task/domain/Task.java` (`updateDetails`, `isSubtask`), `task/application/TaskService.java` (`update`).
- Hạn quá khứ chỉ bị kiểm tra khi giá trị hạn thay đổi; tách `assertDueDateNotPast` dùng chung cho create/update.

### T2: Backend subtask rules — Completed (group A)
- `TaskService.findParent` chặn subtask lồng; `softDelete` dùng `requireTaskDeleter` + cascade cùng mốc `deletedAt`; `restore` cascade + chặn khôi phục subtask khi cha đang bị xóa.
- `TaskAuthorizationService.requireTaskDeleter` + tách `isReporterOrAssignee` (dùng chung với `requireTaskEditor`).
- `TaskRepository`: `findByParentTaskIdAndDeletedAtIsNull`, `findByParentTaskIdAndDeletedAt`.

### T3: Frontend edit form — Completed (group B)
- `src/api.js`: `updateTask`. `src/main.jsx`: `TaskEditForm`, nút "Chỉnh sửa", App `saveTaskDetails`; khi 409 tải lại task. Sidebar hiển thị thêm Loại, Hạn, Story point, Ước lượng.

### T4: Frontend subtask section — Completed (group B)
- `SubtaskSection` (danh sách + tiến độ x/y, tạo nhanh, xóa, mở chi tiết), liên kết "Thuộc công việc" từ subtask về cha, App `createSubtask`, `deleteTask` tải lại danh sách sau khi xóa (do cascade).
- `TaskDetails` được gắn `key` theo task id để reset trạng thái chỉnh sửa khi đổi task.
- `src/styles.css`: style cho form sửa và danh sách subtask, responsive < 640px.

### T5: E2E Playwright — Completed (group C)
- `e2e/task-management.spec.js`: 10 test API + 1 test UI (chạy cả desktop và mobile).

## Deviations from Plan
| # | Task | Planned | Actual | Reason |
|---|------|---------|--------|--------|
| 1 | Workflow | Gate riêng cho spec và plan | Duyệt spec + plan trong một lần | Quyết định thiết kế đã được chốt qua câu hỏi trước đó |

### T6 (bổ sung): Gom subtask dưới task cha trên Board & Backlog — Completed
- `src/main.jsx`: helper `groupSubtasks` / `indexTasksById`; `CardSubtasks` (danh sách việc con thu gọn/mở rộng trong thẻ cha trên Board, đếm x/y hoàn thành); `BacklogRow` (subtask hiển thị thụt lề ngay dưới task cha, kèm badge trạng thái); `ParentMarker` (↳ mã cha) cho subtask mà task cha không có trong danh sách hiện tại (vd. Backlog đang lọc).
- Số đếm cột Kanban/WIP chỉ tính thẻ cấp cao nhất; kéo thả vẫn tính vị trí theo toàn bộ task trong cột nên thứ tự backend không lệch.
- `src/styles.css`: style cho danh sách việc con trong thẻ và hàng subtask trong Backlog.
- `.gitignore`: thêm `.claude/`.
- E2E: `should_group_subtasks_under_parent_on_board_and_backlog`.

## Known Limitations
- Trên Board, subtask không kéo thả riêng được (đổi trạng thái subtask qua chi tiết công việc).
- `TaskModal` (component cũ, không còn dùng) vẫn còn trong `main.jsx` — ngoài phạm vi.
