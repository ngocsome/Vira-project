package vn.vira.report.application;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.application.ProjectService;
import vn.vira.report.api.ProjectOverviewResponse;
import vn.vira.report.api.ProjectReportsResponse;
import vn.vira.report.api.ReportSeriesPoint;
import vn.vira.report.api.SeverityCountResponse;
import vn.vira.report.api.MemberWorkloadResponse;
import vn.vira.report.api.VelocityPoint;
import vn.vira.report.api.CumulativeFlowPoint;
import vn.vira.bug.domain.BugRepository;
import vn.vira.bug.domain.BugSeverity;
import vn.vira.sprint.domain.SprintRepository;
import vn.vira.sprint.domain.SprintStatus;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskStatus;
import vn.vira.task.domain.TaskType;
import vn.vira.task.domain.TaskStatusHistory;
import vn.vira.task.domain.TaskStatusHistoryRepository;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final BugRepository bugRepository;
    private final TaskStatusHistoryRepository statusHistoryRepository;

    @Transactional(readOnly = true)
    public ProjectOverviewResponse overview(Long projectId) {
        projectService.requireMember(projectId);

        long totalTasks = taskRepository.countByProjectIdAndDeletedAtIsNull(projectId);
        long completedTasks = taskRepository.countByProjectIdAndStatusAndDeletedAtIsNull(
                projectId,
                TaskStatus.DONE
        );
        long overdueTasks = taskRepository.countByProjectIdAndDueDateBeforeAndStatusNotAndDeletedAtIsNull(
                projectId,
                LocalDate.now(),
                TaskStatus.DONE
        );
        long openBugs = taskRepository.countByProjectIdAndTaskTypeAndStatusNotAndDeletedAtIsNull(
                projectId,
                TaskType.BUG,
                TaskStatus.DONE
        );

        var activeSprint = sprintRepository.findByProjectIdAndStatus(projectId, SprintStatus.ACTIVE);
        int completionPercent = totalTasks == 0 ? 0 : (int) Math.round(completedTasks * 100.0 / totalTasks);

        return new ProjectOverviewResponse(
                totalTasks,
                completedTasks,
                completionPercent,
                overdueTasks,
                openBugs,
                activeSprint.map(sprint -> sprint.getId()).orElse(null),
                activeSprint.map(sprint -> sprint.getName()).orElse(null)
        );
    }

    /** Analytics is derived from persisted tasks and completed timestamps; no mock series is returned. */
    @Transactional(readOnly = true)
    public ProjectReportsResponse details(Long projectId) {
        projectService.requireMember(projectId);
        var tasks = taskRepository.findByProjectIdAndDeletedAtIsNullOrderByCreatedAtAsc(projectId);
        return new ProjectReportsResponse(
                burndown(tasks),
                velocity(projectId, tasks),
                cumulativeFlow(tasks, statusHistoryRepository.findByProjectIdOrderByChangedAtAsc(projectId)),
                workload(tasks),
                severity(projectId)
        );
    }

    private List<ReportSeriesPoint> burndown(List<vn.vira.task.domain.Task> tasks) {
        if (tasks.isEmpty()) return List.of();
        LocalDate start = tasks.stream().map(t -> t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate()).min(LocalDate::compareTo).orElse(LocalDate.now());
        LocalDate end = tasks.stream().filter(t -> t.getCompletedAt() != null).map(t -> t.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate()).max(LocalDate::compareTo).orElse(LocalDate.now());
        Map<LocalDate, Long> points = new LinkedHashMap<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            LocalDate pointDate = date;
            long remaining = tasks.stream().filter(t -> t.getCompletedAt() == null || t.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(pointDate)).count();
            points.put(date, remaining);
        }
        return points.entrySet().stream().map(e -> new ReportSeriesPoint(e.getKey().toString(), e.getValue())).toList();
    }

    private List<VelocityPoint> velocity(Long projectId, List<vn.vira.task.domain.Task> tasks) {
        return sprintRepository.findByProjectIdOrderByStartDateDesc(projectId).stream()
                .filter(s -> s.getStatus() == SprintStatus.COMPLETED)
                .map(s -> {
                    var done = tasks.stream().filter(t -> t.getSprint() != null && t.getSprint().getId().equals(s.getId()) && t.getStatus() == TaskStatus.DONE).toList();
                    return new VelocityPoint(s.getId(), s.getName(), done.size(), done.stream().map(vn.vira.task.domain.Task::getStoryPoints).filter(java.util.Objects::nonNull).mapToLong(Integer::longValue).sum());
                }).toList();
    }

    private List<CumulativeFlowPoint> cumulativeFlow(List<vn.vira.task.domain.Task> tasks, List<TaskStatusHistory> histories) {
        if (tasks.isEmpty()) return List.of();
        LocalDate start = tasks.stream().map(task -> task.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate()).min(LocalDate::compareTo).orElse(LocalDate.now());
        Map<Long, List<TaskStatusHistory>> byTask = histories.stream().collect(java.util.stream.Collectors.groupingBy(history -> history.getTask().getId()));
        List<CumulativeFlowPoint> flow = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(LocalDate.now()); date = date.plusDays(1)) {
            LocalDate point = date;
            for (TaskStatus status : TaskStatus.values()) {
                long count = tasks.stream().filter(task -> !task.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(point)).filter(task -> statusAt(task, byTask.getOrDefault(task.getId(), List.of()), point) == status).count();
                flow.add(new CumulativeFlowPoint(point.toString(), status.name(), count));
            }
        }
        return flow;
    }
    private TaskStatus statusAt(vn.vira.task.domain.Task task, List<TaskStatusHistory> events, LocalDate date) {
        return events.stream().filter(event -> !event.getChangedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(date)).max(Comparator.comparing(TaskStatusHistory::getChangedAt)).map(TaskStatusHistory::getStatus).orElse(task.getStatus());
    }

    private List<MemberWorkloadResponse> workload(List<vn.vira.task.domain.Task> tasks) {
        record Load(String name, long open, long hours) {}
        Map<Long, Load> result = new LinkedHashMap<>();
        tasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).forEach(task -> task.getAssignees().forEach(user -> {
            var current = result.getOrDefault(user.getId(), new Load(user.getFullName(), 0, 0));
            long hours = task.getEstimatedHours() == null ? 0 : task.getEstimatedHours().longValue();
            result.put(user.getId(), new Load(user.getFullName(), current.open + 1, current.hours + hours));
        }));
        return result.entrySet().stream().map(e -> new MemberWorkloadResponse(e.getKey(), e.getValue().name(), e.getValue().open(), e.getValue().hours())).sorted(Comparator.comparing(MemberWorkloadResponse::openTasks).reversed()).toList();
    }

    private List<SeverityCountResponse> severity(Long projectId) {
        List<SeverityCountResponse> result = new ArrayList<>();
        for (BugSeverity level : BugSeverity.values()) {
            long count = bugRepository.findAll().stream().filter(b -> b.getTask().getProject().getId().equals(projectId) && b.getSeverity() == level && b.getTask().getStatus() != TaskStatus.DONE).count();
            result.add(new SeverityCountResponse(level.name(), count));
        }
        return result;
    }
}
