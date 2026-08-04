/**
 * AlgoVerse V2 Visualization Engine — Type Definitions
 * (JSDoc for JS project — can migrate to TypeScript later)
 */

/**
 * @typedef {Object} AnimationStep
 * @property {'compare'|'swap'|'visit'|'set'|'highlight'|'sorted'|'found'|'message'} type
 * @property {number[]} indices - Indices affected by this step
 * @property {number[]} [values] - New values at indices (for swaps/sets)
 * @property {number} [codeLine] - Line in source code to highlight (1-indexed)
 * @property {string} [description] - Human-readable step description
 * @property {number} timestamp - Position in timeline (0-1)
 */

/**
 * @typedef {Object} AlgorithmResult
 * @property {AnimationStep[]} steps - All animation steps
 * @property {Object} metadata - Algorithm metadata
 * @property {string} metadata.name
 * @property {string} metadata.timeComplexity
 * @property {string} metadata.spaceComplexity
 * @property {string} metadata.description
 */

/**
 * @typedef {Object} VisualizationState
 * @property {AnimationStep[]} steps
 * @property {number} currentStep
 * @property {boolean} isPlaying
 * @property {number} speed - Playback speed multiplier (0.25 to 4)
 * @property {Object} stats
 * @property {number} stats.comparisons
 * @property {number} stats.swaps
 * @property {number} stats.accesses
 * @property {number|null} codeLine
 * @property {string|null} description
 * @property {'idle'|'playing'|'paused'|'stepping'} status
 */

export {};
