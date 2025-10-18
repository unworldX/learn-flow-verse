export type SidebarMode = "expanded" | "collapsed" | "hover";

export const SIDEBAR_MODE_STORAGE_KEY = "sidebar-mode-preference";

/**
 * Get the sidebar mode from localStorage with a fallback default
 * @param defaultMode - The default mode to use if no value is stored
 * @param storageKey - The localStorage key to use (optional, defaults to SIDEBAR_MODE_STORAGE_KEY)
 * @returns The stored sidebar mode or the default
 */
export function getSidebarMode(
  defaultMode: SidebarMode = "expanded",
  storageKey: string = SIDEBAR_MODE_STORAGE_KEY
): SidebarMode {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && ["expanded", "collapsed", "hover"].includes(stored)) {
      return stored as SidebarMode;
    }
  } catch (error) {
    console.warn("Failed to read sidebar mode from localStorage:", error);
  }
  return defaultMode;
}

/**
 * Set the sidebar mode in localStorage
 * @param mode - The mode to store
 * @param storageKey - The localStorage key to use (optional, defaults to SIDEBAR_MODE_STORAGE_KEY)
 */
export function setSidebarMode(
  mode: SidebarMode,
  storageKey: string = SIDEBAR_MODE_STORAGE_KEY
): void {
  try {
    localStorage.setItem(storageKey, mode);
  } catch (error) {
    console.error("Failed to save sidebar mode to localStorage:", error);
  }
}
