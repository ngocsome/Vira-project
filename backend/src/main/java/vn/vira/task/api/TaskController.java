package vn.vira.task.api;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.shared.api.ApiResponse;
import vn.vira.task.application.TaskService;

@RestController
@RequestMapping("/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ApiResponse<List<TaskResponse>> findByProject(@PathVariable Long projectId) {
        return ApiResponse.ok(taskService.findByProject(projectId), "Lấy danh sách công việc thành công");
    }

    @GetMapping("/search")
    public ApiResponse<TaskPageResponse> search(@PathVariable Long projectId, @RequestParam(required = false) String q, @RequestParam(required = false) vn.vira.task.domain.TaskStatus status, @RequestParam(required = false) vn.vira.task.domain.TaskPriority priority, @RequestParam(required = false) Long assigneeId, @RequestParam(required = false) Long sprintId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.ok(taskService.search(projectId, q, status, priority, assigneeId, sprintId, page, size), "Tìm kiếm công việc thành công");
    }

    @GetMapping("/filters") public ApiResponse<List<SavedFilterResponse>> filters(@PathVariable Long projectId) { return ApiResponse.ok(taskService.filters(projectId), "Lấy bộ lọc đã lưu thành công"); }
    @PostMapping("/filters") @ResponseStatus(HttpStatus.CREATED) public ApiResponse<SavedFilterResponse> saveFilter(@PathVariable Long projectId, @Valid @RequestBody SavedFilterRequest request) { return ApiResponse.ok(taskService.saveFilter(projectId, request), "Lưu bộ lọc thành công"); }
    @DeleteMapping("/filters/{filterId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteFilter(@PathVariable Long projectId, @PathVariable Long filterId) { taskService.deleteFilter(projectId, filterId); }

    @GetMapping("/backlog")
    public ApiResponse<List<TaskResponse>> findBacklog(@PathVariable Long projectId) {
        return ApiResponse.ok(taskService.findBacklog(projectId), "Lấy Backlog thành công");
    }

    @GetMapping("/deleted")
    public ApiResponse<List<TaskResponse>> findDeleted(@PathVariable Long projectId) {
        return ApiResponse.ok(taskService.findDeleted(projectId), "Lấy công việc đã xóa thành công");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        return ApiResponse.ok(taskService.create(projectId, request), "Tạo công việc thành công");
    }

    @PatchMapping("/{taskId}/status")
    public ApiResponse<TaskResponse> changeStatus(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody ChangeTaskStatusRequest request
    ) {
        return ApiResponse.ok(
                taskService.changeStatus(projectId, taskId, request),
                "Cập nhật trạng thái công việc thành công"
        );
    }

    @PatchMapping("/{taskId}/move")
    public ApiResponse<TaskResponse> move(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody MoveTaskRequest request
    ) {
        return ApiResponse.ok(taskService.move(projectId, taskId, request), "Di chuyển công việc thành công");
    }

    @PatchMapping("/{taskId}/sprint")
    public ApiResponse<TaskResponse> assignSprint(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody AssignSprintRequest request
    ) {
        return ApiResponse.ok(
                taskService.assignSprint(projectId, taskId, request),
                "Cập nhật Sprint cho công việc thành công"
        );
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void softDelete(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestParam Long version
    ) {
        taskService.softDelete(projectId, taskId, version);
    }

    @PatchMapping("/{taskId}/restore")
    public ApiResponse<TaskResponse> restore(@PathVariable Long projectId, @PathVariable Long taskId, @RequestParam Long version) {
        return ApiResponse.ok(taskService.restore(projectId, taskId, version), "Khôi phục công việc thành công");
    }
}
