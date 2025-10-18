import { Node, mergeAttributes } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MermaidNodeView from './MermaidNodeView';

export interface MermaidOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaid: {
      setMermaid: (options: { code: string }) => ReturnType;
    };
  }
}

export const MermaidDiagram = Node.create<MermaidOptions>({
  name: 'mermaid',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      code: {
        default: 'graph TD\n  A[Start] --> B[End]',
        parseHTML: (element) => element.getAttribute('data-code'),
        renderHTML: (attributes) => ({
          'data-code': attributes.code,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },

  addCommands() {
    return {
      setMermaid:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default MermaidDiagram;
