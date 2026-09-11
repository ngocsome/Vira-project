package vn.vira.project.application;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import vn.vira.audit.application.ActivityLogService;
import vn.vira.board.application.BoardService;
import vn.vira.project.domain.Project;
import vn.vira.project.domain.ProjectMember;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.project.domain.ProjectRepository;
import vn.vira.project.domain.ProjectRole;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.user.domain.UserRepository;
import vn.vira.workspace.application.WorkspaceService;

@ExtendWith(MockitoExtension.class)
class ProjectServiceAuthorizationTest {
    @Mock private ProjectRepository projects;
    @Mock private ProjectMemberRepository members;
    @Mock private UserRepository users;
    @Mock private WorkspaceService workspaces;
    @Mock private CurrentUser currentUser;
    @Mock private ProjectMapper mapper;
    @Mock private BoardService boards;
    @Mock private ActivityLogService activityLogs;

    @Test
    void crossProjectIdorIsHiddenAsNotFound() {
        when(currentUser.id()).thenReturn(7L);
        when(members.existsByProjectIdAndUserIdAndRemovedAtIsNull(42L, 7L)).thenReturn(false);

        assertThrows(NotFoundException.class, () -> service().requireMember(42L));
    }

    @Test
    void memberCannotManageProject() {
        Project project = mock(Project.class);
        ProjectMember member = mock(ProjectMember.class);
        when(currentUser.id()).thenReturn(7L);
        when(members.existsByProjectIdAndUserIdAndRemovedAtIsNull(42L, 7L)).thenReturn(true);
        when(projects.findByIdAndArchivedAtIsNull(42L)).thenReturn(Optional.of(project));
        when(members.findByProjectIdAndUserIdAndRemovedAtIsNull(42L, 7L)).thenReturn(Optional.of(member));
        when(member.getRole()).thenReturn(ProjectRole.MEMBER);

        assertThrows(AccessDeniedException.class, () -> service().requireAdmin(42L));
    }

    @Test
    void adminCanManageProject() {
        Project project = mock(Project.class);
        ProjectMember admin = mock(ProjectMember.class);
        when(currentUser.id()).thenReturn(7L);
        when(members.existsByProjectIdAndUserIdAndRemovedAtIsNull(42L, 7L)).thenReturn(true);
        when(projects.findByIdAndArchivedAtIsNull(42L)).thenReturn(Optional.of(project));
        when(members.findByProjectIdAndUserIdAndRemovedAtIsNull(42L, 7L)).thenReturn(Optional.of(admin));
        when(admin.getRole()).thenReturn(ProjectRole.ADMIN);

        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> service().requireAdmin(42L));
    }

    private ProjectService service() { return new ProjectService(projects, members, users, workspaces, currentUser, mapper, boards, activityLogs); }
}
