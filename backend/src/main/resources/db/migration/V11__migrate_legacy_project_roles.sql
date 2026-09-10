-- Migration to update legacy project roles to the 4 streamlined roles: OWNER, ADMIN, MEMBER, VIEWER
UPDATE project_members SET role = 'ADMIN' WHERE role = 'MANAGER';
UPDATE project_members SET role = 'MEMBER' WHERE role IN ('LEAD', 'DEVELOPER', 'TESTER');
UPDATE project_members SET role = 'VIEWER' WHERE role = 'GUEST';
