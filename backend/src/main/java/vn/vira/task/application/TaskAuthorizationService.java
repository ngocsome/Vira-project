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
        var memberOpt = projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId);
        if (memberOpt.isPresent() && memberOpt.get().getRole() == ProjectRole.VIEWER) {
            throw new AccessDeniedException("Người quan sát chỉ có quyền xem, không thể chỉnh sửa công việc");
        }

        if (isAdmin(projectId, userId)
                || task.getReporter().getId().equals(userId)
                || task.getAssignees().stream().anyMatch(user -> user.getId().equals(userId))) {
            return;
        }
        throw new AccessDeniedException("Bạn chỉ có thể cập nhật công việc được giao hoặc do mình tạo");
    }

    @Transactional(readOnly = true)
    public void requireTaskCreator(Long projectId) {
        Long userId = currentUser.id();
        var member = projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải là thành viên của dự án"));
        if (member.getRole() == ProjectRole.VIEWER) {
            throw new AccessDeniedException("Người quan sát chỉ có quyền xem, không thể tạo công việc");
        }
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
