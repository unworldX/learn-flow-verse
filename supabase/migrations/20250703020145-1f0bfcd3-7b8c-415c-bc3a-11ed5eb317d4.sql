-- Fix infinite recursion in study_group_members policies
-- Drop problematic policies first
DROP POLICY IF EXISTS "Group admins can add members" ON study_group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove members" ON study_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON study_group_members;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can join study groups" 
ON study_group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave study groups" 
ON study_group_members 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view group memberships" 
ON study_group_members 
FOR SELECT 
USING (
  -- Users can see their own memberships
  auth.uid() = user_id 
  OR 
  -- Users can see memberships of groups they are in
  EXISTS (
    SELECT 1 FROM study_group_members sgm 
    WHERE sgm.group_id = study_group_members.group_id 
    AND sgm.user_id = auth.uid()
  )
);