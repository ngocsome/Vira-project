package vn.vira.board.api;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderBoardColumnsRequest(@NotEmpty List<Long> columnIds) {}
