import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Bookmark {
  id: string;
  user_id: string;
  resource_id: string;
  page_number?: number;
  position?: any;
  note?: string;
  created_at: string;
}

export const useBookmarks = (resourceId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookmarks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id);

      if (resourceId) {
        query = query.eq('resource_id', resourceId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: "Error loading bookmarks",
        description: "Unable to fetch bookmarks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBookmark = async (data: {
    resource_id: string;
    page_number?: number;
    position?: any;
    note?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          ...data,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Bookmark added",
        description: "Bookmark has been saved successfully"
      });

      fetchBookmarks();
    } catch (error) {
      console.error('Error creating bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to create bookmark",
        variant: "destructive"
      });
    }
  };

  const updateBookmark = async (bookmarkId: string, updates: Partial<Bookmark>) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .update(updates)
        .eq('id', bookmarkId);

      if (error) throw error;

      toast({
        title: "Bookmark updated",
        description: "Bookmark has been updated successfully"
      });

      fetchBookmarks();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      toast({
        title: "Bookmark deleted",
        description: "Bookmark has been removed"
      });

      fetchBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to delete bookmark",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, resourceId]);

  return {
    bookmarks,
    isLoading,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    refetch: fetchBookmarks
  };
};