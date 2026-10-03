package vn.vira.comment.application;

import java.util.List;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.comment.api.CommentResponse;
import vn.vira.comment.api.CreateCommentRequest;
import vn.vira.comment.domain.Comment;
import vn.vira.comment.domain.CommentRepository;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;
import vn.vira.task.application.TaskNotificationService;
import vn.vira.audit.application.ActivityLogService;
import vn.vira.task.application.TaskAuthorizationService;
import vn.vira.notification.application.NotificationService;
import vn.vira.project.domain.ProjectMemberRepository;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final CurrentUser currentUser;
    private final TaskNotificationService taskNotifications;
    private final ActivityLogService activityLogs;
    private final TaskAuthorizationService taskAuthorizationService;
    private final NotificationService notificationService;
    private final ProjectMemberRepository projectMembers;
    private static final Pattern MENTION = Pattern.compile("(?<![\\w@])@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})");

    @Transactional(readOnly = true)
    public List<CommentResponse> findByTask(Long projectId, Long taskId) {
        projectService.requireMember(projectId);
        requireTask(projectId, taskId);

        return commentRepository.findByTaskIdAndDeletedAtIsNullOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CommentResponse create(Long projectId, Long taskId, CreateCommentRequest request) {
        projectService.requireMember(projectId);
        taskAuthorizationService.requireTaskCreator(projectId);
        Task task = requireTask(projectId, taskId);
        User author = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        Comment parent = findParent(taskId, request.parentCommentId());

        Comment comment = commentRepository.save(new Comment(task, author, parent, request.body().trim()));
        activityLogs.record(task, "COMMENT_CREATED", "Thêm bình luận");
        taskNotifications.notifyParticipants(task, "TASK_COMMENT", "Bình luận mới tại " + task.getTaskCode(), request.body().trim());
        MENTION.matcher(request.body()).results().map(result -> result.group(1)).distinct().forEach(email ->
                userRepository.findByEmailIgnoreCase(email).filter(user ->
                        !user.getId().equals(author.getId()) && projectMembers.existsByProjectIdAndUserIdAndRemovedAtIsNull(projectId, user.getId())
                ).ifPresent(user -> notificationService.create(user, "COMMENT_MENTION", "Bạn được nhắc trong " + task.getTaskCode(), request.body().trim(), "/projects/" + projectId + "/tasks/" + taskId))
        );
        return toResponse(comment);
    }

    @Transactional
    public CommentResponse togglePinned(Long projectId, Long taskId, Long commentId) {
        projectService.requireAdmin(projectId);
        requireTask(projectId, taskId);

        Comment comment = commentRepository.findByIdAndTaskIdAndDeletedAtIsNull(commentId, taskId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bình luận"));
        comment.setPinned(!comment.isPinned());
        activityLogs.record(comment.getTask(), comment.isPinned() ? "COMMENT_PINNED" : "COMMENT_UNPINNED", "Cập nhật ghim bình luận");
        return toResponse(comment);
    }

    private Task requireTask(Long projectId, Long taskId) {
        return taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));
    }

    private Comment findParent(Long taskId, Long parentCommentId) {
        if (parentCommentId == null) {
            return null;
        }

        return commentRepository.findByIdAndTaskIdAndDeletedAtIsNull(parentCommentId, taskId)
                .orElseThrow(() -> new BusinessException("Bình luận cha không thuộc công việc hiện tại"));
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getAvatarUrl(),
                comment.getParentComment() == null ? null : comment.getParentComment().getId(),
                comment.getBody(),
                comment.isPinned(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
