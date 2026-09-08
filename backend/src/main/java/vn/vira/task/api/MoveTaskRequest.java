package vn.vira.task.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import vn.vira.task.domain.TaskStatus;

public record MoveTaskRequest(
        @NotNull(message = "Trạng thái đích là bắt buộc")
        TaskStatus status,

        @NotNull(message = "Vị trí là bắt buộc")
        @PositiveOrZero(message = "Vị trí không được âm")
        Long position,

        @NotNull(message = "Version là bắt buộc")
        Long version
) {
}
