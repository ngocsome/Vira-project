package vn.vira.task.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SavedFilterRequest(@NotBlank @Size(max = 120) String name, @NotBlank @Size(max = 4000) String filters) {}
