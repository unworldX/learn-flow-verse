import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotesStore } from '@/store/notesStore';
import { useUIStore } from '@/store/uiStore';
import { useDrawingStore } from '@/store/drawingStore';
import LeftSidebar from '@/components/notes/LeftSidebar';
import MainEditor from '@/components/notes/MainEditor';
import RightPanel from '@/components/notes/RightPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Download, MoreHorizontal, PanelRightClose, PanelRightOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

const NotesWorkspace = () => {
  const { toast } = useToast();
  const { createNote, getActiveNote, updateNoteTitle } = useNotesStore();
  const { rightPanelOpen, toggleRightPanel } = useUIStore();
  const { isDrawing } = useDrawingStore();
  const activeNote = getActiveNote();

  const handleSaveNote = () => {
    if (!activeNote) return;
    toast({ title: 'Note saved!' });
  };

  const handleExport = (format: 'pdf' | 'md' | 'docx') => {
    toast({
      title: `Exporting as ${format.toUpperCase()}`,
      description: 'Download will start shortly',
    });
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          const activeNote = getActiveNote();
          if (activeNote) {
            toast({ title: 'Note saved!' });
          }
        } else if (e.key === 'n') {
          e.preventDefault();
          createNote();
          toast({
            title: 'New note created',
            description: 'Start typing to add content',
          });
        } else if (e.key === 'k') {
          e.preventDefault();
          document.getElementById('search-notes')?.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote, toast, getActiveNote]);

  return (
    <div className="flex h-[calc(100vh-var(--app-header-height,0px))] flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-full mx-auto px-4 h-14">
          <div className="flex items-center gap-4 flex-1">
            {activeNote && (
              <Input
                value={activeNote.title}
                onChange={(e) => updateNoteTitle(activeNote.id, e.target.value)}
                className="text-lg font-semibold tracking-tight border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Untitled Note"
              />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSaveNote} className="text-muted-foreground hover:text-primary">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('md')}>
                        Export as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('docx')}>
                        Export as DOCX
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleRightPanel} className="w-8 h-8 text-muted-foreground hover:text-primary">
              {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </Button>
            
          </div>
        </div>
      </header>

      <div className={`flex flex-1 overflow-hidden ${isDrawing ? 'cursor-crosshair' : ''}`}>
        {/* Left Sidebar - Notes List */}
        <LeftSidebar />
        
        {/* Main Editor Area */}
        <MainEditor />

        {/* Right Panel - Tools */}
        <RightPanel />
      </div>
    </div>
  );
};

export default NotesWorkspace;

