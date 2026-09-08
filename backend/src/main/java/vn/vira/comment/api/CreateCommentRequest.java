package vn.vira.comment.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "Nội dung bình luận là bắt buộc")
        @Size(max = 10000)
        String body,

        Long parentCommentId
) {
}
