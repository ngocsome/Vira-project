package vn.vira.auth.api;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserSummary user
) {
    public record UserSummary(Long id, String fullName, String email, String avatarUrl) {
    }
}
