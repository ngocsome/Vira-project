package vn.vira.board.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateBoardColumnRequest(
        @NotBlank @Size(max = 100) String name,
        @Min(1) @Max(1000) Integer wipLimit
) { }
