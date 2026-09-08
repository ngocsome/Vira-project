package vn.vira.task.application;

import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.application.ProjectService;
import vn.vira.project.domain.Project;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.api.ChangeTaskStatusRequest;
import vn.vira.task.api.AssignSprintRequest;
import vn.vira.task.api.CreateTaskRequest;
import vn.vira.task.api.MoveTaskRequest;
import vn.vira.task.api.TaskResponse;
import vn.vira.task.domain.ProjectTaskCounter;
import vn.vira.task.domain.ProjectTaskCounterRepository;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskStatus;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;
import vn.vira.sprint.domain.Sprint;
import vn.vira.sprint.domain.SprintRepository;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectTaskCounterRepository counterRepository;
    private final ProjectService projectService;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;
    private final TaskMapper taskMapper;
    private final SprintRepository sprintRepository;

    @Transactional
    public TaskResponse create(Long projectId, CreateTaskRequest request) {
        Project project = projectService.requireMember(projectId);
        User reporter = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        Task parentTask = findParent(projectId, request.parentTaskId());

        if (request.dueDate() != null && request.dueDate().isBefore(java.time.LocalDate.now())) {
            throw new BusinessException("Hạn hoàn thành không được là ngày trong quá khứ");
        }

        String taskCode = nextTaskCode(project);
        long position = taskRepository.countByProjectIdAndDeletedAtIsNull(projectId) + 1;

        Task task = new Task(
                project,
                parentTask,
                reporter,
                taskCode,
                request.title().trim(),
                normalize(request.description()),
                request.taskType(),
                request.priority(),
                request.dueDate(),
                request.estimatedHours(),
                request.storyPoints(),
                position
        );

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findByProject(Long projectId) {
        projectService.requireMember(projectId);

        return taskRepository.findByProjectIdAndDeletedAtIsNullOrderByPositionAsc(projectId)
                .stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findBacklog(Long projectId) {
        projectService.requireMember(projectId);

        return taskRepository.findByProjectIdAndSprintIsNullAndStatusNotAndDeletedAtIsNullOrderByPositionAsc(
                        projectId,
                        TaskStatus.DONE
                )
                .stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findDeleted(Long projectId) {
        projectService.requireMember(projectId);
        return taskRepository.findByProjectIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(projectId)
                .stream().map(taskMapper::toResponse).toList();
    }

    @Transactional
    public TaskResponse changeStatus(Long projectId, Long taskId, ChangeTaskStatusRequest request) {
        projectService.requireMember(projectId);
        Task task = taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));

        if (!task.getVersion().equals(request.version())) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        if (request.status() == TaskStatus.DONE
                && taskRepository.existsByParentTaskIdAndStatusNotAndDeletedAtIsNull(taskId, TaskStatus.DONE)) {
            throw new BusinessException("Không thể hoàn thành công việc cha khi còn công việc con chưa hoàn thành");
        }

        task.changeStatus(request.status());
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse move(Long projectId, Long taskId, MoveTaskRequest request) {
        projectService.requireMember(projectId);
        Task task = requireTask(projectId, taskId);
        assertVersion(task, request.version());
        task.move(request.status(), request.position());
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse assignSprint(Long projectId, Long taskId, AssignSprintRequest request) {
        projectService.requireMember(projectId);
        Task task = requireTask(projectId, taskId);
        Sprint sprint = request.sprintId() == null ? null : sprintRepository.findByIdAndProjectId(request.sprintId(), projectId)
                .orElseThrow(() -> new BusinessException("Sprint không thuộc dự án hiện tại"));

        task.assignToSprint(sprint);
        return taskMapper.toResponse(task);
    }

    @Transactional
    public void softDelete(Long projectId, Long taskId, Long version) {
        projectService.requireMember(projectId);
        Task task = taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));

        if (!task.getVersion().equals(version)) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        task.setDeletedAt(Instant.now());
    }

    @Transactional
    public TaskResponse restore(Long projectId, Long taskId, Long version) {
        projectService.requireMember(projectId);
        Task task = taskRepository.findByIdAndProjectIdAndDeletedAtIsNotNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc đã xóa"));
        assertVersion(task, version);
        task.setDeletedAt(null);
        return taskMapper.toResponse(task);
    }

    private Task findParent(Long projectId, Long parentTaskId) {
        if (parentTaskId == null) {
            return null;
        }

        return taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(parentTaskId, projectId)
                .orElseThrow(() -> new BusinessException("Công việc cha không thuộc dự án hiện tại"));
    }

    private Task requireTask(Long projectId, Long taskId) {
        return taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));
    }

    private void assertVersion(Task task, Long expectedVersion) {
        if (!task.getVersion().equals(expectedVersion)) {
            throw new ObjectOptimisticLockingFailureException(Task.class, task.getId());
        }
    }

    private String nextTaskCode(Project project) {
        ProjectTaskCounter counter = counterRepository.findForUpdate(project.getId())
                .orElseGet(() -> counterRepository.saveAndFlush(new ProjectTaskCounter(project.getId())));

        return project.getProjectKey() + "-" + counter.takeNext();
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
