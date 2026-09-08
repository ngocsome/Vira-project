package vn.vira.user.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.shared.api.ApiResponse;
import vn.vira.user.application.UserProfileService;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class ProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ApiResponse<UserProfileResponse> getMine() {
        return ApiResponse.ok(userProfileService.getMine(), "Lấy hồ sơ thành công");
    }

    @PutMapping
    public ApiResponse<UserProfileResponse> updateMine(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userProfileService.updateMine(request), "Cập nhật hồ sơ thành công");
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(request);
        return ApiResponse.ok(null, "Đổi mật khẩu thành công");
    }
}
