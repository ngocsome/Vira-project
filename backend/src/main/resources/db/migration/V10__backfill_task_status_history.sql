INSERT INTO task_status_history (task_id, status, changed_at)
SELECT t.id, t.status, t.created_at
FROM tasks t
WHERE NOT EXISTS (
    SELECT 1 FROM task_status_history h WHERE h.task_id = t.id
);
