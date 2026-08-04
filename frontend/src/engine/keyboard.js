import { useEffect, useCallback } from 'react';

/**
 * AlgoVerse V2 — Keyboard Shortcuts
 *
 * Registers keyboard shortcuts for playback control.
 * Space = play/pause, ←/→ = step, R = reset, +/- = speed.
 */
export function useKeyboardShortcuts(engine, { enabled = true } = {}) {
  const handleKeyDown = useCallback((e) => {
    if (!enabled || !engine) return;

    // Don't capture shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    switch (e.key) {
      case ' ':
      case 'Space':
        e.preventDefault();
        // Toggle play/pause based on store status (timeline.isActive() is
        // false while paused mid-timeline AND before first play).
        engine.isPlaying?.() ? engine.pause() : engine.play();
        break;

      case 'ArrowRight':
        e.preventDefault();
        engine.stepForward();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        engine.stepBackward();
        break;

      case 'r':
      case 'R':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          engine.stop();
        }
        break;

      case '+':
      case '=':
        e.preventDefault();
        engine.setSpeed(Math.min(4, (engine.timeline?.timeScale() || 1) + 0.25));
        break;

      case '-':
      case '_':
        e.preventDefault();
        engine.setSpeed(Math.max(0.25, (engine.timeline?.timeScale() || 1) - 0.25));
        break;

      case 'Home':
        e.preventDefault();
        engine.seekTo(0);
        break;

      case 'End':
        e.preventDefault();
        engine.seekTo(1);
        break;

      default:
        break;
    }
  }, [engine, enabled]);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
