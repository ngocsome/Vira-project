package vn.vira.auth.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.auth.api.AuthResponse;
import vn.vira.auth.api.LoginRequest;
import vn.vira.auth.api.RefreshRequest;
import vn.vira.auth.api.RegisterRequest;
import vn.vira.auth.domain.RefreshToken;
import vn.vira.auth.domain.RefreshTokenRepository;
import vn.vira.auth.security.JwtProperties;
import vn.vira.auth.security.JwtService;
import vn.vira.shared.exception.BusinessException;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Không thể hoàn tất đăng ký với thông tin đã cung cấp");
        }

        User user = new User(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password())
        );

        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException("Thông tin đăng nhập không chính xác"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Thông tin đăng nhập không chính xác");
        }

        user.setLastLoginAt(Instant.now());
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(request.refreshToken()))
                .filter(existing -> existing.isActiveAt(Instant.now()))
                .orElseThrow(() -> new BadCredentialsException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn"));

        token.revoke();
        return issueTokens(token.getUser());
    }

    private AuthResponse issueTokens(User user) {
        String refreshToken = java.util.UUID.randomUUID() + "." + java.util.UUID.randomUUID();
        Instant expiry = Instant.now().plus(jwtProperties.getRefreshTokenDays(), ChronoUnit.DAYS);

        refreshTokenRepository.save(new RefreshToken(user, hash(refreshToken), expiry));

        return new AuthResponse(
                jwtService.createAccessToken(user),
                refreshToken,
                "Bearer",
                jwtService.accessTokenSeconds(),
                new AuthResponse.UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getAvatarUrl())
        );
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Không thể khởi tạo thuật toán băm", exception);
        }
    }
}
