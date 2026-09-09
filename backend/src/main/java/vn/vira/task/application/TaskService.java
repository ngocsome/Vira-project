package vn.vira.task.application;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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
import vn.vira.task.api.TaskPageResponse;
import vn.vira.task.api.SavedFilterRequest;
import vn.vira.task.api.SavedFilterResponse;
import vn.vira.task.domain.ProjectTaskCounter;
import vn.vira.task.domain.ProjectTaskCounterRepository;
import vn.vira.task.domain.SavedTaskFilter;
import vn.vira.task.domain.SavedTaskFilterRepository;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskStatus;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;
import vn.vira.sprint.domain.Sprint;
import vn.vira.sprint.domain.SprintRepository;
import vn.vira.audit.application.ActivityLogService;

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
    private final TaskAuthorizationService taskAuthorizationService;
    private final ActivityLogService activityLogs;
    private final TaskNotificationService taskNotifications;
    private final SavedTaskFilterRepository savedFilters;

    @Transactional
    public TaskResponse create(Long projectId, CreateTaskRequest request) {
        Project project = projectService.requireManager(projectId);
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

        Task saved = taskRepository.save(task);
        activityLogs.record(saved, "TASK_CREATED", "Tạo công việc");
        return taskMapper.toResponse(saved);
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
    public TaskPageResponse search(Long projectId, String q, TaskStatus status, vn.vira.task.domain.TaskPriority priority, Long assigneeId, Long sprintId, int page, int size) {
        projectService.requireMember(projectId);
        Specification<Task> specification = (root, query, cb) -> cb.and(cb.equal(root.get("project").get("id"), projectId), cb.isNull(root.get("deletedAt")));
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("title")), like), cb.like(cb.lower(root.get("taskCode")), like), cb.like(cb.lower(cb.coalesce(root.get("description"), "")), like)));
        }
        if (status != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        if (priority != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        if (sprintId != null) specification = specification.and((root, query, cb) -> cb.equal(root.get("sprint").get("id"), sprintId));
        if (assigneeId != null) specification = specification.and((root, query, cb) -> cb.equal(root.join("assignees").get("id"), assigneeId));
        var result = taskRepository.findAll(specification, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by("position").ascending()));
        return new TaskPageResponse(result.getContent().stream().map(taskMapper::toResponse).toList(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional public SavedFilterResponse saveFilter(Long projectId, SavedFilterRequest request) {
        Project project = projectService.requireMember(projectId);
        User user = userRepository.getReferenceById(currentUser.id());
        var saved = savedFilters.save(new SavedTaskFilter(project, user, request.name().trim(), request.filters()));
        return new SavedFilterResponse(saved.getId(), saved.getName(), saved.getFilters());
    }
    @Transactional(readOnly = true) public List<SavedFilterResponse> filters(Long projectId) { projectService.requireMember(projectId); return savedFilters.findByProjectIdAndUserIdOrderByUpdatedAtDesc(projectId, currentUser.id()).stream().map(f -> new SavedFilterResponse(f.getId(), f.getName(), f.getFilters())).toList(); }
    @Transactional public void deleteFilter(Long projectId, Long filterId) { projectService.requireMember(projectId); savedFilters.delete(savedFilters.findByIdAndProjectIdAndUserId(filterId, projectId, currentUser.id()).orElseThrow(() -> new NotFoundException("Không tìm thấy bộ lọc đã lưu"))); }

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
        taskAuthorizationService.requireTaskEditor(task);

        if (!task.getVersion().equals(request.version())) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        if (request.status() == TaskStatus.DONE
                && taskRepository.existsByParentTaskIdAndStatusNotAndDeletedAtIsNull(taskId, TaskStatus.DONE)) {
            throw new BusinessException("Không thể hoàn thành công việc cha khi còn công việc con chưa hoàn thành");
        }

        task.changeStatus(request.status());
        activityLogs.record(task, "STATUS_CHANGED", "Trạng thái: " + request.status());
        taskNotifications.notifyParticipants(task, "TASK_STATUS_CHANGED", "Task " + task.getTaskCode() + " đã đổi trạng thái", task.getTitle());
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse move(Long projectId, Long taskId, MoveTaskRequest request) {
        projectService.requireManager(projectId);
        Task task = requireTask(projectId, taskId);
        assertVersion(task, request.version());
        reorder(projectId, task, request.status(), request.position());
        activityLogs.record(task, "TASK_MOVED", "Di chuyển đến " + request.status());
        return taskMapper.toResponse(task);
    }

    @Transactional
    public TaskResponse assignSprint(Long projectId, Long taskId, AssignSprintRequest request) {
        projectService.requireMember(projectId);
        Task task = requireTask(projectId, taskId);
        taskAuthorizationService.requireTaskEditor(task);
        Sprint sprint = request.sprintId() == null ? null : sprintRepository.findByIdAndProjectId(request.sprintId(), projectId)
                .orElseThrow(() -> new BusinessException("Sprint không thuộc dự án hiện tại"));

        task.assignToSprint(sprint);
        activityLogs.record(task, "SPRINT_CHANGED", sprint == null ? "Đưa về Backlog" : "Sprint: " + sprint.getName());
        return taskMapper.toResponse(task);
    }

    @Transactional
    public void softDelete(Long projectId, Long taskId, Long version) {
        projectService.requireManager(projectId);
        Task task = taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));

        if (!task.getVersion().equals(version)) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        task.setDeletedAt(Instant.now());
        activityLogs.record(task, "TASK_DELETED", "Xóa mềm công việc");
    }

    @Transactional
    public TaskResponse restore(Long projectId, Long taskId, Long version) {
        projectService.requireManager(projectId);
        Task task = taskRepository.findByIdAndProjectIdAndDeletedAtIsNotNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc đã xóa"));
        assertVersion(task, version);
        task.setDeletedAt(null);
        activityLogs.record(task, "TASK_RESTORED", "Khôi phục công việc");
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

    private void reorder(Long projectId, Task movingTask, TaskStatus targetStatus, Long requestedPosition) {
        List<Task> ordered = taskRepository.findByProjectIdAndDeletedAtIsNullOrderByPositionAsc(projectId);
        ordered.removeIf(task -> task.getId().equals(movingTask.getId()));

        List<Task> targetColumn = ordered.stream()
                .filter(task -> task.getStatus() == targetStatus)
                .toList();
        int targetIndex = Math.toIntExact(Math.min(Math.max(requestedPosition, 0), targetColumn.size()));
        Task anchor = targetIndex < targetColumn.size() ? targetColumn.get(targetIndex) : null;
        int insertAt = anchor == null ? ordered.size() : ordered.indexOf(anchor);
        ordered.add(insertAt, movingTask);
        movingTask.changeStatus(targetStatus);

        for (int index = 0; index < ordered.size(); index++) {
            ordered.get(index).setPosition((long) index + 1);
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
