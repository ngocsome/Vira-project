package vn.vira.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Họ tên là bắt buộc")
        @Size(max = 120, message = "Họ tên không được vượt quá 120 ký tự")
        String fullName,

        @NotBlank(message = "Email là bắt buộc")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 190)
        String email,

        @NotBlank(message = "Mật khẩu là bắt buộc")
        @Size(min = 8, max = 100, message = "Mật khẩu phải có từ 8 đến 100 ký tự")
        String password
) {
}
