package vn.vira.task.domain;

public enum TaskStatus {
    TODO,
    IN_PROGRESS,
    IN_REVIEW,
    DONE,
    BLOCKED,
    ON_HOLD,
    CANCELLED;

    public boolean isTerminal() {
        return this == DONE || this == CANCELLED;
    }
}
