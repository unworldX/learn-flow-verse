import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2, MousePointer2 } from "lucide-react";

export type SidebarMode = "expanded" | "collapsed" | "hover";

interface SidebarControlProps {
  onSidebarModeChange?: (mode: SidebarMode) => void;
  className?: string;
}

const STORAGE_KEY = "sidebar-mode-preference";

const modes: Array<{
  value: SidebarMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "expanded",
    label: "Expanded",
    description: "Sidebar is always visible with full content",
    icon: <Maximize2 className="h-4 w-4" />,
  },
  {
    value: "collapsed",
    label: "Collapsed",
    description: "Sidebar shows only icons to save space",
    icon: <Minimize2 className="h-4 w-4" />,
  },
  {
    value: "hover",
    label: "Expand on Hover",
    description: "Sidebar expands when you hover over it",
    icon: <MousePointer2 className="h-4 w-4" />,
  },
];

export function SidebarControl({ onSidebarModeChange, className }: SidebarControlProps) {
  const [selectedMode, setSelectedMode] = useState<SidebarMode>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY) as SidebarMode | null;
    return stored && ["expanded", "collapsed", "hover"].includes(stored)
      ? stored
      : "expanded";
  });

  useEffect(() => {
    // Persist to localStorage whenever mode changes
    localStorage.setItem(STORAGE_KEY, selectedMode);
    // Notify parent component
    onSidebarModeChange?.(selectedMode);
  }, [selectedMode, onSidebarModeChange]);

  const handleModeChange = (value: string) => {
    setSelectedMode(value as SidebarMode);
  };

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">Sidebar Control</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Choose how the sidebar behaves
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedMode} onValueChange={handleModeChange} className="space-y-3">
          {modes.map((mode) => (
            <div
              key={mode.value}
              className={cn(
                "relative flex items-start space-x-3 rounded-lg border border-border/60 p-4 transition-all duration-200",
                "hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm",
                selectedMode === mode.value &&
                  "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
              )}
            >
              <RadioGroupItem
                value={mode.value}
                id={mode.value}
                className={cn(
                  "mt-0.5 transition-all duration-200",
                  selectedMode === mode.value && "border-primary text-primary"
                )}
              />
              <div className="flex flex-1 items-start gap-3">
                <div
                  className={cn(
                    "rounded-md p-2 transition-colors duration-200",
                    selectedMode === mode.value
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {mode.icon}
                </div>
                <Label
                  htmlFor={mode.value}
                  className="flex flex-1 cursor-pointer flex-col gap-1"
                >
                  <span
                    className={cn(
                      "text-sm font-medium leading-none transition-colors duration-200",
                      selectedMode === mode.value && "text-primary"
                    )}
                  >
                    {mode.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-snug">
                    {mode.description}
                  </span>
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
