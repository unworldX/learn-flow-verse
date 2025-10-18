import React from 'react';
import { Workflow, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/store/uiStore';
import { useNotesStore } from '@/store/notesStore';
import { useToast } from '@/hooks/use-toast';
import MermaidPreview from './MermaidPreview';
import { useOptimizedFileUpload } from '@/hooks/useOptimizedFileUpload';
import { v4 as uuidv4 } from 'uuid';
import mermaid from 'mermaid';

const MermaidPanel: React.FC = () => {
  const { toast } = useToast();
  const { mermaidCode, setMermaidCode } = useUIStore();
  const { getActiveNote, updateNoteContent } = useNotesStore();
  const { uploadFile, isUploading } = useOptimizedFileUpload();
  
  const activeNote = getActiveNote();
  
  const handleInsertDiagram = async () => {
    if (!activeNote) {
      toast({
        title: 'No active note',
        description: 'Please select a note first',
        variant: 'destructive',
      });
      return;
    }

    if (!mermaidCode.trim()) {
      toast({
        title: 'Empty Diagram',
        description: 'There is no diagram code to insert.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Generate SVG from mermaid code
      const id = `mermaid-export-${Date.now()}`;
      const { svg } = await mermaid.render(id, mermaidCode);

      // Convert SVG to a File object
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const fileName = `diagram-${uuidv4()}.svg`;
      const svgFile = new File([svgBlob], fileName, { type: 'image/svg+xml' });

      // Upload the file
      const publicUrl = await uploadFile(svgFile, { resourceType: 'image' });

      if (!publicUrl) {
        throw new Error('File upload failed, public URL not returned.');
      }

      // Insert the image markdown into the note content
      const imageMarkdown = `\n\n![Mermaid Diagram](${publicUrl})\n\n`;
      const newContent = (activeNote.content || '') + imageMarkdown;
      updateNoteContent(activeNote.id, newContent);
      
      toast({
        title: 'Diagram Inserted!',
        description: 'The diagram has been added to your note as an image.',
      });

    } catch (error) {
      console.error('Failed to insert diagram as image:', error);
      toast({
        title: 'Error Inserting Diagram',
        description: 'Could not convert or upload the diagram. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const exampleDiagrams = {
    flowchart: 'graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Action 1]\n  B -->|No| D[Action 2]\n  C --> E[End]\n  D --> E',
    sequence: 'sequenceDiagram\n  Alice->>John: Hello John!\n  John-->>Alice: Hi Alice!\n  Alice->>John: How are you?',
    gantt: 'gantt\n  title Project Timeline\n  section Planning\n    Design      :a1, 2024-01-01, 30d\n  section Development\n    Coding      :a2, after a1, 45d',
  };
  
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Workflow className="w-5 h-5 text-primary" />
          Mermaid Diagrams
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Create flowcharts, sequence diagrams, and more
        </p>
        
        <div className="flex gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setMermaidCode(exampleDiagrams.flowchart)}
          >
            Flowchart
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setMermaidCode(exampleDiagrams.sequence)}
          >
            Sequence
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setMermaidCode(exampleDiagrams.gantt)}
          >
            Gantt
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <label className="text-sm font-medium mb-2 block">Diagram Code</label>
          <Textarea
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            className="font-mono text-sm h-40 resize-none"
            placeholder="graph TD&#10;  A[Start] --> B[End]"
          />
        </div>
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
            <MermaidPreview code={mermaidCode} />
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <Button className="w-full" onClick={handleInsertDiagram} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Insert Diagram as Image
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MermaidPanel;
