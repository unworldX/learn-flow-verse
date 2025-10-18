// Global typings for Electron preload context bridge
// Ensures TypeScript knows about window.desktop used across the app
export {}; // ensure this is a module

declare global {
  interface Window {
    desktop?: {
      isElectron?: boolean;
      openExternal?: (target: string) => void;
      openPath?: (path: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
