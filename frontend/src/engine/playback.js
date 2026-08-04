import { gsap } from 'gsap';
import { useVisualizationStore } from './state';

/**
 * AlgoVerse V2 — Playback Engine
 *
 * Uses GSAP Timeline for smooth, scrubbable animations.
 * Maps algorithm steps to timeline positions.
 */
export class PlaybackEngine {
  constructor() {
    this.timeline = null;
    this.unsubscribe = null;
    this.onComplete = null;
  }

  /**
   * Initialize playback for a set of steps.
   * @param {import('./types').AnimationStep[]} steps
   * @param {Object} options
   * @param {number} options.baseDuration - Base duration per step in seconds (default: 0.5)
   * @param {Function} options.onStep - Called for each step during playback
   * @param {Function} options.onComplete - Called when playback finishes
   */
  init(steps, { baseDuration = 0.5, onStep, onComplete } = {}) {
    this.dispose();

    // Create GSAP timeline
    this.timeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        useVisualizationStore.getState().complete();
        onComplete?.();
      },
    });

    // Build timeline from steps
    const totalDuration = steps.length * baseDuration;

    steps.forEach((step, index) => {
      const position = (index / steps.length) * totalDuration;

      this.timeline.call(
        () => {
          this._applyStepState(step, index);
          onStep?.(step, index);
        },
        [],
        position
      );
    });

    this.onComplete = onComplete;
    this._applyStoredSpeed();
  }

  /**
   * Apply the state for a given step index.
   *
   * Stats are derived from the step index rather than incremented, because
   * the timeline can replay a region (seek backward then play again) and an
   * incremental counter would inflate the totals on every repeat.
   */
  _applyStepState(step, index) {
    useVisualizationStore.getState().seek(index);
  }

  /** Apply the store's current speed to a freshly built timeline */
  _applyStoredSpeed() {
    this.timeline?.timeScale(useVisualizationStore.getState().speed || 1);
  }

  /** Start or resume playback */
  play() {
    if (!this.timeline) return;
    const store = useVisualizationStore.getState();

    if (store.status === 'idle' || store.status === 'paused') {
      useVisualizationStore.setState({ status: 'playing' });
      this.timeline.play();
    }
  }

  /** Pause playback */
  pause() {
    if (!this.timeline) return;
    useVisualizationStore.setState({ status: 'paused' });
    this.timeline.pause();
  }

  /** Step forward one frame */
  stepForward() {
    if (!this.timeline) return;
    const store = useVisualizationStore.getState();

    if (store.status === 'playing') {
      this.pause();
    }

    const steps = store.steps;
    const nextIndex = store.currentStep + 1;

    if (nextIndex >= steps.length) {
      useVisualizationStore.setState({ status: 'idle' });
      return false;
    }

    // Seek the timeline to match, then set state from the step index.
    // Stats are index-derived (store.seek), never incremented, so repeated
    // stepping or replaying a region cannot inflate the counters.
    const totalDuration = this.timeline.duration();
    this.timeline.seek((nextIndex / steps.length) * totalDuration, true);

    useVisualizationStore.getState().seek(nextIndex);
    useVisualizationStore.setState({ status: 'stepping' });

    return true;
  }

  /** Step backward one frame */
  stepBackward() {
    if (!this.timeline) return;
    const store = useVisualizationStore.getState();

    if (store.status === 'playing') {
      this.pause();
    }

    useVisualizationStore.getState().stepBackward();
    const newStore = useVisualizationStore.getState();
    const totalDuration = this.timeline.duration();
    const position = newStore.currentStep >= 0
      ? ((newStore.currentStep + 1) / newStore.steps.length) * totalDuration
      : 0;
    this.timeline.seek(position, true);
  }

  /** Stop and reset to beginning */
  stop() {
    if (!this.timeline) return;
    this.timeline.pause(0);
    useVisualizationStore.getState().reset();
  }

  /** Seek to a percentage (0-1) */
  seekTo(progress) {
    if (!this.timeline) return;
    const duration = this.timeline.duration();
    this.timeline.seek(progress * duration, true);

    // Update current step based on seek position
    const store = useVisualizationStore.getState();
    const stepIndex = Math.floor(progress * store.steps.length);
    store.seek(Math.min(stepIndex, store.steps.length - 1));
  }

  /** Whether playback is currently running */
  isPlaying() {
    return useVisualizationStore.getState().status === 'playing';
  }

  /** Update speed */
  setSpeed(speed) {
    if (!this.timeline) {
      useVisualizationStore.setState({ speed });
      return;
    }
    this.timeline.timeScale(speed);
    useVisualizationStore.setState({ speed });
  }

  /** Check if at end */
  isAtEnd() {
    if (!this.timeline) return true;
    return this.timeline.progress() >= 1;
  }

  /** Check if at beginning */
  isAtStart() {
    if (!this.timeline) return true;
    return this.timeline.progress() <= 0;
  }

  /** Cleanup */
  dispose() {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.onComplete = null;
  }
}

// Singleton instance for the app
export const playbackEngine = new PlaybackEngine();
