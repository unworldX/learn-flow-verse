
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          users:user_id (full_name, email),
          forum_categories:category_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error loading posts",
        description: "Unable to fetch forum posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          ...postData,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Post created",
        description: "Your post has been created successfully"
      });

      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
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
          ...commentData,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Comment added",
        description: "Your comment has been added"
      });

      fetchPosts();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, []);

  return {
    categories,
    posts,
    isLoading,
    createPost,
    createComment,
    refetch: fetchPosts
  };
};
