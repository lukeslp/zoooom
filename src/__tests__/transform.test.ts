import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateTransform,
  centerImage,
  resetView,
  zoomTowardsPoint,
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
  it('sets the correct CSS transform string', () => {
    const state = makeState({ scale: 2, translateX: 100, translateY: -50 });
    const elements = makeElements();
    updateTransform(state, elements);
    expect(elements.image.style.transform).toBe(
      'translate(calc(-50% + 100px), calc(-50% + -50px)) scale(2)',
    );
  });

  it('handles default state (identity)', () => {
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

describe('calculateMaxScale', () => {
  it('calculates from natural vs display dimensions', () => {
    // 4000x3000 natural, 800x600 display = ratio 5:1
    // Desktop (innerWidth > 768): 5 * 2 = 10
    const elements = makeElements();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const result = calculateMaxScale(elements, 2);
    expect(result).toBe(10);
  });

  it('returns higher scale on mobile', () => {
    const elements = makeElements();
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    const result = calculateMaxScale(elements, 2);
    // 5 * (2*2) = 20
    expect(result).toBe(20);
  });

  it('returns 10 when dimensions are missing', () => {
    const elements = makeElements({ naturalWidth: 0, naturalHeight: 0 });
    const result = calculateMaxScale(elements);
    expect(result).toBe(10);
  });

  it('respects custom overscale factor', () => {
    const elements = makeElements();
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    const result = calculateMaxScale(elements, 3);
    // ratio 5, overscale 3 = 15
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
    zoomTowardsPoint(state, elements, 2, 0, 0);
    expect(state.scale).toBe(2);
    // Point (0,0) is at (-400, -300) from center
    // imageX = (0 - 400 - 0) / 1 = -400
    // imageY = (0 - 300 - 0) / 1 = -300
    // translateX = 0 - 400 - (-400 * 2) = -400 + 800 = 400
    // translateY = 0 - 300 - (-300 * 2) = -300 + 600 = 300
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
