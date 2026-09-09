package vn.vira.project.api;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/projects/{projectId}")
    public ApiResponse<ProjectResponse> findOne(@PathVariable Long projectId) {
        return ApiResponse.ok(projectService.findOne(projectId), "Lấy chi tiết dự án thành công");
    }

    @GetMapping("/workspaces/{workspaceId}/projects")
    public ApiResponse<List<ProjectResponse>> findByWorkspace(@PathVariable Long workspaceId) {
        return ApiResponse.ok(projectService.findByWorkspace(workspaceId), "Lấy danh sách dự án thành công");
    }
    @GetMapping("/workspaces/{workspaceId}/projects/archived") public ApiResponse<List<ProjectResponse>> archived(@PathVariable Long workspaceId) { return ApiResponse.ok(projectService.findArchivedByWorkspace(workspaceId), "Lấy dự án đã lưu trữ thành công"); }

    @PostMapping("/workspaces/{workspaceId}/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectResponse> create(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        return ApiResponse.ok(projectService.create(workspaceId, request), "Tạo dự án thành công");
    }

    @PutMapping("/projects/{projectId}")
    public ApiResponse<ProjectResponse> update(@PathVariable Long projectId, @Valid @RequestBody UpdateProjectRequest request) {
        return ApiResponse.ok(projectService.update(projectId, request), "Cập nhật dự án thành công");
    }

    @PatchMapping("/projects/{projectId}/archive")
    public ApiResponse<ProjectResponse> archive(@PathVariable Long projectId) {
        return ApiResponse.ok(projectService.archive(projectId), "Lưu trữ dự án thành công");
    }
    @PatchMapping("/projects/{projectId}/restore") public ApiResponse<ProjectResponse> restore(@PathVariable Long projectId) { return ApiResponse.ok(projectService.restore(projectId), "Khôi phục dự án thành công"); }
}
