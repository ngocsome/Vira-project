package vn.vira.comment.api;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.comment.application.CommentService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping("/projects/{projectId}/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ApiResponse<List<CommentResponse>> findByTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return ApiResponse.ok(
                commentService.findByTask(projectId, taskId),
                "Lấy bình luận thành công"
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CommentResponse> create(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ApiResponse.ok(
                commentService.create(projectId, taskId, request),
                "Thêm bình luận thành công"
        );
    }

    @PatchMapping("/{commentId}/pin")
    public ApiResponse<CommentResponse> togglePinned(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long commentId
    ) {
        return ApiResponse.ok(
                commentService.togglePinned(projectId, taskId, commentId),
                "Cập nhật ghim bình luận thành công"
        );
    }
}
