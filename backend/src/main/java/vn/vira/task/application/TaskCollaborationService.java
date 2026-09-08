package vn.vira.task.application;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.notification.application.NotificationService;
import vn.vira.project.application.ProjectService;
import vn.vira.project.domain.ProjectMember;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.project.domain.ProjectRole;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.api.TaskCollaborationResponse;
import vn.vira.task.api.TaskParticipantResponse;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;

@Service
@RequiredArgsConstructor
public class TaskCollaborationService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public TaskCollaborationResponse find(Long projectId, Long taskId) {
        Task task = requireTask(projectId, taskId);
        return response(task, currentUser.id());
    }

    @Transactional
    public TaskCollaborationResponse replaceAssignees(Long projectId, Long taskId, List<Long> userIds) {
        Task task = requireTask(projectId, taskId);
        requireParticipantManager(projectId);
        Set<User> next = membersOfProject(projectId, userIds);
        Set<Long> previousIds = task.getAssignees().stream().map(User::getId).collect(java.util.stream.Collectors.toSet());
        task.setAssignees(next);
        next.stream()
                .filter(user -> !previousIds.contains(user.getId()) && !user.getId().equals(currentUser.id()))
                .forEach(user -> notificationService.create(
                        user,
                        "TASK_ASSIGNED",
                        "Bạn được giao công việc " + task.getTaskCode(),
                        task.getTitle(),
                        "/projects/" + projectId + "/tasks/" + taskId
                ));
        return response(task, currentUser.id());
    }

    @Transactional
    public TaskCollaborationResponse join(Long projectId, Long taskId) {
        Task task = requireTask(projectId, taskId);
        User user = currentUserEntity();
        task.getAssignees().add(user);
        task.getWatchers().add(user);
        return response(task, user.getId());
    }

    @Transactional
    public TaskCollaborationResponse leave(Long projectId, Long taskId) {
        Task task = requireTask(projectId, taskId);
        Long userId = currentUser.id();
        task.getAssignees().removeIf(user -> user.getId().equals(userId));
        task.getWatchers().removeIf(user -> user.getId().equals(userId));
        return response(task, userId);
    }

    @Transactional
    public TaskCollaborationResponse watch(Long projectId, Long taskId) {
        Task task = requireTask(projectId, taskId);
        task.getWatchers().add(currentUserEntity());
        return response(task, currentUser.id());
    }

    @Transactional
    public TaskCollaborationResponse unwatch(Long projectId, Long taskId) {
        Task task = requireTask(projectId, taskId);
        task.getWatchers().removeIf(user -> user.getId().equals(currentUser.id()));
        return response(task, currentUser.id());
    }

    private Task requireTask(Long projectId, Long taskId) {
        projectService.requireMember(projectId);
        return taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));
    }

    private Set<User> membersOfProject(Long projectId, Collection<Long> userIds) {
        Set<Long> distinctIds = new LinkedHashSet<>(userIds == null ? List.of() : userIds);
        List<User> users = userRepository.findAllById(distinctIds);
        if (users.size() != distinctIds.size()
                || users.stream().anyMatch(user -> !projectMemberRepository.existsByProjectIdAndUserIdAndRemovedAtIsNull(projectId, user.getId()))) {
            throw new BusinessException("Chỉ có thể chọn thành viên đang thuộc dự án");
        }
        return new LinkedHashSet<>(users);
    }

    private ProjectMember requireParticipantManager(Long projectId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, currentUser.id())
                .orElseThrow(() -> new AccessDeniedException("Bạn không có quyền quản lý người tham gia công việc"));
        if (member.getRole() != ProjectRole.OWNER && member.getRole() != ProjectRole.MANAGER && member.getRole() != ProjectRole.LEAD) {
            throw new AccessDeniedException("Bạn không có quyền gán người thực hiện");
        }
        return member;
    }

    private User currentUserEntity() {
        return userRepository.findById(currentUser.id())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private TaskCollaborationResponse response(Task task, Long currentUserId) {
        return new TaskCollaborationResponse(
                task.getAssignees().stream().map(this::participant).toList(),
                task.getWatchers().stream().map(this::participant).toList(),
                task.getAssignees().stream().anyMatch(user -> user.getId().equals(currentUserId)),
                task.getWatchers().stream().anyMatch(user -> user.getId().equals(currentUserId)),
                canManage(task.getProject().getId(), currentUserId)
        );
    }

    private boolean canManage(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)
                .map(member -> member.getRole() == ProjectRole.OWNER || member.getRole() == ProjectRole.MANAGER || member.getRole() == ProjectRole.LEAD)
                .orElse(false);
    }

    private TaskParticipantResponse participant(User user) {
        return new TaskParticipantResponse(user.getId(), user.getFullName(), user.getEmail(), user.getAvatarUrl());
    }
}
