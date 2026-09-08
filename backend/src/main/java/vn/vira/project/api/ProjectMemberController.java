package vn.vira.project.api;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.project.application.ProjectMemberService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping("/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    @GetMapping
    public ApiResponse<List<ProjectMemberResponse>> findAll(@PathVariable Long projectId) {
        return ApiResponse.ok(projectMemberService.findAll(projectId), "Lấy thành viên dự án thành công");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectMemberResponse> add(
            @PathVariable Long projectId,
            @Valid @RequestBody AddProjectMemberRequest request
    ) {
        return ApiResponse.ok(projectMemberService.add(projectId, request), "Thêm thành viên thành công");
    }

    @PutMapping("/{userId}")
    public ApiResponse<ProjectMemberResponse> updateRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateProjectMemberRoleRequest request
    ) {
        return ApiResponse.ok(
                projectMemberService.updateRole(projectId, userId, request),
                "Cập nhật vai trò thành công"
        );
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long projectId, @PathVariable Long userId) {
        projectMemberService.remove(projectId, userId);
    }
}
