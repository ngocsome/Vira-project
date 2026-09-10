INSERT IGNORE INTO workspace_members (workspace_id, user_id, role, joined_at) VALUES 
(1, 2, 'MEMBER', NOW(6)), 
(1, 3, 'MEMBER', NOW(6)), 
(1, 4, 'MEMBER', NOW(6)), 
(1, 5, 'MEMBER', NOW(6));

INSERT IGNORE INTO task_assignees (task_id, user_id) VALUES 
(1, 1), 
(1, 2), 
(1, 3), 
(1, 4);

INSERT IGNORE INTO task_watchers (task_id, user_id) VALUES 
(1, 1), 
(1, 2), 
(1, 3), 
(1, 4);
