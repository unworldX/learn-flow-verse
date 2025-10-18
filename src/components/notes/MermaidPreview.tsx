import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with dark theme support
mermaid.initialize({ 
  startOnLoad: false, 
  theme: 'dark',
  securityLevel: 'loose',
});

interface MermaidPreviewProps {
  code: string;
}

const MermaidPreview: React.FC<MermaidPreviewProps> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  useEffect(() => {
    if (ref.current && code) {
      try {
        // Clear previous content
        ref.current.innerHTML = '';
        setError(null);
        
        // Generate unique ID for each render
        const id = `mermaid-${Date.now()}`;
        
        // Render the diagram
        mermaid.render(id, code).then((result) => {
          if (ref.current) {
            ref.current.innerHTML = result.svg;
          }
        }).catch((err) => {
          console.error('Mermaid rendering error:', err);
          setError('Invalid diagram syntax. Please check your code.');
        });
      } catch (err) {
        console.error('Mermaid error:', err);
        setError('Failed to render diagram.');
      }
    }
  }, [code]);
  
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return <div ref={ref} className="mermaid-preview" />;
};

export default MermaidPreview;
