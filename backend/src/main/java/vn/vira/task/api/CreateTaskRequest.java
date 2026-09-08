package vn.vira.task.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import vn.vira.task.domain.TaskPriority;
import vn.vira.task.domain.TaskType;

public record CreateTaskRequest(
        @NotBlank(message = "Tiêu đề công việc là bắt buộc")
        @Size(max = 500)
        String title,

        @Size(max = 20000)
        String description,

        @NotNull(message = "Loại công việc là bắt buộc")
        TaskType taskType,

        @NotNull(message = "Mức ưu tiên là bắt buộc")
        TaskPriority priority,

        Long parentTaskId,
        LocalDate dueDate,

        @DecimalMin(value = "0.0", inclusive = false, message = "Ước lượng giờ phải lớn hơn 0")
        BigDecimal estimatedHours,

        @jakarta.validation.constraints.Min(value = 0, message = "Story point không được âm")
        Integer storyPoints
) {
}
