import React from 'react';
import { 
  FileText, Plus, Search, Folder, Tag, Clock, MoreVertical,
  Share2, Trash2, Pin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotesStore } from '@/store/notesStore';

const LeftSidebar: React.FC = () => {
  const {
    activeNoteId,
    searchQuery,
    setActiveNoteId,
    setSearchQuery,
    createNote,
    deleteNote,
    togglePinNote,
    getFilteredNotes,
  } = useNotesStore();
  
  const filteredNotes = getFilteredNotes();
  
  return (
    <div
      className="group flex flex-col gap-4 p-2 bg-background border-r"
      style={{ width: 280, minWidth: 280, maxWidth: 400 }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <FileText className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-semibold">
            Notes
          </h2>
        </div>
        <Button size="sm" onClick={createNote} variant="ghost" className="w-8 h-8">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="px-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-notes"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>
      
      {/* Notes List */}
      <ScrollArea className="flex-1 -mx-2">
        <div className="px-2 space-y-1">
          {filteredNotes.map(note => (
            <Card
              key={note.id}
              className={cn(
                "cursor-pointer transition-all duration-200 ease-in-out hover:bg-muted/80",
                "active:scale-[0.98] active:duration-100",
                activeNoteId === note.id && "bg-muted border-primary/20 shadow-sm"
              )}
              onClick={() => setActiveNoteId(note.id)}
            >
              <CardContent className="p-3 relative group/item">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm line-clamp-1 flex-1 pr-6">
                    {note.isPinned && <Pin className="w-3 h-3 inline mr-2 text-amber-500" />}
                    {note.title || 'Untitled Note'}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePinNote(note.id); }}>
                        <Pin className="w-4 h-4 mr-2" />
                        {note.isPinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {note.content.substring(0, 100) || 'No content'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LeftSidebar;
