package vn.vira.board.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.vira.task.domain.TaskStatus;

public record CreateBoardColumnRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull TaskStatus taskStatus,
        Integer wipLimit
) {}
