-- Migration to convert any existing VIEWER project role to MEMBER
UPDATE project_members SET role = 'MEMBER' WHERE role = 'VIEWER';
