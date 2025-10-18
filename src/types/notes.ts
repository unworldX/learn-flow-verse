// Types for the Notes Workspace feature

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder?: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface NotesFilter {
  searchQuery: string;
  selectedFolder: string | null;
  showPinnedOnly?: boolean;
}
