
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cacheService } from '@/lib/cacheService';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export const useNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotes = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const cacheKey = `notes_${user.id}`;
      
      // Try cache first
      let cachedNotes = await cacheService.get<Note[]>(cacheKey);
      if (cachedNotes) {
        setNotes(cachedNotes);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
      await cacheService.set(cacheKey, data || [], { ttlMinutes: 30 });
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error loading notes",
        description: "Unable to fetch notes from database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (title: string, content: string, tags: string[] = []) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          tags
        });

      if (error) throw error;

      toast({
        title: "Note created",
        description: "Your note has been saved successfully"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`notes_${user.id}`);
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    }
  };

  const updateNote = async (noteId: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'is_favorite'>>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Note updated",
        description: "Your changes have been saved"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`notes_${user.id}`);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: "Note has been removed"
      });

      // Invalidate cache and refetch
      await cacheService.invalidate(`notes_${user.id}`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes
  };
};
