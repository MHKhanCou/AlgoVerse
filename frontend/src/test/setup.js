import '@testing-library/jest-dom';

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
