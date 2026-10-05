CREATE TABLE project_teams (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_project_teams_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT uk_project_teams_name UNIQUE (project_id, name)
);
CREATE TABLE project_team_members (
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (team_id, user_id),
    CONSTRAINT fk_project_team_members_team FOREIGN KEY (team_id) REFERENCES project_teams(id),
    CONSTRAINT fk_project_team_members_user FOREIGN KEY (user_id) REFERENCES users(id)
);
