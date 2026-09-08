package vn.vira.bug.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.vira.bug.domain.BugSeverity;

public record UpsertBugRequest(
        @Size(max = 120)
        String environment,

        @NotNull(message = "Mức nghiêm trọng là bắt buộc")
        BugSeverity severity,

        @Size(max = 20000)
        String reproductionSteps,

        @Size(max = 20000)
        String expectedResult,

        @Size(max = 20000)
        String actualResult,

        @Size(max = 100)
        String affectedVersion
) {
}
