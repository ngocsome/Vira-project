package vn.vira.label.api;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
public record CreateLabelRequest(@NotBlank @Size(max = 80) String name, @Pattern(regexp = "#[0-9a-fA-F]{6}") String color) { }
