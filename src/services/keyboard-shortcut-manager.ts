import { ShortcutKeyEvent, ShortcutAction, getPlatform } from '../types/keyboard-shortcuts';
import { settingsStore } from '../store/settings-store';
import { modalManager } from '../lib/modal-manager';

export type ShortcutHandler = (action: ShortcutAction, event: KeyboardEvent) => void;

export class KeyboardShortcutManager {
  private static instance: KeyboardShortcutManager;
  private handlers: Map<ShortcutAction, Set<ShortcutHandler>> = new Map();
  private isListening = false;
  private readonly platform = getPlatform();

  private constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  static getInstance(): KeyboardShortcutManager {
    if (!KeyboardShortcutManager.instance) {
      KeyboardShortcutManager.instance = new KeyboardShortcutManager();
    }
    return KeyboardShortcutManager.instance;
  }

  startListening(): void {
    if (this.isListening) return;
    
    // Use capture phase and higher priority to catch events before terminal
    document.addEventListener('keydown', this.handleKeyDown, {
      capture: true,
      passive: false
    });
    this.isListening = true;
  }

  stopListening(): void {
    if (!this.isListening) return;
    
    document.removeEventListener('keydown', this.handleKeyDown, {
      capture: true
    } as any);
    this.isListening = false;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const settings = settingsStore.getKeyboardShortcuts();
    
    if (!settings.enabled) {
      return;
    }

    // Don't handle shortcuts if there are modals open (let modal-manager handle ESC)
    if (modalManager.hasModalsOpen()) {
      return;
    }

    if (this.shouldIgnoreEvent(event)) {
      return;
    }

    const keyEvent = this.parseKeyboardEvent(event);
    const keyString = this.keyEventToString(keyEvent);
    
    const shortcut = settingsStore.findShortcutByKey(keyString);
    
    if (shortcut) {
      // Debug logging
      console.debug(`🎯 Keyboard shortcut triggered: ${keyString} -> ${shortcut.action}`);
      
      event.preventDefault();
      event.stopPropagation();
      
      const action = shortcut.action as ShortcutAction;
      const handlers = this.handlers.get(action);
      
      if (handlers && handlers.size > 0) {
        console.debug(`📋 Executing ${handlers.size} handler(s) for ${action}`);
        handlers.forEach(handler => {
          try {
            handler(action, event);
          } catch (error) {
            console.error(`Error executing shortcut handler for ${action}:`, error);
          }
        });
      } else {
        console.warn(`⚠️ No handlers registered for shortcut: ${action}`);
      }
    }
  }

  private shouldIgnoreEvent(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    
    if (!target) return false;

    const tagName = target.tagName.toLowerCase();
    const isContentEditable = target.contentEditable === 'true';
    const isInput = ['input', 'textarea', 'select'].includes(tagName);
    
    // Allow shortcuts in regular input fields only if they include modifier keys
    if (isInput || isContentEditable) {
      // Check if this is a shortcut with modifier keys (Ctrl/Cmd + something)
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (hasModifier) {
        // Allow shortcuts with modifiers even in input fields
        return false;
      }
      return true;
    }

    // Check for explicit ignore markers
    if (target.closest('[data-shortcut-ignore]')) {
      return true;
    }

    // Special handling for xterm terminal
    // Allow shortcuts even in terminal if they have modifier keys
    const isInTerminal = target.closest('.xterm') || target.closest('.xterm-viewport') || target.closest('.xterm-screen');
    if (isInTerminal) {
      // Only allow shortcuts with modifier keys in terminal
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      return !hasModifier;
    }

    return false;
  }

  private parseKeyboardEvent(event: KeyboardEvent): ShortcutKeyEvent {
    return {
      key: event.key,
      ctrl: event.ctrlKey,
      cmd: event.metaKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    };
  }

  private keyEventToString(keyEvent: ShortcutKeyEvent): string {
    const parts: string[] = [];
    
    if (this.platform === 'mac') {
      if (keyEvent.cmd) parts.push('Cmd');
      if (keyEvent.ctrl) parts.push('Ctrl');
    } else {
      if (keyEvent.ctrl) parts.push('Ctrl');
      if (keyEvent.meta) parts.push('Meta');
    }
    
    if (keyEvent.alt) parts.push('Alt');
    if (keyEvent.shift) parts.push('Shift');
    
    if (keyEvent.key && !['Control', 'Meta', 'Alt', 'Shift', 'Cmd'].includes(keyEvent.key)) {
      let key = keyEvent.key;
      
      if (key === ' ') {
        key = 'Space';
      } else if (key.length === 1) {
        key = key.toUpperCase();
      }
      
      parts.push(key);
    }
    
    return parts.join('+');
  }

  parseShortcutString(shortcut: string): ShortcutKeyEvent {
    const parts = shortcut.split('+').map(p => p.trim());
    const keyEvent: ShortcutKeyEvent = {
      key: '',
      ctrl: false,
      cmd: false,
      alt: false,
      shift: false,
      meta: false
    };

    parts.forEach(part => {
      switch (part.toLowerCase()) {
        case 'ctrl':
          keyEvent.ctrl = true;
          break;
        case 'cmd':
        case 'command':
          keyEvent.cmd = true;
          keyEvent.meta = true;
          break;
        case 'alt':
        case 'option':
          keyEvent.alt = true;
          break;
        case 'shift':
          keyEvent.shift = true;
          break;
        case 'meta':
          keyEvent.meta = true;
          break;
        default:
          if (!keyEvent.key) {
            keyEvent.key = part === 'Space' ? ' ' : part;
          }
      }
    });

    return keyEvent;
  }

  formatShortcutForDisplay(shortcut: string): string {
    if (this.platform === 'mac') {
      return shortcut
        .replace(/Cmd/g, '⌘')
        .replace(/Alt/g, '⌥')
        .replace(/Shift/g, '⇧')
        .replace(/Ctrl/g, '⌃')
        .replace(/Tab/g, '⇥');
    }
    
    return shortcut;
  }

  isValidShortcut(shortcut: string): boolean {
    try {
      const keyEvent = this.parseShortcutString(shortcut);
      return keyEvent.key !== '' && (keyEvent.ctrl || keyEvent.cmd || keyEvent.alt || keyEvent.meta);
    } catch {
      return false;
    }
  }

  registerHandler(action: ShortcutAction, handler: ShortcutHandler): () => void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    
    this.handlers.get(action)!.add(handler);
    
    return () => {
      const handlers = this.handlers.get(action);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(action);
        }
      }
    };
  }

  unregisterHandler(action: ShortcutAction, handler: ShortcutHandler): void {
    const handlers = this.handlers.get(action);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(action);
      }
    }
  }

  unregisterAllHandlers(action?: ShortcutAction): void {
    if (action) {
      this.handlers.delete(action);
    } else {
      this.handlers.clear();
    }
  }

  getRegisteredActions(): ShortcutAction[] {
    return Array.from(this.handlers.keys());
  }

  hasHandlers(action: ShortcutAction): boolean {
    const handlers = this.handlers.get(action);
    return handlers ? handlers.size > 0 : false;
  }

  triggerShortcut(action: ShortcutAction, mockEvent?: Partial<KeyboardEvent>): void {
    const handlers = this.handlers.get(action);
    if (handlers && handlers.size > 0) {
      const event = mockEvent || {} as KeyboardEvent;
      handlers.forEach(handler => {
        try {
          handler(action, event as KeyboardEvent);
        } catch (error) {
          console.error(`Error triggering shortcut handler for ${action}:`, error);
        }
      });
    }
  }

  destroy(): void {
    this.stopListening();
    this.handlers.clear();
  }
}

export const keyboardShortcutManager = KeyboardShortcutManager.getInstance();
