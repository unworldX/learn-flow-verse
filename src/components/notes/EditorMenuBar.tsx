import React, { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Highlighter,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon, FileCode, Palette, Minus, Bot, Save, Download, Undo, Redo,
  Type, Hash, Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EditorMenuBarProps {
  editor: Editor;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({ editor }) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

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

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2">
        {/* Undo/Redo */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Headings">
              <Type className="w-4 h-4 mr-1" />
              <Hash className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              Normal Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 className="w-4 h-4 mr-2" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="w-4 h-4 mr-2" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="w-4 h-4 mr-2" /> Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive('bold') && 'bg-accent')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive('italic') && 'bg-accent')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(editor.isActive('underline') && 'bg-accent')}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(editor.isActive('strike') && 'bg-accent')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(editor.isActive('code') && 'bg-accent')}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Text Color">
              <Palette className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="p-2">
              <div className="text-xs font-semibold mb-2">Text Color</div>
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                    className="w-8 h-8 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Highlight">
              <Highlighter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="p-2">
              <div className="text-xs font-semibold mb-2">Highlight</div>
              <div className="grid grid-cols-3 gap-1">
                {highlights.map((highlight) => (
                  <button
                    key={highlight.name}
                    onClick={() => 
                      highlight.value 
                        ? editor.chain().focus().setHighlight({ color: highlight.value }).run()
                        : editor.chain().focus().unsetHighlight().run()
                    }
                    className="w-12 h-8 rounded border border-border hover:scale-105 transition-transform"
                    style={{ backgroundColor: highlight.value || '#fff' }}
                    title={highlight.name}
                  >
                    {!highlight.value && <span className="text-xs">None</span>}
                  </button>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn(editor.isActive({ textAlign: 'justify' }) && 'bg-accent')}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists & Blocks */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive('bulletList') && 'bg-accent')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive('orderedList') && 'bg-accent')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn(editor.isActive('taskList') && 'bg-accent')}
            title="Task List"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(editor.isActive('blockquote') && 'bg-accent')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Insert Elements */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className={cn(editor.isActive('link') && 'bg-accent')}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addImage}
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertTable}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(editor.isActive('codeBlock') && 'bg-accent')}
            title="Code Block"
          >
            <FileCode className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Line"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertMermaid}
            title="Insert Mermaid Diagram"
          >
            <Workflow className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

      </div>

      {/* Link Input Row */}
      {showLinkInput && (
        <div className="p-2 border-t border-border flex gap-2">
          <Input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setLink()}
            className="flex-1"
          />
          <Button size="sm" onClick={setLink}>Insert</Button>
          <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

export default EditorMenuBar;
