package vn.vira.workspace.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceRequest(
        @NotBlank(message = "Tên không gian làm việc là bắt buộc")
        @Size(max = 150)
        String name,

        @Size(max = 1000)
        String description
) {
}
