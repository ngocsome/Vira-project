package vn.vira.report.application;

import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.application.ProjectService;
import vn.vira.report.api.ProjectOverviewResponse;
import vn.vira.sprint.domain.SprintRepository;
import vn.vira.sprint.domain.SprintStatus;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskStatus;
import vn.vira.task.domain.TaskType;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;

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
}
