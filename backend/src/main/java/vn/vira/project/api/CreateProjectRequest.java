package vn.vira.project.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import vn.vira.project.domain.ProjectType;

public record CreateProjectRequest(
        @NotBlank(message = "Tên dự án là bắt buộc")
        @Size(max = 180)
        String name,

        @NotBlank(message = "Mã dự án là bắt buộc")
        @Pattern(regexp = "[A-Za-z][A-Za-z0-9]{1,11}", message = "Mã dự án chỉ gồm chữ cái và số, dài 2 đến 12 ký tự")
        String projectKey,

        @Size(max = 5000)
        String description,

        @NotNull(message = "Loại dự án là bắt buộc")
        ProjectType projectType,

        LocalDate startDate,
        LocalDate targetEndDate
) {
}
