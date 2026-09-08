package vn.vira.project.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import vn.vira.project.domain.ProjectRole;

public record AddProjectMemberRequest(
        @Email(message = "Email không đúng định dạng")
        String email,

        @NotNull(message = "Vai trò là bắt buộc")
        ProjectRole role
) {
}
