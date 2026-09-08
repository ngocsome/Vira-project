package vn.vira.project.api;

import jakarta.validation.constraints.NotNull;
import vn.vira.project.domain.ProjectRole;

public record UpdateProjectMemberRoleRequest(
        @NotNull(message = "Vai trò là bắt buộc")
        ProjectRole role
) {
}
