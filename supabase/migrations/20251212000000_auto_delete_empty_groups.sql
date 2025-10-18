-- Auto-delete groups when the last member leaves
-- This trigger will automatically delete a study group when its member count reaches 0

-- Create a function to delete empty groups
CREATE OR REPLACE FUNCTION delete_empty_groups()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the group has any remaining members
  IF NOT EXISTS (
    SELECT 1 FROM study_group_members 
    WHERE group_id = OLD.group_id
  ) THEN
    -- Delete the group if no members remain
    DELETE FROM study_groups WHERE id = OLD.group_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a member is deleted
DROP TRIGGER IF EXISTS auto_delete_empty_groups_trigger ON study_group_members;
CREATE TRIGGER auto_delete_empty_groups_trigger
AFTER DELETE ON study_group_members
FOR EACH ROW
EXECUTE FUNCTION delete_empty_groups();

-- Add comment for documentation
COMMENT ON FUNCTION delete_empty_groups() IS 'Automatically deletes study groups when the last member leaves';
COMMENT ON TRIGGER auto_delete_empty_groups_trigger ON study_group_members IS 'Triggers automatic deletion of empty groups';
