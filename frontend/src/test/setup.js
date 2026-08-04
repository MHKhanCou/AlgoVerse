import '@testing-library/jest-dom';

// Treat React's "unrecognized prop" and key warnings as failures. These signal
// real bugs (invented props leak into the DOM as attributes) but are easy to
// scroll past in test output.
const FAIL_ON = [
  'React does not recognize the',
  'Invalid DOM property',
  'is using incorrect casing',
  'Warning: Each child in a list should have a unique "key"',
];
const originalError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (FAIL_ON.some(f => msg.includes(f))) {
    throw new Error(`React warning treated as failure: ${msg}`);
  }
  originalError(...args);
};

// jsdom does not implement ResizeObserver, which React Flow (used by
// GraphRenderer) constructs on mount. Without it, every graph algorithm test
// dies before rendering a single step.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// React Flow also probes DOMMatrixReadOnly for viewport transforms.
if (typeof globalThis.DOMMatrixReadOnly === 'undefined') {
  globalThis.DOMMatrixReadOnly = class DOMMatrixReadOnly {
    constructor(transform) {
      const [a, b, c, d, e, f] = (String(transform ?? '')
        .match(/matrix\(([^)]+)\)/)?.[1] ?? '1,0,0,1,0,0')
        .split(',')
        .map(Number);
      Object.assign(this, { m22: d ?? 1, a: a ?? 1, b: b ?? 0, c: c ?? 0, d: d ?? 1, e: e ?? 0, f: f ?? 0 });
    }
  };
}

if (typeof globalThis.DOMRect === 'undefined') {
  globalThis.DOMRect = class DOMRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      Object.assign(this, {
        x, y, width, height,
        top: y, left: x, right: x + width, bottom: y + height,
      });
    }
    static fromRect(r = {}) {
      return new DOMRect(r.x, r.y, r.width, r.height);
    }
  };
}

/**
 * jsdom does not implement the canvas 2D context. Without a stub,
 * `getContext('2d')` returns null and every canvas renderer bails out early,
 * meaning tests would exercise none of the drawing code.
 *
 * This records calls so tests can assert on painting behaviour (e.g. that the
 * backing store is not reallocated on every frame).
 */
const noop = () => {};

function createContextStub(canvas) {
  return {
    canvas,
    // transform / state
    setTransform: noop,
    resetTransform: noop,
    scale: noop,
    translate: noop,
    rotate: noop,
    save: noop,
    restore: noop,
    // drawing
    clearRect: noop,
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    rect: noop,
    fill: noop,
    stroke: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    drawImage: noop,
    // style properties
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
  };
}

if (typeof HTMLCanvasElement !== 'undefined') {
  const contexts = new WeakMap();
  HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (type !== '2d') return null;
    if (!contexts.has(this)) contexts.set(this, createContextStub(this));
    return contexts.get(this);
  };
}

// jsdom reports every element as 0x0. Give canvases a stable non-zero box so
// layout-dependent drawing paths actually run.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getBoundingClientRect = function () {
    return {
      x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 400,
      width: 800, height: 400, toJSON: () => {},
    };
  };
}
