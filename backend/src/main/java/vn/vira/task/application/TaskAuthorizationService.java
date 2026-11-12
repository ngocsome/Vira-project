package vn.vira.task.application;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.project.domain.ProjectRole;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.domain.Task;

@Service
@RequiredArgsConstructor
public class TaskAuthorizationService {

    private final ProjectMemberRepository projectMemberRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public void requireTaskEditor(Task task) {
        Long userId = currentUser.id();
        Long projectId = task.getProject().getId();

        if (isAdmin(projectId, userId) || isReporterOrAssignee(task, userId)) {
            return;
        }
        throw new AccessDeniedException("Bạn chỉ có thể cập nhật công việc được giao hoặc do mình tạo");
    }

    /**
     * Root tasks can only be deleted by project admins; a subtask can also be deleted
     * by anyone allowed to edit its parent task.
     */
    @Transactional(readOnly = true)
    public void requireTaskDeleter(Task task) {
        Long userId = currentUser.id();
        Long projectId = task.getProject().getId();
        if (isAdmin(projectId, userId)) {
            return;
        }
        Task parent = task.getParentTask();
        if (parent != null && isReporterOrAssignee(parent, userId)) {
            return;
        }
        throw new AccessDeniedException("Bạn không có quyền xóa công việc này");
    }

    private boolean isReporterOrAssignee(Task task, Long userId) {
        return task.getReporter().getId().equals(userId)
                || task.getAssignees().stream().anyMatch(user -> user.getId().equals(userId));
    }

    @Transactional(readOnly = true)
    public void requireTaskCreator(Long projectId) {
        Long userId = currentUser.id();
        projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên của dự án"));
    }

    @Transactional(readOnly = true)
    public boolean isAdmin(Long projectId) {
        return isAdmin(projectId, currentUser.id());
    }

    public boolean isAdmin(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)
                .map(member -> member.getRole() == ProjectRole.OWNER
                        || member.getRole() == ProjectRole.ADMIN)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isManager(Long projectId) {
        return isAdmin(projectId);
    }
}
