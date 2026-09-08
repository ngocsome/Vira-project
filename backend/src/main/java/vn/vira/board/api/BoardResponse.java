package vn.vira.board.api;

import java.util.List;

public record BoardResponse(
        Long id,
        String name,
        List<BoardColumnResponse> columns
) {
}
