package vn.vira.comment.api;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long authorId,
        String authorName,
        String authorAvatarUrl,
        Long parentCommentId,
        String body,
        boolean pinned,
        Instant createdAt,
        Instant updatedAt
) {
}
