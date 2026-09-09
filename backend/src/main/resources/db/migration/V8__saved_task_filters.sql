CREATE TABLE saved_task_filters (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  project_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  filters TEXT NOT NULL,
  CONSTRAINT fk_saved_filter_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_saved_filter_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uq_saved_filter_name UNIQUE (project_id, user_id, name)
);
