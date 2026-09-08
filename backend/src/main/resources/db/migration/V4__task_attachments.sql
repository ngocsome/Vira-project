CREATE TABLE task_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    task_id BIGINT NOT NULL,
    uploader_id BIGINT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NULL,
    file_size BIGINT NOT NULL,
    CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_attachments_uploader FOREIGN KEY (uploader_id) REFERENCES users(id),
    INDEX idx_task_attachments_task (task_id)
);
