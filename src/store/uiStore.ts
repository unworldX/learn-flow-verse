// Zustand store for UI state
import { create } from 'zustand';

type RightPanelTab = 'ai' | 'mermaid';

interface UIState {
  // Sidebar state
  leftSidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  
  // Mermaid diagram state
  mermaidCode: string;
  
  // Actions
  setLeftSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setMermaidCode: (code: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  leftSidebarOpen: true,
  rightPanelOpen: true,
  rightPanelTab: 'ai',
  
  // Mermaid diagram state
  mermaidCode: 'graph TD\n  A[Start] --> B[End]',
  
  // Actions
  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  toggleLeftSidebar: () => set(state => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  toggleRightPanel: () => set(state => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setMermaidCode: (code) => set({ mermaidCode: code }),
}));
