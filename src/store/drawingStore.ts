import { create } from 'zustand';

export type DrawingMode = 'pen' | 'highlighter' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'sticky' | null;

interface DrawingState {
  isDrawing: boolean;
  drawingMode: DrawingMode;
  setIsDrawing: (isDrawing: boolean) => void;
  setDrawingMode: (drawingMode: DrawingMode) => void;
  toggleDrawing: () => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  isDrawing: false,
  drawingMode: 'pen',
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setDrawingMode: (drawingMode) => set({ drawingMode }),
  toggleDrawing: () => set((state) => ({ isDrawing: !state.isDrawing })),
}));
