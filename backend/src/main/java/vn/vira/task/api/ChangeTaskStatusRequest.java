package vn.vira.task.api;

import jakarta.validation.constraints.NotNull;
import vn.vira.task.domain.TaskStatus;

public record ChangeTaskStatusRequest(
        @NotNull(message = "Trạng thái là bắt buộc")
        TaskStatus status,

        @NotNull(message = "Version là bắt buộc để tránh ghi đè thay đổi")
        Long version
) {
}
