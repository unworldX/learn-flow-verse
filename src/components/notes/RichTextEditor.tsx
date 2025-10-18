import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { FontFamily } from '@tiptap/extension-font-family';
import { common, createLowlight } from 'lowlight';
import { useNotesStore } from '@/store/notesStore';
import { useToast } from '@/hooks/use-toast';
import FloatingToolbar from './FloatingToolbar';
import MermaidDiagram from './extensions/MermaidExtension';
import './RichTextEditor.css';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  noteId: string;
  initialContent: string;
  onContentChange?: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  noteId,
  initialContent,
  onContentChange,
}) => {
  const { toast } = useToast();
  const { updateNoteContent } = useNotesStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto my-4',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your note... Press / for commands or @ for AI assistance',
      }),
      MermaidDiagram,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[600px]',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange?.(html);
      
      // Debounced autosave
      const timer = setTimeout(() => {
        updateNoteContent(noteId, html);
      }, 2000);
      
      return () => clearTimeout(timer);
    },
  });

  // Update editor content when note changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [noteId, editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      <FloatingToolbar editor={editor} />
    </div>
  );
};

export default RichTextEditor;
