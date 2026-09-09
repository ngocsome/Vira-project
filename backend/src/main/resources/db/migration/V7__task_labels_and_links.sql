CREATE TABLE task_labels (
    task_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, label_id),
    CONSTRAINT fk_task_labels_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_labels_label FOREIGN KEY (label_id) REFERENCES labels(id)
);

CREATE TABLE task_links (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_task_id BIGINT NOT NULL,
    target_task_id BIGINT NOT NULL,
    link_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_task_links_source FOREIGN KEY (source_task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_links_target FOREIGN KEY (target_task_id) REFERENCES tasks(id),
    CONSTRAINT uk_task_links UNIQUE (source_task_id, target_task_id, link_type)
);
