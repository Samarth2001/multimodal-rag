import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        // Allow Ctrl+Enter in text inputs
        if (!(event.ctrlKey && event.key === 'Enter')) {
          return;
        }
      }

      // Handle Escape key for dialogs
      if (event.key === 'Escape') {
        // Find escape handler if defined
        const escHandler = shortcuts.find(
          (shortcut) => shortcut.key === 'Escape' || shortcut.key === 'Esc'
        );
        if (escHandler) {
          event.preventDefault();
          escHandler.handler();
          return;
        }
      }

      // Process other configured shortcuts
      for (const shortcut of shortcuts) {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrl &&
          !!event.shiftKey === !!shortcut.shift &&
          !!event.altKey === !!shortcut.alt
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
} 