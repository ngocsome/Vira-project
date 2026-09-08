package vn.vira.user.api;

public record UserProfileResponse(
        Long id,
        String fullName,
        String email,
        String avatarUrl
) {
}
