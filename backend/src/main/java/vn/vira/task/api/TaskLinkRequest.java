package vn.vira.task.api;
import jakarta.validation.constraints.NotNull;
import vn.vira.task.domain.TaskLinkType;
public record TaskLinkRequest(@NotNull Long targetTaskId, @NotNull TaskLinkType linkType) { }
