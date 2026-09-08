package vn.vira.task.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import vn.vira.task.domain.TaskPriority;
import vn.vira.task.domain.TaskStatus;
import vn.vira.task.domain.TaskType;

public record TaskResponse(
        Long id,
        Long version,
        String taskCode,
        String title,
        String description,
        TaskType taskType,
        TaskPriority priority,
        TaskStatus status,
        Long sprintId,
        Long parentTaskId,
        Long reporterId,
        LocalDate dueDate,
        BigDecimal estimatedHours,
        Integer storyPoints,
        Long position
) {
}
