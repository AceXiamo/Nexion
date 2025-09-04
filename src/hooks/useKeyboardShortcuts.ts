import { useEffect, useCallback, useRef } from 'react';
import { ShortcutAction } from '../types/keyboard-shortcuts';
import { keyboardShortcutManager, ShortcutHandler } from '../services/keyboard-shortcut-manager';
import { settingsStore } from '../store/settings-store';

export function useKeyboardShortcuts() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      keyboardShortcutManager.startListening();
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        keyboardShortcutManager.stopListening();
        isInitialized.current = false;
      }
    };
  }, []);

  const registerShortcut = useCallback((action: ShortcutAction, handler: ShortcutHandler) => {
    return keyboardShortcutManager.registerHandler(action, handler);
  }, []);

  const unregisterShortcut = useCallback((action: ShortcutAction, handler: ShortcutHandler) => {
    keyboardShortcutManager.unregisterHandler(action, handler);
  }, []);

  const triggerShortcut = useCallback((action: ShortcutAction) => {
    keyboardShortcutManager.triggerShortcut(action);
  }, []);

  const getShortcutDisplay = useCallback((action: ShortcutAction) => {
    const shortcut = settingsStore.getShortcutByAction(action);
    if (shortcut) {
      return keyboardShortcutManager.formatShortcutForDisplay(shortcut.currentKey);
    }
    return '';
  }, []);

  const isShortcutEnabled = useCallback(() => {
    return settingsStore.getKeyboardShortcuts().enabled;
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    triggerShortcut,
    getShortcutDisplay,
    isShortcutEnabled
  };
}

export function useShortcutHandler(action: ShortcutAction, handler: ShortcutHandler, deps: any[] = []) {
  const { registerShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const unregister = registerShortcut(action, handler);
    return unregister;
  }, [action, registerShortcut, ...deps]);
}