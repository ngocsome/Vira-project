CREATE TABLE bugs (
    task_id BIGINT PRIMARY KEY,
    environment VARCHAR(120) NULL,
    severity VARCHAR(20) NOT NULL,
    reproduction_steps TEXT NULL,
    expected_result TEXT NULL,
    actual_result TEXT NULL,
    affected_version VARCHAR(100) NULL,
    CONSTRAINT fk_bugs_task FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(60) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(1000) NULL,
    target_url VARCHAR(500) NULL,
    read_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notifications_user_read_created (user_id, read_at, created_at)
);
