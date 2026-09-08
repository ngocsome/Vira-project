CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    last_login_at TIMESTAMP(6) NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    revoked_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),
    INDEX idx_refresh_tokens_user (user_id)
);

CREATE TABLE workspaces (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    owner_id BIGINT NOT NULL,
    archived_at TIMESTAMP(6) NULL,
    CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE workspace_members (
    workspace_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(40) NOT NULL,
    joined_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (workspace_id, user_id),
    CONSTRAINT fk_workspace_members_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT fk_workspace_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    workspace_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    name VARCHAR(180) NOT NULL,
    project_key VARCHAR(12) NOT NULL,
    description TEXT NULL,
    project_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date DATE NULL,
    target_end_date DATE NULL,
    archived_at TIMESTAMP(6) NULL,
    CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT uk_projects_workspace_key UNIQUE (workspace_id, project_key)
);

CREATE TABLE project_members (
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(40) NOT NULL,
    joined_at TIMESTAMP(6) NOT NULL,
    removed_at TIMESTAMP(6) NULL,
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE sprints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    project_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    goal VARCHAR(1000) NULL,
    status VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT chk_sprints_dates CHECK (end_date >= start_date)
);

CREATE TABLE boards (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    project_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_boards_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE board_columns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    board_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    task_status VARCHAR(30) NOT NULL,
    position INT NOT NULL,
    wip_limit INT NULL,
    CONSTRAINT fk_board_columns_board FOREIGN KEY (board_id) REFERENCES boards(id),
    CONSTRAINT uk_board_columns_position UNIQUE (board_id, position)
);

CREATE TABLE labels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(80) NOT NULL,
    color VARCHAR(7) NOT NULL,
    CONSTRAINT fk_labels_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT uk_labels_project_name UNIQUE (project_id, name)
);

CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    project_id BIGINT NOT NULL,
    sprint_id BIGINT NULL,
    parent_task_id BIGINT NULL,
    reporter_id BIGINT NOT NULL,
    task_code VARCHAR(30) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    task_type VARCHAR(30) NOT NULL,
    priority VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    due_date DATE NULL,
    estimated_hours DECIMAL(8,2) NULL,
    story_points INT NULL,
    position BIGINT NOT NULL DEFAULT 0,
    completed_at TIMESTAMP(6) NULL,
    deleted_at TIMESTAMP(6) NULL,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_tasks_sprint FOREIGN KEY (sprint_id) REFERENCES sprints(id),
    CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
    CONSTRAINT fk_tasks_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
    CONSTRAINT uk_tasks_project_code UNIQUE (project_id, task_code),
    INDEX idx_tasks_project_status (project_id, status),
    INDEX idx_tasks_project_sprint (project_id, sprint_id)
);

CREATE TABLE task_assignees (
    task_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_task_assignees_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_task_assignees_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    task_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    parent_comment_id BIGINT NULL,
    body TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP(6) NULL,
    CONSTRAINT fk_comments_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
);

CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    task_id BIGINT NULL,
    actor_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    details JSON NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_activity_logs_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_activity_logs_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_activity_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id),
    INDEX idx_activity_logs_project_created (project_id, created_at)
);
