package vn.vira.report.api;

public record MemberWorkloadResponse(Long userId, String fullName, long openTasks, long estimatedHours) {}
