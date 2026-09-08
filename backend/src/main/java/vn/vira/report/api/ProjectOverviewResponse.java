package vn.vira.report.api;

public record ProjectOverviewResponse(
        long totalTasks,
        long completedTasks,
        int completionPercent,
        long overdueTasks,
        long openBugs,
        Long activeSprintId,
        String activeSprintName
) {
}
