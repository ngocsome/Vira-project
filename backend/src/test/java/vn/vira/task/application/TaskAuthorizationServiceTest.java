package vn.vira.task.application;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import vn.vira.project.domain.Project;
import vn.vira.project.domain.ProjectMember;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.project.domain.ProjectRole;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.domain.Task;
import vn.vira.user.domain.User;

@ExtendWith(MockitoExtension.class)
class TaskAuthorizationServiceTest {
    @Mock private ProjectMemberRepository members;
    @Mock private CurrentUser currentUser;

    @Test
    void guestCannotEditAnotherUsersTask() {
        Task task = task(10L, 99L, Set.of());
        ProjectMember guest = mock(ProjectMember.class);
        when(currentUser.id()).thenReturn(7L);
        when(guest.getRole()).thenReturn(ProjectRole.GUEST);
        when(members.findByProjectIdAndUserIdAndRemovedAtIsNull(10L, 7L)).thenReturn(Optional.of(guest));

        assertThrows(AccessDeniedException.class, () -> service().requireTaskEditor(task));
    }

    @Test
    void assignedMemberCanEditOwnTask() {
        Task task = task(10L, 99L, Set.of(user(7L)));
        when(currentUser.id()).thenReturn(7L);
        when(members.findByProjectIdAndUserIdAndRemovedAtIsNull(10L, 7L)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service().requireTaskEditor(task));
    }

    @Test
    void leadCanEditProjectTask() {
        Task task = mock(Task.class);
        Project project = mock(Project.class);
        when(project.getId()).thenReturn(10L);
        when(task.getProject()).thenReturn(project);
        ProjectMember lead = mock(ProjectMember.class);
        when(currentUser.id()).thenReturn(7L);
        when(lead.getRole()).thenReturn(ProjectRole.LEAD);
        when(members.findByProjectIdAndUserIdAndRemovedAtIsNull(10L, 7L)).thenReturn(Optional.of(lead));

        assertDoesNotThrow(() -> service().requireTaskEditor(task));
    }

    private TaskAuthorizationService service() { return new TaskAuthorizationService(members, currentUser); }
    private Task task(Long projectId, Long reporterId, Set<User> assignees) {
        Task task = mock(Task.class);
        Project project = mock(Project.class);
        User reporter = user(reporterId);
        when(project.getId()).thenReturn(projectId);
        when(task.getProject()).thenReturn(project);
        when(task.getReporter()).thenReturn(reporter);
        when(task.getAssignees()).thenReturn(assignees);
        return task;
    }
    private User user(Long id) { User user = mock(User.class); when(user.getId()).thenReturn(id); return user; }
}
