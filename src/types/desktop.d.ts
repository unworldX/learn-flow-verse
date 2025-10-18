export {};

declare global {
  interface DesktopBridge {
    isElectron?: boolean;
    openExternal?: (target: string) => void;
    openPath?: (filePath: string) => Promise<{ success: boolean; error?: string } | void>;
  }

  interface Window {
    desktop?: DesktopBridge;
  }
}
