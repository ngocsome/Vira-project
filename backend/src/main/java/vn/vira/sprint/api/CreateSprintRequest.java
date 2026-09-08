package vn.vira.sprint.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateSprintRequest(
        @NotBlank(message = "Tên Sprint là bắt buộc")
        @Size(max = 160)
        String name,

        @Size(max = 1000)
        String goal,

        @NotNull(message = "Ngày bắt đầu là bắt buộc")
        LocalDate startDate,

        @NotNull(message = "Ngày kết thúc là bắt buộc")
        LocalDate endDate
) {
}
