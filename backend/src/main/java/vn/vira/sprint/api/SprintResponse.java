package vn.vira.sprint.api;

import java.time.LocalDate;
import vn.vira.sprint.domain.SprintStatus;

public record SprintResponse(
        Long id,
        Long version,
        String name,
        String goal,
        SprintStatus status,
        LocalDate startDate,
        LocalDate endDate
) {
}
