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
    const { steps } = get();
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
    const stats = get()._accumulateStats(step);
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
    const stats = { comparisons: 0, swaps: 0, accesses: 0 };
    for (let i = 0; i < currentStep; i++) {
      const s = steps[i];
      if (s.type === 'compare') stats.comparisons++;
      if (s.type === 'swap') stats.swaps++;
      stats.accesses++;
    }
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

    // Recalculate stats up to this step
    const stats = { comparisons: 0, swaps: 0, accesses: 0 };
    for (let i = 0; i <= stepIndex; i++) {
      const s = steps[i];
      if (s.type === 'compare') stats.comparisons++;
      if (s.type === 'swap') stats.swaps++;
      stats.accesses++;
    }

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

  _accumulateStats: (step) => {
    const { stats } = get();
    const newStats = { ...stats };
    if (step.type === 'compare') newStats.comparisons++;
    if (step.type === 'swap') newStats.swaps++;
    newStats.accesses++;
    // Graph-specific metrics
    if (step.type === 'visit' || step.type === 'explore') {
      newStats.nodesVisited = (newStats.nodesVisited || 0) + 1;
    }
    if (step.type === 'explore' || step.type === 'relax') {
      newStats.edgesExplored = (newStats.edgesExplored || 0) + 1;
    }
    return newStats;
  },
}));

export default useVisualizationStore;
