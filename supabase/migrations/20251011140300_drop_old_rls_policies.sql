-- Migration: Drop Old Duplicate RLS Policies
-- Description: Removes old RLS policies that exist alongside new optimized versions
-- This fixes the 233 multiple_permissive_policies warnings from the database linter
-- Critical: These duplicate policies are causing WORSE performance because both old and new are being evaluated

-- =====================================================
-- DIRECT MESSAGES - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their own sent messages" ON public.direct_messages;

-- =====================================================
-- FILE UPLOADS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can create their own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can view their own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "insert_own_file_upload" ON public.file_uploads;
DROP POLICY IF EXISTS "select_own_file_upload" ON public.file_uploads;
DROP POLICY IF EXISTS "file_uploads_insert" ON public.file_uploads;
DROP POLICY IF EXISTS "file_uploads_select" ON public.file_uploads;

-- =====================================================
-- GROUP MESSAGES - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can update their own group messages" ON public.group_messages;

-- =====================================================
-- MESSAGE READS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own read receipts" ON public.message_reads;

-- =====================================================
-- STUDY GROUPS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.study_groups;
DROP POLICY IF EXISTS "Group creators can delete groups" ON public.study_groups;
DROP POLICY IF EXISTS "Group creators and admins can update groups" ON public.study_groups;
DROP POLICY IF EXISTS "Users can view groups they are members of or public groups" ON public.study_groups;
DROP POLICY IF EXISTS "Anyone can view public group invite links" ON public.study_groups;

-- =====================================================
-- STUDY GROUP MEMBERS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "users_can_join_groups" ON public.study_group_members;
DROP POLICY IF EXISTS "users_can_leave_groups" ON public.study_group_members;
DROP POLICY IF EXISTS "users_can_view_memberships" ON public.study_group_members;

-- =====================================================
-- USERS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- =====================================================
-- RESOURCES - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can upload resources" ON public.resources;
DROP POLICY IF EXISTS "Users can create resources" ON public.resources;
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Uploaders can update their resources" ON public.resources;
DROP POLICY IF EXISTS "Users can update own resources" ON public.resources;
DROP POLICY IF EXISTS "insert_own_resource" ON public.resources;
DROP POLICY IF EXISTS "resources_insert" ON public.resources;
DROP POLICY IF EXISTS "resources_select" ON public.resources;
DROP POLICY IF EXISTS "select_resources" ON public.resources;
DROP POLICY IF EXISTS "Optimized select access for resources" ON public.resources;

-- =====================================================
-- CHAT MESSAGES - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "allow owner read" ON public.chat_messages;
DROP POLICY IF EXISTS "allow owner write" ON public.chat_messages;

-- =====================================================
-- CHAT SESSIONS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "allow owner all" ON public.chat_sessions;

-- =====================================================
-- COLLABORATIVE NOTES - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read collaborative notes" ON public.collaborative_notes;
DROP POLICY IF EXISTS "Users can create and update collaborative notes" ON public.collaborative_notes;

-- =====================================================
-- DISAPPEARING SETTINGS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view disappearing settings" ON public.disappearing_settings;
DROP POLICY IF EXISTS "Users can update disappearing settings" ON public.disappearing_settings;

-- =====================================================
-- FORUM COMMENTS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Anyone can view forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.forum_comments;

-- =====================================================
-- FORUM POSTS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can create forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Anyone can read forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update own forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.forum_posts;

-- =====================================================
-- GAMIFICATION - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can read own gamification data" ON public.gamification;
DROP POLICY IF EXISTS "Users can view their own gamification data" ON public.gamification;
DROP POLICY IF EXISTS "Users can insert their own gamification data" ON public.gamification;
DROP POLICY IF EXISTS "Users can update own gamification data" ON public.gamification;
DROP POLICY IF EXISTS "Users can update their own gamification data" ON public.gamification;

-- =====================================================
-- GROUP SETTINGS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Group members can view settings" ON public.group_settings;
DROP POLICY IF EXISTS "Group admins can update settings" ON public.group_settings;

-- =====================================================
-- MESSAGE REACTIONS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "User can see reactions in their chats" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can view all reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "User can react to messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can insert their own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "User can delete their own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.message_reactions;

-- =====================================================
-- STUDY PLANS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can create their own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can view their own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can update their own study plans" ON public.study_plans;
DROP POLICY IF EXISTS "Users can delete their own study plans" ON public.study_plans;

-- =====================================================
-- STUDY PLAN TASKS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their study plan tasks" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can view tasks for their study plans" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can create tasks for their study plans" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can update tasks for their study plans" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their study plans" ON public.study_plan_tasks;

-- =====================================================
-- SUBSCRIBERS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Allow service role full access to subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Insert subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;

-- =====================================================
-- USER API KEYS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "allow owner manage keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.user_api_keys;

-- =====================================================
-- USER DOWNLOADS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can add downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can create their own downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can track downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can view own downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can view their downloads" ON public.user_downloads;
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.user_downloads;

-- =====================================================
-- USER FAVORITES - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can create their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can view their favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.user_favorites;

-- =====================================================
-- USER PROGRESS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;

-- =====================================================
-- USER SESSIONS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;

-- =====================================================
-- USER SETTINGS - Drop old policies
-- =====================================================
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
