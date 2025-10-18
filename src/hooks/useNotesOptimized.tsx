/**
 * 🚀 ULTRA-OPTIMIZED Notes Hook - Local-First with Dexie
 * 
 * Performance Targets:
 * - Initial load: < 50ms (from Dexie cache)
 * - Create note: < 10ms (optimistic update)
 * - Update note: < 10ms (optimistic update)
 * - Search: < 20ms (indexed search in Dexie)
 * - UI updates: Instant (< 10ms)
 * 
 * Architecture:
 * User Action → Dexie (< 10ms) → UI Update → Background Sync → Supabase
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db, noteHelpers, syncQueueHelpers } from '@/lib/dexieDB';
import { syncService } from '@/lib/syncService';
import type { Note } from '@/types/entities';

export const useNotesOptimized = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * ⚡ INSTANT: Load notes from Dexie (< 50ms)
   */
  const loadNotes = useCallback(async () => {
    console.time('⚡ Load Notes from Dexie');
    
    try {
      const cachedNotes = await noteHelpers.getAll();
      setNotes(cachedNotes);
      setIsLoading(false);
      
      console.timeEnd('⚡ Load Notes from Dexie');
      
      // Trigger background sync (non-blocking)
      if (user?.id && navigator.onLine) {
        debouncedSync();
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * ⚡ INSTANT: Create note with optimistic update (< 10ms)
   * Order: UI FIRST → Dexie → Queue → Background Sync
   */
  const createNote = useCallback(async (
    title: string,
    content: string,
    tags: string[] = []
  ) => {
    if (!user?.id) return;
    
    console.time('⚡ Create Note (Optimistic)');
    
    const tempId = crypto.randomUUID();
    const optimisticNote: Note = {
      id: tempId,
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false,
      sync_status: 'pending',
      version: 1,
    };

    // 1️⃣ UPDATE UI FIRST - INSTANT (< 2ms) ⚡
    setNotes(prev => [optimisticNote, ...prev]);
    
    console.timeEnd('⚡ Create Note (Optimistic)');
    
    toast({
      title: "Note created",
      description: "Your note has been saved successfully"
    });
    
    try {
      // 2️⃣ UPDATE LOCAL DB (Dexie) - (< 10ms) 💾
      await db.notes.add(optimisticNote);
      
      // 3️⃣ QUEUE FOR SYNC - Background 📤
      await syncQueueHelpers.add({
        user_id: user.id,
        entity_type: 'note',
        entity_id: tempId,
        operation: 'CREATE',
        payload: optimisticNote,
        retry_count: 0,
        created_at: new Date().toISOString(),
      });
      
      // 4️⃣ TRIGGER BACKGROUND SYNC (non-blocking) 🔄
      debouncedSync();
      
    } catch (error) {
      console.error('Error creating note:', error);
      
      // Rollback UI on error
      setNotes(prev => prev.filter(n => n.id !== tempId));
      
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive"
      });
    }
  }, [user?.id, toast]);

  /**
   * ⚡ INSTANT: Update note with optimistic update (< 10ms)
   * Order: UI FIRST → Dexie → Queue → Background Sync
   */
  const updateNote = useCallback(async (
    noteId: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'is_favorite'>>
  ) => {
    if (!user?.id) return;
    
    console.time('⚡ Update Note (Optimistic)');
    
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
      sync_status: 'pending' as const,
    };

    // 1️⃣ UPDATE UI FIRST - INSTANT (< 2ms) ⚡
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, ...updatedData }
        : note
    ));
    
    console.timeEnd('⚡ Update Note (Optimistic)');
    
    toast({
      title: "Note updated",
      description: "Your changes have been saved"
    });
    
    try {
      // 2️⃣ UPDATE LOCAL DB (Dexie) - (< 10ms) 💾
      await db.notes.update(noteId, updatedData);
      
      // 3️⃣ QUEUE FOR SYNC - Background 📤
      await syncQueueHelpers.add({
        user_id: user.id,
        entity_type: 'note',
        entity_id: noteId,
        operation: 'UPDATE',
        payload: updatedData,
        retry_count: 0,
        created_at: new Date().toISOString(),
      });
      
      // 4️⃣ TRIGGER BACKGROUND SYNC (non-blocking) 🔄
      debouncedSync();
      
    } catch (error) {
      console.error('Error updating note:', error);
      
      // Rollback UI on error (reload from Dexie)
      loadNotes();
      
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive"
      });
    }
  }, [user?.id, toast, loadNotes]);

  /**
   * ⚡ INSTANT: Delete note with optimistic update (< 10ms)
   * Order: UI FIRST → Dexie → Queue → Background Sync
   */
  const deleteNote = useCallback(async (noteId: string) => {
    if (!user?.id) return;
    
    console.time('⚡ Delete Note (Optimistic)');
    
    // Store note for potential rollback
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    // 1️⃣ UPDATE UI FIRST - INSTANT (< 2ms) ⚡
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    console.timeEnd('⚡ Delete Note (Optimistic)');
    
    toast({
      title: "Note deleted",
      description: "Note has been removed"
    });
    
    try {
      // 2️⃣ UPDATE LOCAL DB (Dexie) - (< 10ms) 💾
      await db.notes.delete(noteId);
      
      // 3️⃣ QUEUE FOR SYNC - Background 📤
      await syncQueueHelpers.add({
        user_id: user.id,
        entity_type: 'note',
        entity_id: noteId,
        operation: 'DELETE',
        payload: {},
        retry_count: 0,
        created_at: new Date().toISOString(),
      });
      
      // 4️⃣ TRIGGER BACKGROUND SYNC (non-blocking) 🔄
      debouncedSync();
      
    } catch (error) {
      console.error('Error deleting note:', error);
      
      // Rollback UI on error
      if (noteToDelete) {
        await db.notes.add(noteToDelete);
        setNotes(prev => [...prev, noteToDelete]);
      }
      
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive"
      });
    }
  }, [user?.id, notes, toast]);

  /**
   * ⚡ FAST: Search notes in Dexie (< 20ms)
   */
  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    console.time('⚡ Search Notes');
    
    try {
      const results = await noteHelpers.search(query);
      setSearchResults(results);
      
      console.timeEnd('⚡ Search Notes');
    } catch (error) {
      console.error('Error searching notes:', error);
      setSearchResults([]);
    }
  }, []);

  /**
   * ⚡ INSTANT: Toggle favorite (< 10ms)
   */
  const toggleFavorite = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    await updateNote(noteId, { is_favorite: !note.is_favorite });
  }, [notes, updateNote]);

  /**
   * Get all tags from notes
   */
  const getAllTags = useCallback(async () => {
    return await noteHelpers.getAllTags();
  }, []);

  /**
   * Filter notes by tag
   */
  const filterByTag = useCallback((tag: string) => {
    return notes.filter(note => note.tags.includes(tag));
  }, [notes]);

  /**
   * Get favorite notes
   */
  const getFavorites = useCallback(() => {
    return notes.filter(note => note.is_favorite);
  }, [notes]);

  /**
   * 🔄 Background sync (debounced, non-blocking)
   */
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      if (!user?.id || !navigator.onLine) return;
      
      setIsSyncing(true);
      try {
        await syncService.syncAll(user.id);
        
        // Reload notes after sync
        const updatedNotes = await noteHelpers.getAll();
        setNotes(updatedNotes);
      } catch (error) {
        console.error('Background sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 1000); // 1 second debounce
  }, [user?.id]);

  /**
   * Initialize sync service and load data
   */
  useEffect(() => {
    if (!user?.id) return;
    
    // Initialize sync service
    syncService.initialize(user.id);
    
    // Load notes immediately
    loadNotes();
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user?.id, loadNotes]);

  /**
   * Auto-sync every 2 minutes
   */
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        console.log('🔄 Auto-sync triggered');
        debouncedSync();
      }
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [user?.id, debouncedSync]);

  /**
   * Sync on reconnect
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online - triggering sync');
      if (user?.id) {
        debouncedSync();
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user?.id, debouncedSync]);

  return {
    // State
    notes,
    isLoading,
    isSyncing,
    searchResults,
    
    // Actions
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    toggleFavorite,
    getAllTags,
    filterByTag,
    getFavorites,
    refetch: loadNotes,
    forceSyncNow: () => user?.id && syncService.forceSyncNow(user.id),
  };
};
