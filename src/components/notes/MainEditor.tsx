import React from 'react';
import { useNotesStore } from '@/store/notesStore';
import { useDrawingStore } from '@/store/drawingStore';
import RichTextEditor from './RichTextEditor';
import DrawingCanvas from './DrawingCanvas';

const MainEditor: React.FC = () => {
  const { getActiveNote, updateNoteContent } = useNotesStore();
  const { isDrawing, drawingMode } = useDrawingStore();
  
  const activeNote = getActiveNote();
  
  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No note selected</p>
          <p className="text-sm">Select a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background relative">
      {isDrawing && <DrawingCanvas width={1000} height={1000} mode={drawingMode} />}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-8 pt-8 pb-20">
          <RichTextEditor
            key={activeNote.id}
            noteId={activeNote.id}
            initialContent={activeNote.content}
            onContentChange={(content) => updateNoteContent(activeNote.id, content)}
          />
        </div>
      </div>
    </main>
  );
};

export default MainEditor;
