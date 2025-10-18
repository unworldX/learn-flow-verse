-- Fix RLS policies for forum_posts, forum_comments, resources, forum_categories
-- Issue: 403 errors due to auth.uid() not wrapped in SELECT (causes auth_rls_initplan)
-- Solution: Wrap all auth.uid() calls in SELECT for optimized execution

BEGIN;

-- ============================================================================
-- FIX 1: FORUM_POSTS - Wrap auth.uid() in SELECT
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.forum_posts;

-- Create optimized policies with wrapped auth.uid()
CREATE POLICY "forum_posts_select_optimized"
ON public.forum_posts
FOR SELECT
USING (true);  -- Anyone can view posts

CREATE POLICY "forum_posts_insert_optimized"
ON public.forum_posts
FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);  -- Authenticated users can create

CREATE POLICY "forum_posts_update_optimized"
ON public.forum_posts
FOR UPDATE
USING (user_id = (SELECT auth.uid()));  -- Users can update their own

CREATE POLICY "forum_posts_delete_optimized"
ON public.forum_posts
FOR DELETE
USING (user_id = (SELECT auth.uid()));  -- Users can delete their own

-- ============================================================================
-- FIX 2: FORUM_COMMENTS - Wrap auth.uid() in SELECT
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.forum_comments;

-- Create optimized policies with wrapped auth.uid()
CREATE POLICY "forum_comments_select_optimized"
ON public.forum_comments
FOR SELECT
USING (true);  -- Anyone can view comments

CREATE POLICY "forum_comments_insert_optimized"
ON public.forum_comments
FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);  -- Authenticated users can create

CREATE POLICY "forum_comments_update_optimized"
ON public.forum_comments
FOR UPDATE
USING (user_id = (SELECT auth.uid()));  -- Users can update their own

CREATE POLICY "forum_comments_delete_optimized"
ON public.forum_comments
FOR DELETE
USING (user_id = (SELECT auth.uid()));  -- Users can delete their own

-- ============================================================================
-- FIX 3: RESOURCES - Wrap auth.uid() in SELECT
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
DROP POLICY IF EXISTS "Users can upload resources" ON public.resources;
DROP POLICY IF EXISTS "Uploaders can update their resources" ON public.resources;

-- Create optimized policies with wrapped auth.uid()
CREATE POLICY "resources_select_optimized"
ON public.resources
FOR SELECT
USING (true);  -- Anyone can view resources

CREATE POLICY "resources_insert_optimized"
ON public.resources
FOR INSERT
WITH CHECK (uploader_id = (SELECT auth.uid()));  -- Users can upload resources

CREATE POLICY "resources_update_optimized"
ON public.resources
FOR UPDATE
USING (uploader_id = (SELECT auth.uid()));  -- Uploaders can update their resources

-- ============================================================================
-- FIX 4: FORUM_CATEGORIES - Wrap auth.uid() in SELECT
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view forum categories" ON public.forum_categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.forum_categories;

-- Create optimized policies with wrapped auth.uid()
CREATE POLICY "forum_categories_select_optimized"
ON public.forum_categories
FOR SELECT
USING (true);  -- Anyone can view categories

CREATE POLICY "forum_categories_insert_optimized"
ON public.forum_categories
FOR INSERT
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);  -- Authenticated users can create

-- ============================================================================
-- VERIFICATION: Ensure policies were created correctly
-- ============================================================================

DO $$
DECLARE
  forum_posts_count INT;
  forum_comments_count INT;
  resources_count INT;
  forum_categories_count INT;
BEGIN
  -- Count policies for each table
  SELECT COUNT(*) INTO forum_posts_count 
  FROM pg_policies 
  WHERE tablename = 'forum_posts' AND policyname LIKE '%_optimized';
  
  SELECT COUNT(*) INTO forum_comments_count 
  FROM pg_policies 
  WHERE tablename = 'forum_comments' AND policyname LIKE '%_optimized';
  
  SELECT COUNT(*) INTO resources_count 
  FROM pg_policies 
  WHERE tablename = 'resources' AND policyname LIKE '%_optimized';
  
  SELECT COUNT(*) INTO forum_categories_count 
  FROM pg_policies 
  WHERE tablename = 'forum_categories' AND policyname LIKE '%_optimized';
  
  -- Verify counts
  IF forum_posts_count = 4 AND 
     forum_comments_count = 4 AND 
     resources_count = 3 AND 
     forum_categories_count = 2 THEN
    RAISE NOTICE '✅ Forum and Resources RLS fix completed successfully';
    RAISE NOTICE 'Fixed: forum_posts (4 policies), forum_comments (4 policies), resources (3 policies), forum_categories (2 policies)';
    RAISE NOTICE 'All auth.uid() calls now wrapped in SELECT for optimized execution';
    RAISE NOTICE 'Expected behavior: No more 403 errors on forum posts, comments, or resources';
  ELSE
    RAISE WARNING 'Policy count mismatch: forum_posts=%, forum_comments=%, resources=%, forum_categories=%',
      forum_posts_count, forum_comments_count, resources_count, forum_categories_count;
  END IF;
END $$;

COMMIT;
