package vn.vira.bug.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.bug.application.BugService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping("/projects/{projectId}/tasks/{taskId}/bug")
@RequiredArgsConstructor
public class BugController {

    private final BugService bugService;

    @GetMapping
    public ApiResponse<BugResponse> find(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return ApiResponse.ok(bugService.find(projectId, taskId), "Lấy thông tin lỗi thành công");
    }

    @PutMapping
    public ApiResponse<BugResponse> upsert(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody UpsertBugRequest request
    ) {
        return ApiResponse.ok(
                bugService.upsert(projectId, taskId, request),
                "Cập nhật thông tin lỗi thành công"
        );
    }
}
