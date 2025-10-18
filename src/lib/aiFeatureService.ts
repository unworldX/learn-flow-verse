/**
 * Utility functions to check if AI features are enabled based on user settings
 */

export interface AIFeatureSettings {
  ai_suggestions: boolean;
  ai_autocomplete: boolean;
}

class AIFeatureService {
  private settings: AIFeatureSettings | null = null;

  /**
   * Load AI feature settings from localStorage
   */
  loadSettings(): void {
    try {
      const stored = localStorage.getItem('user_settings');
      if (stored) {
        const userSettings = JSON.parse(stored);
        this.settings = {
          ai_suggestions: userSettings.ai_suggestions ?? true,
          ai_autocomplete: userSettings.ai_autocomplete ?? true,
        };
      }
    } catch (error) {
      console.error('Error loading AI feature settings:', error);
    }
  }

  /**
   * Check if AI suggestions are enabled
   */
  isSuggestionsEnabled(): boolean {
    if (!this.settings) {
      this.loadSettings();
    }
    return this.settings?.ai_suggestions ?? true;
  }

  /**
   * Check if AI autocomplete is enabled
   */
  isAutocompleteEnabled(): boolean {
    if (!this.settings) {
      this.loadSettings();
    }
    return this.settings?.ai_autocomplete ?? true;
  }

  /**
   * Update AI feature settings
   */
  updateSettings(settings: Partial<AIFeatureSettings>): void {
    if (!this.settings) {
      this.settings = {
        ai_suggestions: true,
        ai_autocomplete: true,
      };
    }
    
    this.settings = {
      ...this.settings,
      ...settings,
    };
  }

  /**
   * Check if any AI feature should be shown
   * This can be used to conditionally render AI-related UI elements
   */
  shouldShowAIFeatures(): boolean {
    return this.isSuggestionsEnabled() || this.isAutocompleteEnabled();
  }
}

// Export singleton instance
export const aiFeatureService = new AIFeatureService();
