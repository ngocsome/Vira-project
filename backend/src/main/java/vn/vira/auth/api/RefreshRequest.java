package vn.vira.auth.api;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(
        @NotBlank(message = "Refresh token là bắt buộc")
        String refreshToken
) {
}
