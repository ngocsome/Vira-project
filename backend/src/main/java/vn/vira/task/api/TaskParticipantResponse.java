package vn.vira.task.api;

public record TaskParticipantResponse(
        Long userId,
        String fullName,
        String email,
        String avatarUrl
) {
}
