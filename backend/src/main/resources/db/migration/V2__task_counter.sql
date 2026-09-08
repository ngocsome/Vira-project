CREATE TABLE project_task_counters (
    project_id BIGINT PRIMARY KEY,
    next_sequence BIGINT NOT NULL,
    CONSTRAINT fk_project_task_counters_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
);
