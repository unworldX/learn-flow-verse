// Zustand store for Notes state management
import { create } from 'zustand';
import { Note } from '@/types/notes';

interface NotesState {
  // State
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  selectedFolder: string | null;
  
  // Computed/Derived getters
  getActiveNote: () => Note | undefined;
  getFilteredNotes: () => Note[];
  
  // Actions
  setActiveNoteId: (noteId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolder: (folder: string | null) => void;
  
  createNote: () => void;
  deleteNote: (noteId: string) => void;
  updateNoteContent: (noteId: string, content: string) => void;
  updateNoteTitle: (noteId: string, title: string) => void;
  togglePinNote: (noteId: string) => void;
  addNoteTag: (noteId: string, tag: string) => void;
  removeNoteTag: (noteId: string, tag: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  // Initial state
  notes: [
    {
      id: '1',
      title: 'Getting Started with Advanced Notes',
      content: '# Welcome to Advanced Notes Workspace\n\nThis is a **powerful** note-taking environment with:\n- Rich text editing\n- AI assistance\n- Whiteboard drawing\n- Mermaid diagrams\n\nUse `/` for slash commands!',
      tags: ['tutorial', 'getting-started'],
      isPinned: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    },
  ],
  activeNoteId: '1',
  searchQuery: '',
  selectedFolder: null,
  
  // Getters
  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find(n => n.id === activeNoteId);
  },
  
  getFilteredNotes: () => {
    const { notes, searchQuery, selectedFolder } = get();
    return notes
      .filter(note => {
        if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (selectedFolder && note.folder !== selectedFolder) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });
  },
  
  // Simple setters
  setActiveNoteId: (noteId) => set({ activeNoteId: noteId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  
  // Actions
  createNote: () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    
    set(state => ({
      notes: [newNote, ...state.notes],
      activeNoteId: newNote.id,
    }));
  },
  
  deleteNote: (noteId) => {
    set(state => {
      const newNotes = state.notes.filter(n => n.id !== noteId);
      const newActiveId = state.activeNoteId === noteId 
        ? (newNotes[0]?.id || null) 
        : state.activeNoteId;
      
      return {
        notes: newNotes,
        activeNoteId: newActiveId,
      };
    });
  },
  
  updateNoteContent: (noteId, content) => {
    set(state => ({
      notes: state.notes.map(note =>
        note.id === noteId
          ? { ...note, content, updatedAt: new Date(), version: note.version + 1 }
          : note
      ),
    }));
  },
  
  updateNoteTitle: (noteId, title) => {
    set(state => ({
      notes: state.notes.map(note =>
        note.id === noteId
          ? { ...note, title, updatedAt: new Date() }
          : note
      ),
    }));
  },
  
  togglePinNote: (noteId) => {
    set(state => ({
      notes: state.notes.map(note =>
        note.id === noteId
          ? { ...note, isPinned: !note.isPinned }
          : note
      ),
    }));
  },
  
  addNoteTag: (noteId, tag) => {
    set(state => ({
      notes: state.notes.map(note =>
        note.id === noteId && !note.tags.includes(tag)
          ? { ...note, tags: [...note.tags, tag], updatedAt: new Date() }
          : note
      ),
    }));
  },
  
  removeNoteTag: (noteId, tag) => {
    set(state => ({
      notes: state.notes.map(note =>
        note.id === noteId
          ? { ...note, tags: note.tags.filter(t => t !== tag), updatedAt: new Date() }
          : note
      ),
    }));
  },
}));
