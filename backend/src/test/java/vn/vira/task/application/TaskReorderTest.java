package vn.vira.task.application;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.vira.audit.application.ActivityLogService;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.security.CurrentUser;
import vn.vira.sprint.domain.SprintRepository;
import vn.vira.task.domain.ProjectTaskCounterRepository;
import vn.vira.task.domain.SavedTaskFilterRepository;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskStatus;
import vn.vira.user.domain.UserRepository;

@ExtendWith(MockitoExtension.class)
class TaskReorderTest {
    @Mock private TaskRepository tasks;
    @Mock private ProjectTaskCounterRepository counters;
    @Mock private ProjectService projects;
    @Mock private UserRepository users;
    @Mock private CurrentUser currentUser;
    @Mock private TaskMapper mapper;
    @Mock private SprintRepository sprints;
    @Mock private TaskAuthorizationService authorization;
    @Mock private ActivityLogService audit;
    @Mock private TaskNotificationService notifications;
    @Mock private SavedTaskFilterRepository filters;

    @Test
    void reindexesEveryTaskToUniqueSequentialPositionsAfterMove() {
        Task first = task(1L, TaskStatus.TODO);
        Task moving = task(2L);
        Task third = task(3L, TaskStatus.TODO);
        when(tasks.findByProjectIdAndDeletedAtIsNullOrderByPositionAsc(9L)).thenReturn(new ArrayList<>(List.of(first, moving, third)));

        ReflectionTestUtils.invokeMethod(service(), "reorder", 9L, moving, TaskStatus.IN_PROGRESS, 0L);

        verify(moving).changeStatus(TaskStatus.IN_PROGRESS);
        verify(first).setPosition(1L);
        verify(third).setPosition(2L);
        verify(moving).setPosition(3L);
    }

    private TaskService service() { return new TaskService(tasks, counters, projects, users, currentUser, mapper, sprints, authorization, audit, notifications, filters); }
    private Task task(Long id) { Task task = mock(Task.class); when(task.getId()).thenReturn(id); return task; }
    private Task task(Long id, TaskStatus status) { Task task = mock(Task.class); when(task.getId()).thenReturn(id); when(task.getStatus()).thenReturn(status); return task; }
}
