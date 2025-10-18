// RightPanel.tsx (Improved)

import React from 'react';
import { Bot, Palette, Workflow, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/store/uiStore';
import AIAssistant from './AIAssistant';
import MermaidPanel from './MermaidPanel';

const RightPanel: React.FC = () => {
  const { rightPanelOpen, rightPanelTab, setRightPanelTab } = useUIStore();
  
  if (!rightPanelOpen) {
    return null;
  }
  
  return (
    <div
      className="border-l border-border/50 bg-gradient-to-br from-background via-background to-muted/20 flex flex-col backdrop-blur-sm"
      style={{ width: 400, minWidth: 350 }}
    >
      <Tabs
        value={rightPanelTab}
        onValueChange={(v) => setRightPanelTab(v as 'ai' | 'mermaid')}
        className="flex-1 flex flex-col"
      >
        <div className="p-3 border-b border-border/50 bg-background/60 backdrop-blur-sm">
          <TabsList className="w-full grid grid-cols-2 h-11 bg-muted/30 p-1">
            <TabsTrigger 
              value="ai" 
              className="text-xs flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all rounded-md"
            >
              <Bot className="w-4 h-4" />
              <span className="font-medium">AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mermaid" 
              className="text-xs flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all rounded-md"
            >
              <Workflow className="w-4 h-4" />
              <span className="font-medium">Diagrams</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="ai" className="flex-1 m-0 p-0 overflow-hidden">
          <AIAssistant />
        </TabsContent>
        
        <TabsContent value="mermaid" className="flex-1 m-0 p-0 overflow-hidden">
          <MermaidPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RightPanel;