package vn.vira.board.api;

import vn.vira.task.domain.TaskStatus;

public record BoardColumnResponse(
        Long id,
        String name,
        TaskStatus taskStatus,
        Integer position,
        Integer wipLimit
) {
}
