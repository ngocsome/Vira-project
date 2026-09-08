package vn.vira.project.api;

import java.time.Instant;
import vn.vira.project.domain.ProjectRole;

public record ProjectMemberResponse(
        Long userId,
        String fullName,
        String email,
        String avatarUrl,
        ProjectRole role,
        Instant joinedAt
) {
}
