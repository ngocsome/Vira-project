package vn.vira.task.api;

import java.util.List;

public record TaskPageResponse(List<TaskResponse> items, int page, int size, long totalItems, int totalPages) {}
