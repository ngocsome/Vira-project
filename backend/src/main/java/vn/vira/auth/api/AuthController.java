package vn.vira.auth.api;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.auth.application.AuthService;
import vn.vira.shared.api.ApiResponse;
import vn.vira.shared.security.RequestRateLimiter;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final vn.vira.auth.application.PasswordResetService passwordResetService;
    private final RequestRateLimiter rateLimiter;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request), "Đăng ký thành công");
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check("login", clientIp(httpRequest), 8, Duration.ofMinutes(1));
        return ApiResponse.ok(authService.login(request), "Đăng nhập thành công");
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request), "Làm mới phiên đăng nhập thành công");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check("forgot-password", clientIp(httpRequest), 3, Duration.ofMinutes(15));
        passwordResetService.request(request);
        return ApiResponse.ok(null, "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) { passwordResetService.reset(request); return ApiResponse.ok(null, "Đặt lại mật khẩu thành công"); }

    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
