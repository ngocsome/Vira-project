package vn.vira.task.api;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateTaskParticipantsRequest(@NotNull List<@NotNull Long> userIds) {
}
