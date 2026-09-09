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
        if (isManager(task.getProject().getId(), userId)
                || task.getReporter().getId().equals(userId)
                || task.getAssignees().stream().anyMatch(user -> user.getId().equals(userId))) {
            return;
        }
        throw new AccessDeniedException("Bạn chỉ có thể cập nhật công việc được giao hoặc do mình tạo");
    }

    @Transactional(readOnly = true)
    public boolean isManager(Long projectId) {
        return isManager(projectId, currentUser.id());
    }

    private boolean isManager(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)
                .map(member -> member.getRole() == ProjectRole.OWNER
                        || member.getRole() == ProjectRole.MANAGER
                        || member.getRole() == ProjectRole.LEAD)
                .orElse(false);
    }
}
