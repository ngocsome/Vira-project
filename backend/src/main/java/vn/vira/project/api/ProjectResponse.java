package vn.vira.project.api;

import java.time.LocalDate;
import vn.vira.project.domain.ProjectStatus;
import vn.vira.project.domain.ProjectType;

public record ProjectResponse(
        Long id,
        String name,
        String projectKey,
        String description,
        ProjectType projectType,
        ProjectStatus status,
        Long workspaceId,
        Long ownerId,
        LocalDate startDate,
        LocalDate targetEndDate
) {
}
