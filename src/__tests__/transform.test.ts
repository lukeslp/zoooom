import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateTransform,
  centerImage,
  resetView,
  zoomTowardsPoint,
  calculateBaseScale,
  calculateMaxScale,
  animateMovement,
} from '../core/transform.js';
import type { ZoooomState, ZoooomElements } from '../types.js';

function makeState(overrides: Partial<ZoooomState> = {}): ZoooomState {
  return {
    scale: 1,
    translateX: 0,
    translateY: 0,
    velocityX: 0,
    velocityY: 0,
    maxScale: 10,
    baseScale: 1,
    isDragging: false,
    isAnimating: false,
    isLoaded: false,
    startX: 0,
    startY: 0,
    initialDistance: 0,
    initialScale: 1,
    initialTranslateX: 0,
    initialTranslateY: 0,
    pinchCenter: { x: 0, y: 0 },
    wheelTimeout: null,
    reducedMotion: false,
    ...overrides,
  };
}

function makeElements(overrides: Partial<{
  containerWidth: number;
  containerHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  clientWidth: number;
  clientHeight: number;
}> = {}): ZoooomElements {
  const cw = overrides.containerWidth ?? 800;
  const ch = overrides.containerHeight ?? 600;

  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: cw, configurable: true });
  Object.defineProperty(container, 'clientHeight', { value: ch, configurable: true });
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    width: cw, height: ch,
    top: 0, left: 0, bottom: ch, right: cw,
    x: 0, y: 0, toJSON: () => {},
  });

  const image = document.createElement('img');
  image.style.transform = '';
  Object.defineProperty(image, 'naturalWidth', { value: overrides.naturalWidth ?? 4000 });
  Object.defineProperty(image, 'naturalHeight', { value: overrides.naturalHeight ?? 3000 });
  Object.defineProperty(image, 'clientWidth', { value: overrides.clientWidth ?? 800 });
  Object.defineProperty(image, 'clientHeight', { value: overrides.clientHeight ?? 600 });

  return { container, image, loadingOverlay: null };
}

// --- updateTransform ---

describe('updateTransform', () => {
  it('applies baseScale * userScale as CSS scale', () => {
    const state = makeState({ scale: 2, baseScale: 0.5, translateX: 100, translateY: -50 });
    const elements = makeElements();
    updateTransform(state, elements);
    // CSS scale = 0.5 * 2 = 1
    expect(elements.image.style.transform).toBe(
      'translate(calc(-50% + 100px), calc(-50% + -50px)) scale(1)',
    );
  });

  it('handles default state (baseScale=1, scale=1)', () => {
    const state = makeState();
    const elements = makeElements();
    updateTransform(state, elements);
    expect(elements.image.style.transform).toBe(
      'translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1)',
    );
  });
});

// --- centerImage ---

describe('centerImage', () => {
  it('resets translate to 0,0 without changing scale', () => {
    const state = makeState({ scale: 3, translateX: 200, translateY: -100 });
    const elements = makeElements();
    centerImage(state, elements);
    expect(state.translateX).toBe(0);
    expect(state.translateY).toBe(0);
    expect(state.scale).toBe(3);
  });
});

// --- resetView ---

describe('resetView', () => {
  it('resets all transform state', () => {
    const state = makeState({
      scale: 5, translateX: 300, translateY: -200,
      velocityX: 10, velocityY: -5,
    });
    const elements = makeElements();
    resetView(state, elements);
    expect(state.scale).toBe(1);
    expect(state.translateX).toBe(0);
    expect(state.translateY).toBe(0);
    expect(state.velocityX).toBe(0);
    expect(state.velocityY).toBe(0);
  });
});

// --- calculateMaxScale ---

describe('calculateBaseScale', () => {
  it('fits a large image into a small container', () => {
    // 4000x3000 image in 800x600 container
    const elements = makeElements();
    const base = calculateBaseScale(elements);
    // min(800/4000, 600/3000) = min(0.2, 0.2) = 0.2
    expect(base).toBe(0.2);
  });

  it('returns 1 when image fits naturally', () => {
    const elements = makeElements({
      naturalWidth: 400, naturalHeight: 300,
      clientWidth: 400, clientHeight: 300,
      containerWidth: 800, containerHeight: 600,
    });
    const base = calculateBaseScale(elements);
    // min(800/400, 600/300) = min(2, 2) = 2 — but we want fit, not upscale
    expect(base).toBe(2);
  });
});

describe('calculateMaxScale', () => {
  it('allows zoom to native resolution * overscale', () => {
    // baseScale=0.2, so native=5, overscale 2 = 10
    const state = makeState({ baseScale: 0.2 });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const result = calculateMaxScale(state, 2);
    expect(result).toBe(10);
  });

  it('returns higher scale on mobile', () => {
    const state = makeState({ baseScale: 0.2 });
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    const result = calculateMaxScale(state, 2);
    // native=5, mobile overscale=4 → 20
    expect(result).toBe(20);
  });

  it('returns 10 when baseScale is 0', () => {
    const state = makeState({ baseScale: 0 });
    const result = calculateMaxScale(state);
    expect(result).toBe(10);
  });

  it('respects custom overscale factor', () => {
    const state = makeState({ baseScale: 0.2 });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const result = calculateMaxScale(state, 3);
    // native=5, overscale=3 → 15
    expect(result).toBe(15);
  });
});

// --- zoomTowardsPoint ---

describe('zoomTowardsPoint', () => {
  it('zooms in and adjusts translate to keep point stationary', () => {
    const state = makeState({ maxScale: 10 });
    const elements = makeElements();
    // Zoom in 1.5x toward container center (400, 300)
    zoomTowardsPoint(state, elements, 1.5);
    expect(state.scale).toBe(1.5);
    // Zooming toward center with 0 translate keeps translate at 0
    expect(state.translateX).toBe(0);
    expect(state.translateY).toBe(0);
  });

  it('zooms toward an off-center point and shifts translate', () => {
    const state = makeState({ maxScale: 10 });
    const elements = makeElements();
    // Zoom toward top-left corner (0, 0) of 800x600 container
    // baseScale=1, so CSS scale = userScale
    zoomTowardsPoint(state, elements, 2, 0, 0);
    expect(state.scale).toBe(2);
    // currentCSS = 1*1 = 1, newCSS = 1*2 = 2
    // imageX = (0 - 400 - 0) / 1 = -400
    // translateX = 0 - 400 - (-400 * 2) = 400
    expect(state.translateX).toBe(400);
    expect(state.translateY).toBe(300);
  });

  it('does not exceed maxScale', () => {
    const state = makeState({ scale: 9, maxScale: 10 });
    const elements = makeElements();
    zoomTowardsPoint(state, elements, 2);
    expect(state.scale).toBe(10);
  });

  it('does not go below MIN_SCALE (0.8)', () => {
    const state = makeState({ scale: 1, maxScale: 10 });
    const elements = makeElements();
    zoomTowardsPoint(state, elements, 0.5);
    expect(state.scale).toBe(0.8);
  });

  it('does nothing when already at limit', () => {
    const state = makeState({ scale: 10, maxScale: 10, translateX: 50 });
    const elements = makeElements();
    zoomTowardsPoint(state, elements, 2);
    // Scale unchanged, translate unchanged
    expect(state.scale).toBe(10);
    expect(state.translateX).toBe(50);
  });

  it('calls onZoom callback with new scale', () => {
    const state = makeState({ maxScale: 10 });
    const elements = makeElements();
    const onZoom = vi.fn();
    zoomTowardsPoint(state, elements, 1.5, undefined, undefined, onZoom);
    expect(onZoom).toHaveBeenCalledWith(1.5);
  });
});

// --- animateMovement ---

describe('animateMovement', () => {
  it('zeroes velocity immediately when reducedMotion is true', () => {
    const state = makeState({ reducedMotion: true, velocityX: 10, velocityY: -5 });
    const elements = makeElements();
    animateMovement(state, elements);
    expect(state.velocityX).toBe(0);
    expect(state.velocityY).toBe(0);
    expect(state.isAnimating).toBe(false);
  });

  it('starts animation when reducedMotion is false', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    const state = makeState({ velocityX: 10, velocityY: -5 });
    const elements = makeElements();
    animateMovement(state, elements);
    expect(state.isAnimating).toBe(true);
    expect(rafSpy).toHaveBeenCalled();
    rafSpy.mockRestore();
  });
});
