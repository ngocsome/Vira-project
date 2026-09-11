INSERT IGNORE INTO workspace_members (workspace_id, user_id, role, joined_at)
SELECT DISTINCT p.workspace_id, pm.user_id, 'MEMBER', pm.joined_at
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.removed_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = p.workspace_id AND wm.user_id = pm.user_id
  );
