package vn.vira.user.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.user.api.UpdateProfileRequest;
import vn.vira.user.api.UserProfileResponse;
import vn.vira.user.api.ChangePasswordRequest;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getMine() {
        return toResponse(requireCurrentUser());
    }

    @Transactional
    public UserProfileResponse updateMine(UpdateProfileRequest request) {
        User user = requireCurrentUser();
        user.setFullName(request.fullName().trim());
        user.setAvatarUrl(normalize(request.avatarUrl()));
        return toResponse(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = requireCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không chính xác");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new vn.vira.shared.exception.BusinessException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    private User requireCurrentUser() {
        return userRepository.findById(currentUser.id())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getAvatarUrl()
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
