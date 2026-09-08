CREATE TABLE task_watchers (
    task_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_task_watchers_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_watchers_user FOREIGN KEY (user_id) REFERENCES users(id)
);
