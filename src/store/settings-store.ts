import { DEFAULT_SHORTCUTS, KeyboardShortcut, KeyboardShortcutConfig, ShortcutAction, adaptShortcutsForPlatform } from '../types/keyboard-shortcuts';

const SETTINGS_STORAGE_KEY = 'web3-ssh-manager-settings';

export interface AppSettings {
  language: string;
  keyboardShortcuts: KeyboardShortcutConfig;
  theme: 'light' | 'dark' | 'system';
  terminal: {
    fontSize: number;
    fontFamily: string;
    cursorStyle: 'block' | 'underline' | 'bar';
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh-CN',
  keyboardShortcuts: {
    shortcuts: adaptShortcutsForPlatform(DEFAULT_SHORTCUTS),
    enabled: true
  },
  theme: 'system',
  terminal: {
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
    cursorStyle: 'block'
  }
};

export class SettingsStore {
  private static instance: SettingsStore;
  private settings: AppSettings;
  private subscribers: Set<(settings: AppSettings) => void> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsStore {
    if (!SettingsStore.instance) {
      SettingsStore.instance = new SettingsStore();
    }
    return SettingsStore.instance;
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        return {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          keyboardShortcuts: {
            ...DEFAULT_SETTINGS.keyboardShortcuts,
            ...parsedSettings.keyboardShortcuts,
            shortcuts: {
              ...DEFAULT_SETTINGS.keyboardShortcuts.shortcuts,
              ...parsedSettings.keyboardShortcuts?.shortcuts
            }
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.settings));
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates
    };
    this.saveSettings();
  }

  getKeyboardShortcuts(): KeyboardShortcutConfig {
    return { ...this.settings.keyboardShortcuts };
  }

  updateKeyboardShortcut(action: ShortcutAction, newKey: string): boolean {
    const shortcuts = { ...this.settings.keyboardShortcuts.shortcuts };
    
    if (this.isShortcutConflict(newKey, action)) {
      return false;
    }

    if (shortcuts[action]) {
      shortcuts[action] = {
        ...shortcuts[action],
        currentKey: newKey
      };

      this.settings = {
        ...this.settings,
        keyboardShortcuts: {
          ...this.settings.keyboardShortcuts,
          shortcuts
        }
      };

      this.saveSettings();
      return true;
    }
    
    return false;
  }

  resetKeyboardShortcut(action: ShortcutAction): void {
    const shortcuts = { ...this.settings.keyboardShortcuts.shortcuts };
    
    if (shortcuts[action]) {
      shortcuts[action] = {
        ...shortcuts[action],
        currentKey: shortcuts[action].defaultKey
      };

      this.settings = {
        ...this.settings,
        keyboardShortcuts: {
          ...this.settings.keyboardShortcuts,
          shortcuts
        }
      };

      this.saveSettings();
    }
  }

  resetAllKeyboardShortcuts(): void {
    this.settings = {
      ...this.settings,
      keyboardShortcuts: {
        ...this.settings.keyboardShortcuts,
        shortcuts: adaptShortcutsForPlatform(DEFAULT_SHORTCUTS)
      }
    };
    this.saveSettings();
  }

  toggleKeyboardShortcuts(enabled: boolean): void {
    this.settings = {
      ...this.settings,
      keyboardShortcuts: {
        ...this.settings.keyboardShortcuts,
        enabled
      }
    };
    this.saveSettings();
  }

  isShortcutConflict(newKey: string, excludeAction?: ShortcutAction): boolean {
    const shortcuts = this.settings.keyboardShortcuts.shortcuts;
    return Object.keys(shortcuts).some(action => 
      action !== excludeAction && shortcuts[action as ShortcutAction].currentKey === newKey
    );
  }

  getShortcutByAction(action: ShortcutAction): KeyboardShortcut | undefined {
    return this.settings.keyboardShortcuts.shortcuts[action];
  }

  findShortcutByKey(key: string): KeyboardShortcut | undefined {
    const shortcuts = this.settings.keyboardShortcuts.shortcuts;
    const action = Object.keys(shortcuts).find(
      action => shortcuts[action as ShortcutAction].currentKey === key
    ) as ShortcutAction;
    
    return action ? shortcuts[action] : undefined;
  }

  subscribe(callback: (settings: AppSettings) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      const validatedSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...importedSettings,
        keyboardShortcuts: {
          ...DEFAULT_SETTINGS.keyboardShortcuts,
          ...importedSettings.keyboardShortcuts,
          shortcuts: {
            ...DEFAULT_SETTINGS.keyboardShortcuts.shortcuts,
            ...importedSettings.keyboardShortcuts?.shortcuts
          }
        }
      };

      this.settings = validatedSettings;
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
}

export const settingsStore = SettingsStore.getInstance();