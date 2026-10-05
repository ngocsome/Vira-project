package vn.vira.sprint.api;

/** targetSprintId is null when unfinished work must return to the backlog. */
public record CompleteSprintRequest(Long targetSprintId) {}
