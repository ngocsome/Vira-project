package vn.vira.user.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Họ tên là bắt buộc")
        @Size(max = 120)
        String fullName,

        @Size(max = 500)
        String avatarUrl
) {
}
