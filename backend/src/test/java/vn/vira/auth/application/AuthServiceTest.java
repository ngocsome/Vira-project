package vn.vira.auth.application;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.vira.auth.api.RegisterRequest;
import vn.vira.auth.domain.RefreshTokenRepository;
import vn.vira.auth.security.JwtProperties;
import vn.vira.auth.security.JwtService;
import vn.vira.shared.exception.BusinessException;
import vn.vira.user.domain.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private JwtProperties jwtProperties;
    @InjectMocks private AuthService authService;

    @Test
    void rejectsExistingEmailWithoutSavingUser() {
        when(userRepository.existsByEmailIgnoreCase("duplicate@example.com")).thenReturn(true);

        assertThrows(BusinessException.class, () -> authService.register(
                new RegisterRequest("Người dùng", " Duplicate@Example.com ", "password-123")
        ));

        verify(userRepository, never()).save(any());
    }

    @Test
    void hashesPasswordBeforeSavingNewUser() {
        when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password-123")).thenReturn("bcrypt-hash");
        when(jwtProperties.getRefreshTokenDays()).thenReturn(14L);
        when(jwtService.accessTokenSeconds()).thenReturn(1800L);
        when(jwtService.createAccessToken(any())).thenReturn("access-token");

        authService.register(new RegisterRequest("Người dùng", "new@example.com", "password-123"));

        verify(passwordEncoder).encode("password-123");
        verify(userRepository).save(any());
        verify(refreshTokenRepository).save(any());
    }
}
