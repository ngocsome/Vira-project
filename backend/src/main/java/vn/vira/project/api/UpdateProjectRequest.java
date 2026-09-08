package vn.vira.project.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import vn.vira.project.domain.ProjectStatus;
import vn.vira.project.domain.ProjectType;

public record UpdateProjectRequest(
        @NotBlank @Size(max = 180) String name,
        @Size(max = 4000) String description,
        ProjectType projectType,
        ProjectStatus status,
        LocalDate startDate,
        LocalDate targetEndDate
) { }
