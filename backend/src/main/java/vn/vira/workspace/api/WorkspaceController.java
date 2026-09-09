package vn.vira.workspace.api;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.shared.api.ApiResponse;
import vn.vira.workspace.application.WorkspaceService;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping
    public ApiResponse<List<WorkspaceResponse>> findMyWorkspaces() {
        return ApiResponse.ok(workspaceService.findMyWorkspaces(), "Lấy danh sách không gian làm việc thành công");
    }
    @GetMapping("/archived") public ApiResponse<List<WorkspaceResponse>> archived() { return ApiResponse.ok(workspaceService.findArchived(), "Lấy không gian đã lưu trữ thành công"); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WorkspaceResponse> create(@Valid @RequestBody CreateWorkspaceRequest request) {
        return ApiResponse.ok(workspaceService.create(request), "Tạo không gian làm việc thành công");
    }

    @PutMapping("/{workspaceId}")
    public ApiResponse<WorkspaceResponse> update(@PathVariable Long workspaceId, @Valid @RequestBody UpdateWorkspaceRequest request) {
        return ApiResponse.ok(workspaceService.update(workspaceId, request), "Cập nhật không gian làm việc thành công");
    }

    @PatchMapping("/{workspaceId}/archive")
    public ApiResponse<WorkspaceResponse> archive(@PathVariable Long workspaceId) {
        return ApiResponse.ok(workspaceService.archive(workspaceId), "Lưu trữ không gian làm việc thành công");
    }
    @PatchMapping("/{workspaceId}/restore") public ApiResponse<WorkspaceResponse> restore(@PathVariable Long workspaceId) { return ApiResponse.ok(workspaceService.restore(workspaceId), "Khôi phục không gian làm việc thành công"); }
}
