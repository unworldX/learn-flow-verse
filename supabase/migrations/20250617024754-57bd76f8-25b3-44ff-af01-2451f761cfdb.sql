
-- Fix RLS policies to use subqueries for better performance
-- This prevents re-evaluation of auth functions for each row

-- Fix subscribers table policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;

CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own subscription" ON public.subscribers
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix reminders table policies
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can create their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

CREATE POLICY "Users can view their own reminders" ON public.reminders
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own reminders" ON public.reminders
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own reminders" ON public.reminders
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own reminders" ON public.reminders
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix study_reminders table policies
DROP POLICY IF EXISTS "Users can manage their reminders" ON public.study_reminders;

CREATE POLICY "Users can view their study reminders" ON public.study_reminders
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their study reminders" ON public.study_reminders
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their study reminders" ON public.study_reminders
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their study reminders" ON public.study_reminders
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix user_settings table policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings" ON public.user_settings
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own settings" ON public.user_settings
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own settings" ON public.user_settings
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix user_downloads table policies
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can create their own downloads" ON public.user_downloads;

CREATE POLICY "Users can view their own downloads" ON public.user_downloads
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own downloads" ON public.user_downloads
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix user_favorites table policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;

CREATE POLICY "Users can view their own favorites" ON public.user_favorites
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own favorites" ON public.user_favorites
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own favorites" ON public.user_favorites
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix user_progress table policies
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;

CREATE POLICY "Users can view their own progress" ON public.user_progress
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own progress" ON public.user_progress
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own progress" ON public.user_progress
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix file_uploads table policies
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can create their own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON public.file_uploads;

CREATE POLICY "Users can view their own uploads" ON public.file_uploads
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own uploads" ON public.file_uploads
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own uploads" ON public.file_uploads
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own uploads" ON public.file_uploads
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix user_api_keys table policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.user_api_keys;

CREATE POLICY "Users can view their own API keys" ON public.user_api_keys
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own API keys" ON public.user_api_keys
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own API keys" ON public.user_api_keys
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own API keys" ON public.user_api_keys
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix user_sessions table policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own sessions" ON public.user_sessions
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own sessions" ON public.user_sessions
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix direct_messages table policies
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Authenticated users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their own sent messages" ON public.direct_messages;

CREATE POLICY "Users can view their own direct messages" ON public.direct_messages
FOR SELECT USING (
  (sender_id = (SELECT auth.uid()) AND NOT deleted_by_sender) OR 
  (receiver_id = (SELECT auth.uid()) AND NOT deleted_by_receiver)
);

CREATE POLICY "Authenticated users can send direct messages" ON public.direct_messages
FOR INSERT WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own sent messages" ON public.direct_messages
FOR UPDATE USING (sender_id = (SELECT auth.uid()));

-- Fix study_plans table policies
DROP POLICY IF EXISTS "Users can view their own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can create their own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can update their own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can delete their own study plans" ON public.study_plans;

CREATE POLICY "Users can view their own study plans" ON public.study_plans
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own study plans" ON public.study_plans
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own study plans" ON public.study_plans
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own study plans" ON public.study_plans
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix study_plan_tasks table policies
DROP POLICY IF EXISTS "Users can view tasks for their study plans" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can create tasks for their study plans" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can update tasks for their study plans" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their study plans" ON public.study_plan_tasks;

CREATE POLICY "Users can view tasks for their study plans" ON public.study_plan_tasks
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can create tasks for their study plans" ON public.study_plan_tasks
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can update tasks for their study plans" ON public.study_plan_tasks
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can delete tasks for their study plans" ON public.study_plan_tasks
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.study_plans WHERE study_plans.id = study_plan_tasks.plan_id AND study_plans.user_id = (SELECT auth.uid()))
);

-- Fix forum_posts table policies
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.forum_posts;

CREATE POLICY "Authenticated users can create posts" ON public.forum_posts
FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update their own posts" ON public.forum_posts
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own posts" ON public.forum_posts
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix forum_comments table policies
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.forum_comments;

CREATE POLICY "Authenticated users can create comments" ON public.forum_comments
FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON public.forum_comments
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own comments" ON public.forum_comments
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix forum_categories table policies
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.forum_categories;

CREATE POLICY "Authenticated users can create categories" ON public.forum_categories
FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Fix study_groups table policies
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON public.study_groups;
DROP POLICY IF EXISTS "Group creators can delete groups" ON public.study_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.study_groups;

CREATE POLICY "Authenticated users can create groups" ON public.study_groups
FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND created_by = (SELECT auth.uid()));

CREATE POLICY "Group creators and admins can update groups" ON public.study_groups
FOR UPDATE USING (
  created_by = (SELECT auth.uid()) OR 
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_groups.id AND user_id = (SELECT auth.uid()) AND role = 'admin')
);

CREATE POLICY "Group creators can delete groups" ON public.study_groups
FOR DELETE USING (created_by = (SELECT auth.uid()));

-- Fix study_group_members table policies
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.study_group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove members" ON public.study_group_members;

CREATE POLICY "Users can view members of groups they belong to" ON public.study_group_members
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.study_group_members sm WHERE sm.group_id = study_group_members.group_id AND sm.user_id = (SELECT auth.uid()))
);

CREATE POLICY "Group admins can add members" ON public.study_group_members
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_group_members.group_id AND user_id = (SELECT auth.uid()) AND role IN ('admin')) OR
  EXISTS (SELECT 1 FROM public.study_groups WHERE id = study_group_members.group_id AND created_by = (SELECT auth.uid()))
);

CREATE POLICY "Users can leave groups or admins can remove members" ON public.study_group_members
FOR DELETE USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = study_group_members.group_id AND user_id = (SELECT auth.uid()) AND role = 'admin') OR
  EXISTS (SELECT 1 FROM public.study_groups WHERE id = study_group_members.group_id AND created_by = (SELECT auth.uid()))
);

-- Fix group_messages table policies
DROP POLICY IF EXISTS "Group members can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can update their own group messages" ON public.group_messages;

CREATE POLICY "Group members can view group messages" ON public.group_messages
FOR SELECT USING (
  deleted_at IS NULL AND
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = group_messages.group_id AND user_id = (SELECT auth.uid()))
);

CREATE POLICY "Group members can send messages" ON public.group_messages
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = group_messages.group_id AND user_id = (SELECT auth.uid())) AND
  sender_id = (SELECT auth.uid())
);

CREATE POLICY "Users can update their own group messages" ON public.group_messages
FOR UPDATE USING (sender_id = (SELECT auth.uid()));

-- Fix message_reads table policies
DROP POLICY IF EXISTS "Users can view their own read receipts" ON public.message_reads;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_reads;

CREATE POLICY "Users can view their own read receipts" ON public.message_reads
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can mark messages as read" ON public.message_reads
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix pinned_chats table policies
DROP POLICY IF EXISTS "User can pin/unpin their own chats" ON public.pinned_chats;
DROP POLICY IF EXISTS "User can insert pins" ON public.pinned_chats;
DROP POLICY IF EXISTS "User can update/unpin their pins" ON public.pinned_chats;
DROP POLICY IF EXISTS "User can delete their own pins" ON public.pinned_chats;

CREATE POLICY "User can pin/unpin their own chats" ON public.pinned_chats
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "User can insert pins" ON public.pinned_chats
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "User can update/unpin their pins" ON public.pinned_chats
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "User can delete their own pins" ON public.pinned_chats
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix message_reactions table policies
DROP POLICY IF EXISTS "User can see reactions in their chats" ON public.message_reactions;
DROP POLICY IF EXISTS "User can react to messages" ON public.message_reactions;
DROP POLICY IF EXISTS "User can delete their own reactions" ON public.message_reactions;

CREATE POLICY "User can see reactions in their chats" ON public.message_reactions
FOR SELECT USING (user_id = (SELECT auth.uid()) OR EXISTS (
  SELECT 1 FROM public.direct_messages dm WHERE (dm.id = message_id AND (dm.sender_id = (SELECT auth.uid()) OR dm.receiver_id = (SELECT auth.uid())))));

CREATE POLICY "User can react to messages" ON public.message_reactions
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "User can delete their own reactions" ON public.message_reactions
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix typing_status table policies
DROP POLICY IF EXISTS "User can manage their own typing" ON public.typing_status;
DROP POLICY IF EXISTS "User can report their own typing" ON public.typing_status;
DROP POLICY IF EXISTS "User can delete their own typing" ON public.typing_status;

CREATE POLICY "User can manage their own typing" ON public.typing_status
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "User can report their own typing" ON public.typing_status
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "User can delete their own typing" ON public.typing_status
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix user_presence table policies
DROP POLICY IF EXISTS "User can update their own presence" ON public.user_presence;
DROP POLICY IF EXISTS "User can insert own presence" ON public.user_presence;

CREATE POLICY "User can update their own presence" ON public.user_presence
FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "User can insert own presence" ON public.user_presence
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
