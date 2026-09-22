-- Migration script to remove project_id column from conversations table
-- This removes the SchoolProject reference, keeping only ngo_project_id

-- Drop foreign key constraint if exists
ALTER TABLE conversations DROP FOREIGN KEY IF EXISTS conversations_ibfk_1;
ALTER TABLE conversations DROP FOREIGN KEY IF EXISTS fk_conversations_project;

-- Drop the project_id column
ALTER TABLE conversations DROP COLUMN IF EXISTS project_id;

-- Note: This migration assumes all conversations are now linked to NGO projects only
-- Backup your data before running this migration in production
