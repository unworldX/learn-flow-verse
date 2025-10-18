
import React, { useState, useMemo } from 'react';
import { useNotesOptimized as useNotes, Note } from '@/hooks/useNotesOptimized';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Star, StarOff, FileText, Folder, Filter, Search, SortAsc, SortDesc, Bold, Italic, Code, List, ListOrdered, Heading1, Heading2, Quote, Link2, Calendar, Tag, BookOpen, Save, X, FolderPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

const Notes = () => {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'favorite'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Get all unique categories and tags
  const categories = useMemo(() => {
    const cats = new Set<string>();
    notes.forEach(note => {
      if (note.category) cats.add(note.category);
    });
    return ['personal', 'work', 'study', 'ideas', 'other', ...Array.from(cats)];
  }, [notes]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      if (note.tags) note.tags.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags);
  }, [notes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(term) || 
        (note.content || '').toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(note => note.category === filterCategory);
    }

    // Filter by tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(note => note.tags?.includes(filterTag));
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'favorite':
          comparison = (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
          break;
        case 'date':
        default:
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [notes, searchTerm, filterCategory, filterTag, sortBy, sortOrder]);

  const handleCreateNote = async () => {
    if (!newTitle.trim()) return;

    const tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    await createNote(newTitle, newContent, tags, newCategory);
    
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setNewCategory('personal');
    setIsCreateDialogOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateNote = async (noteId: string, updates: any) => {
    await updateNote(noteId, updates);
    setEditingNote(null);
    setSelectedNote(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleFavorite = async (note: any) => {
    await updateNote(note.id, { is_favorite: !note.is_favorite });
  };

  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newContent.substring(start, end);
    let newText = '';

    switch (format) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        newText = `\n\`\`\`\n${selectedText || 'code block'}\n\`\`\`\n`;
        break;
      case 'h1':
        newText = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'h2':
        newText = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'quote':
        newText = `> ${selectedText || 'quote'}`;
        break;
      case 'list':
        newText = `- ${selectedText || 'list item'}`;
        break;
      case 'orderedlist':
        newText = `1. ${selectedText || 'list item'}`;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        break;
    }

    const updatedContent = newContent.substring(0, start) + newText + newContent.substring(end);
    setNewContent(updatedContent);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Notes</h1>
                <p className="text-sm text-muted-foreground">{filteredNotes.length} notes</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-5 h-5 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Create New Note</DialogTitle>
                  <DialogDescription>Use markdown for rich formatting</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Note title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="study">Study</SelectItem>
                          <SelectItem value="ideas">Ideas</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Formatting Toolbar</Label>
                    <div className="flex flex-wrap gap-1 mt-1 p-2 bg-muted rounded-lg">
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('bold')} title="Bold">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('italic')} title="Italic">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('code')} title="Inline Code">
                        <Code className="w-4 h-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('h1')} title="Heading 1">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('h2')} title="Heading 2">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('list')} title="Bullet List">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('orderedlist')} title="Numbered List">
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('quote')} title="Quote">
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('codeblock')} title="Code Block">
                        <Code className="w-4 h-4" />
                        <span className="text-xs ml-1">Block</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => insertFormatting('link')} title="Link">
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your note here... (supports Markdown)"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={12}
                      className="mt-1 font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Use **bold**, *italic*, `code`, # headings, - lists, and more!
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="comma, separated, tags"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline" className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleCreateNote} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                      <Save className="w-4 h-4 mr-2" />
                      Create Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-40">
                  <Folder className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-full md:w-40">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: 'date' | 'title' | 'favorite') => setSortBy(v)}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="favorite">Favorites</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes Grid/List */}
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm || filterCategory !== 'all' || filterTag !== 'all' 
                  ? 'No notes found' 
                  : 'No notes yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterCategory !== 'all' || filterTag !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first note to get started'}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                className="relative group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
                onClick={() => setSelectedNote(note)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{note.title}</CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(note); }}
                        className="h-8 w-8 p-0"
                      >
                        {note.is_favorite ? (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        className="h-8 w-8 p-0 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {note.category && (
                    <Badge variant="outline" className="w-fit capitalize">
                      <Folder className="w-3 h-3 mr-1" />
                      {note.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                    {note.content || 'No content'}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{note.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedNote?.title}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Last updated: {selectedNote && new Date(selectedNote.updated_at).toLocaleString()}
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {selectedNote?.category && (
                <Badge variant="outline" className="capitalize">
                  <Folder className="w-3 h-3 mr-1" />
                  {selectedNote.category}
                </Badge>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans bg-muted p-4 rounded-lg">
                  {selectedNote?.content || 'No content'}
                </pre>
              </div>
              {selectedNote?.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedNote.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                toggleFavorite(selectedNote);
              }}
            >
              {selectedNote?.is_favorite ? (
                <><Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" /> Unfavorite</>
              ) : (
                <><StarOff className="w-4 h-4 mr-2" /> Add to Favorites</>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedNote(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
