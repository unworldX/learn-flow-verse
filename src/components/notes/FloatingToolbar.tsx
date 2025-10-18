import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, CheckSquare, Quote, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, FileCode, Palette, Minus, Workflow, Undo, Redo,
  Pencil, Highlighter, Square, Circle, ArrowRight, StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { useDrawingStore, DrawingMode } from '@/store/drawingStore';

interface FloatingToolbarProps {
  editor: Editor;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const { setDrawingMode, toggleDrawing, isDrawing } = useDrawingStore();

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setShowLinkInput(false);
      setLinkUrl('');
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const insertMermaid = useCallback(() => {
    const defaultCode = 'graph TD\n  A[Start] --> B[Process]\n  B --> C[End]';
    editor.chain().focus().setMermaid({ code: defaultCode }).run();
  }, [editor]);

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
  ];

  const highlights = [
    { name: 'None', value: '' },
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
  ];

  const getTextStyle = editor.getAttributes('textStyle') || {};

  const handleDrawingToolSelect = (mode: DrawingMode) => {
    if (!isDrawing) {
      toggleDrawing();
    }
    setDrawingMode(mode);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-background/70 backdrop-blur-md border border-white/20 rounded-full shadow-2xl px-4 py-2 flex items-center gap-1">
        {/* Drawing Tools */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all",
                isDrawing && 'bg-white/30 text-accent-foreground'
              )}
              title="Drawing Tools"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/80 backdrop-blur-lg border-white/20">
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('pen')}>
              <Pencil className="w-4 h-4 mr-2" /> Pen
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('highlighter')}>
              <Highlighter className="w-4 h-4 mr-2" /> Highlighter
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('rectangle')}>
              <Square className="w-4 h-4 mr-2" /> Rectangle
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('circle')}>
              <Circle className="w-4 h-4 mr-2" /> Circle
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('arrow')}>
              <ArrowRight className="w-4 h-4 mr-2" /> Arrow
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('line')}>
              <Minus className="w-4 h-4 mr-2" /> Line
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDrawingToolSelect('sticky')}>
              <StickyNote className="w-4 h-4 mr-2" /> Sticky Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Font Family & Size */}
        <select
          className="h-8 px-2 text-xs bg-white/10 border border-white/20 rounded-full focus:outline-none focus:ring-1 focus:ring-white/40 transition-all hover:bg-white/20"
          value={getTextStyle.fontFamily || 'Inter'}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        >
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier</option>
          <option value="Verdana">Verdana</option>
        </select>
        <select
          className="h-8 px-2 text-xs bg-white/10 border border-white/20 rounded-full focus:outline-none focus:ring-1 focus:ring-white/40 transition-all hover:bg-white/20"
          value={(getTextStyle.fontSize || '16px').replace('px', '')}
          onChange={(e) => {
            const size = e.target.value;
            editor.chain().focus().setMark('textStyle', { fontSize: size + 'px' }).run();
          }}
        >
          {[12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all",
            editor.isActive('bold') && 'bg-white/30 text-accent-foreground'
          )}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all",
            editor.isActive('italic') && 'bg-white/30 text-accent-foreground'
          )}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all",
            editor.isActive('underline') && 'bg-white/30 text-accent-foreground'
          )}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Color & Highlight */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all"
              title="Color & Highlight"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-3 bg-background/80 backdrop-blur-lg border-white/20">
            <div className="mb-2">
              <div className="text-xs font-semibold mb-1">Text Color</div>
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                    className="w-7 h-7 rounded-md border border-white/30 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Highlight</div>
              <div className="grid grid-cols-3 gap-1">
                {highlights.map((highlight) => (
                  <button
                    key={highlight.name}
                    onClick={() =>
                      highlight.value
                        ? editor.chain().focus().setHighlight({ color: highlight.value }).run()
                        : editor.chain().focus().unsetHighlight().run()
                    }
                    className="w-11 h-7 rounded-md border border-white/30 hover:scale-105 transition-transform flex items-center justify-center text-xs"
                    style={{ backgroundColor: highlight.value || '#fff' }}
                    title={highlight.name}
                  >
                    {!highlight.value && <span>None</span>}
                  </button>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Lists */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all"
              title="Lists & Blocks"
            >
              <List className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/80 backdrop-blur-lg border-white/20">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="w-4 h-4 mr-2" /> Bullet List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="w-4 h-4 mr-2" /> Numbered List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare className="w-4 h-4 mr-2" /> Task List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="w-4 h-4 mr-2" /> Quote
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        {/* Insert Elements */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 rounded-full p-0 hover:bg-white/20 transition-all"
              title="Insert"
            >
              <Workflow className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background/80 backdrop-blur-lg border-white/20">
            <DropdownMenuItem onClick={() => setShowLinkInput(!showLinkInput)}>
              <LinkIcon className="w-4 h-4 mr-2" /> Insert Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addImage}>
              <ImageIcon className="w-4 h-4 mr-2" /> Insert Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertTable}>
              <TableIcon className="w-4 h-4 mr-2" /> Insert Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <FileCode className="w-4 h-4 mr-2" /> Code Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertMermaid}>
              <Workflow className="w-4 h-4 mr-2" /> Mermaid Diagram
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Link Input Row */}
      {showLinkInput && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 p-3 bg-background/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl flex gap-2 w-96">
          <Input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setLink()}
            className="flex-1 bg-white/10 border-white/20"
          />
          <Button size="sm" onClick={setLink} className="rounded-full">Insert</Button>
          <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)} className="rounded-full border-white/20">Cancel</Button>
        </div>
      )}
    </>
  );
};

export default FloatingToolbar;
