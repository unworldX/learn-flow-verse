import React, { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Check, X } from 'lucide-react';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MermaidNodeViewProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
}

const MermaidNodeView: React.FC<MermaidNodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(node.attrs.code);
  const [svgCode, setSvgCode] = useState('');
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || isEditing) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, node.attrs.code);
        setSvgCode(svg);
        setError('');
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Invalid diagram syntax');
      }
    };

    renderDiagram();
  }, [node.attrs.code, isEditing]);

  const handleSave = () => {
    updateAttributes({ code });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCode(node.attrs.code);
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="mermaid-node-view my-4">
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {isEditing ? (
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Edit Mermaid Diagram</span>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={deleteNode}>
                  Delete
                </Button>
              </div>
            </div>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
              placeholder="graph TD&#10;  A[Start] --> B[End]"
            />
          </div>
        ) : (
          <div className="relative group">
            <div
              ref={containerRef}
              className="p-4 flex justify-center items-center bg-muted/30"
              dangerouslySetInnerHTML={{ __html: svgCode }}
            />
            {error && (
              <div className="p-4 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default MermaidNodeView;
