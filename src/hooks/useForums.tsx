
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleRLSError } from '@/lib/auth';

export interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ForumPost {
  id: string;
  user_id: string;
  category_id: string;
  subject: string;
  content: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
  category?: {
    name: string;
  };
  comments?: ForumComment[];
}

export interface ForumComment {
  id: string;
  user_id: string;
  post_id: string;
  comment_text: string | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
  };
}

export const useForums = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('id, name, description, created_at')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error fetching categories:', error);
      toast({
        title: "Error loading categories",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          id,
          user_id,
          category_id,
          subject,
          content,
          created_at,
          users:user_id (full_name, email),
          forum_categories:category_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error fetching posts:', error);
      toast({
        title: "Error loading posts",
        description: friendlyMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createPost = async (postData: {
    subject: string;
    content: string;
    category_id: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: user.id,
          subject: postData.subject,
          content: postData.content,
          category_id: postData.category_id
        });

      if (error) throw error;

      toast({
        title: "Post created",
        description: "Your post has been created successfully"
      });

      fetchPosts();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  };

  const createComment = async (commentData: {
    post_id: string;
    comment_text: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          user_id: user.id,
          post_id: commentData.post_id,
          comment_text: commentData.comment_text
        });

      if (error) throw error;

      toast({
        title: "Comment added",
        description: "Your comment has been added"
      });

      fetchPosts();
    } catch (error) {
      const friendlyMessage = handleRLSError(error);
      console.error('Error creating comment:', error);
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [fetchCategories, fetchPosts]);

  return {
    categories,
    posts,
    isLoading,
    createPost,
    createComment,
    refetch: fetchPosts
  };
};
