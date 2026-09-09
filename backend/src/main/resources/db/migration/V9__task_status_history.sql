CREATE TABLE task_status_history (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL,
  changed_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_task_status_history_task FOREIGN KEY (task_id) REFERENCES tasks(id),
  INDEX idx_task_status_history_task_time (task_id, changed_at)
);
