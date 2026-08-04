import { create } from 'zustand';

/**
 * AlgoVerse V2 — Visualization State Store (Zustand)
 *
 * Central state for the playback engine. All renderers and controls
 * subscribe to this store.
 */
export const useVisualizationStore = create((set, get) => ({
  // Steps
  steps: [],
  currentStep: -1,

  // Playback
  status: 'idle', // 'idle' | 'playing' | 'paused' | 'stepping'
  speed: 1,

  // Current step data (derived from steps[currentStep])
  codeLine: null,
  description: null,

  // Stats
  stats: { comparisons: 0, swaps: 0, accesses: 0 },

  // Algorithm metadata
  metadata: null,

  // Input data
  inputData: null,

  // --- Actions ---

  /** Load steps from an algorithm execution */
  loadSteps: (steps, metadata = null) => {
    set({
      steps,
      currentStep: -1,
      status: 'idle',
      codeLine: null,
      description: null,
      stats: { comparisons: 0, swaps: 0, accesses: 0 },
      metadata,
    });
  },

  /** Load input data without steps (for initial render) */
  loadInput: (inputData) => {
    set({ inputData, steps: [], currentStep: -1, status: 'idle' });
  },

  /** Go to the first step */
  reset: () => {
    set({
      currentStep: -1,
      status: 'idle',
      codeLine: null,
      description: null,
      stats: { comparisons: 0, swaps: 0, accesses: 0 },
    });
  },

  /** Advance to the next step */
  stepForward: () => {
    const { steps, currentStep } = get();
    if (currentStep >= steps.length - 1) {
      set({ status: 'idle' });
      return false;
    }
    const nextStep = currentStep + 1;
    const step = steps[nextStep];
    const stats = get()._statsThrough(nextStep);
    set({
      currentStep: nextStep,
      status: 'stepping',
      codeLine: step.codeLine ?? null,
      description: step.description ?? null,
      stats,
    });
    return true;
  },

  /** Go back one step */
  stepBackward: () => {
    const { currentStep, steps } = get();
    if (currentStep <= 0) {
      set({ currentStep: -1, codeLine: null, description: null, stats: { comparisons: 0, swaps: 0, accesses: 0 } });
      return;
    }
    // Recalculate stats up to the previous step
    const stats = get()._statsThrough(currentStep - 1);
    const prevStep = steps[currentStep - 1];
    set({
      currentStep: currentStep - 1,
      codeLine: prevStep?.codeLine ?? null,
      description: prevStep?.description ?? null,
      stats,
    });
  },

  /** Seek to a specific step index */
  seek: (stepIndex) => {
    const { steps } = get();
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    const stats = get()._statsThrough(stepIndex);

    const step = steps[stepIndex];
    set({
      currentStep: stepIndex,
      codeLine: step.codeLine ?? null,
      description: step.description ?? null,
      stats,
    });
  },

  /** Set playback speed */
  setSpeed: (speed) => set({ speed: Math.max(0.25, Math.min(4, speed)) }),

  /** Set playing state (controlled externally by playback engine) */
  setPlaying: (isPlaying) => set({ status: isPlaying ? 'playing' : 'paused' }),

  /** Update stats during playback */
  updateStats: (stats) => set({ stats }),

  /** Mark playback as complete */
  complete: () => set({ status: 'idle' }),

  // --- Internal helpers ---

  /**
   * Authoritative stats for steps[0..stepIndex].
   *
   * Derived from the index rather than accumulated, so seeking, stepping
   * backward, or replaying a region can never inflate the counters.
   */
  _statsThrough: (stepIndex) => {
    const { steps } = get();
    const stats = { comparisons: 0, swaps: 0, accesses: 0 };
    for (let i = 0; i <= stepIndex && i < steps.length; i++) {
      const s = steps[i];
      if (s.type === 'compare') stats.comparisons++;
      if (s.type === 'swap') stats.swaps++;
      stats.accesses++;
      if (s.type === 'visit' || s.type === 'explore') {
        stats.nodesVisited = (stats.nodesVisited || 0) + 1;
      }
      if (s.type === 'explore' || s.type === 'relax') {
        stats.edgesExplored = (stats.edgesExplored || 0) + 1;
      }
    }
    return stats;
  },

}));

export default useVisualizationStore;
