package vn.vira.bug.api;

import vn.vira.bug.domain.BugSeverity;

public record BugResponse(
        Long taskId,
        String environment,
        BugSeverity severity,
        String reproductionSteps,
        String expectedResult,
        String actualResult,
        String affectedVersion
) {
}
