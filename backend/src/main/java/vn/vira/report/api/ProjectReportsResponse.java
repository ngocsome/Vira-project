package vn.vira.report.api;

import java.util.List;

public record ProjectReportsResponse(
        List<ReportSeriesPoint> burndown,
        List<VelocityPoint> velocity,
        List<ReportSeriesPoint> cumulativeFlow,
        List<MemberWorkloadResponse> memberWorkload,
        List<SeverityCountResponse> bugSeverity
) {}
