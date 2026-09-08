package vn.vira.task.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.shared.api.ApiResponse;
import vn.vira.task.application.TaskCollaborationService;

@RestController
@RequestMapping("/projects/{projectId}/tasks/{taskId}/collaboration")
@RequiredArgsConstructor
public class TaskCollaborationController {

    private final TaskCollaborationService collaborationService;

    @GetMapping
    public ApiResponse<TaskCollaborationResponse> find(@PathVariable Long projectId, @PathVariable Long taskId) {
        return ApiResponse.ok(collaborationService.find(projectId, taskId), "Lấy người tham gia công việc thành công");
    }

    @PutMapping("/assignees")
    public ApiResponse<TaskCollaborationResponse> replaceAssignees(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskParticipantsRequest request
    ) {
        return ApiResponse.ok(collaborationService.replaceAssignees(projectId, taskId, request.userIds()), "Cập nhật người thực hiện thành công");
    }

    @PostMapping("/join")
    public ApiResponse<TaskCollaborationResponse> join(@PathVariable Long projectId, @PathVariable Long taskId) {
        return ApiResponse.ok(collaborationService.join(projectId, taskId), "Đã tham gia công việc");
    }

    @DeleteMapping("/leave")
    public ApiResponse<TaskCollaborationResponse> leave(@PathVariable Long projectId, @PathVariable Long taskId) {
        return ApiResponse.ok(collaborationService.leave(projectId, taskId), "Đã rời công việc");
    }

    @PostMapping("/watch")
    public ApiResponse<TaskCollaborationResponse> watch(@PathVariable Long projectId, @PathVariable Long taskId) {
        return ApiResponse.ok(collaborationService.watch(projectId, taskId), "Đã theo dõi công việc");
    }

    @DeleteMapping("/watch")
    public ApiResponse<TaskCollaborationResponse> unwatch(@PathVariable Long projectId, @PathVariable Long taskId) {
        return ApiResponse.ok(collaborationService.unwatch(projectId, taskId), "Đã bỏ theo dõi công việc");
    }
}
