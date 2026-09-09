package vn.vira.task.api;
import jakarta.validation.constraints.NotNull;
import java.util.List;
public record UpdateTaskLabelsRequest(@NotNull List<@NotNull Long> labelIds) { }
