import { MIN_SCALE, OVERSCALE_FACTOR, VELOCITY_DAMPING } from './constants.js';
import type { ZoooomState, ZoooomElements } from '../types.js';

/** The actual CSS scale applied to the image: baseScale * userScale */
function cssScale(state: ZoooomState): number {
  return state.baseScale * state.scale;
}

/**
 * Apply the current transform state to the image element.
 * The image renders at native resolution; baseScale * scale fits/zooms it.
 */
export function updateTransform(state: ZoooomState, elements: ZoooomElements): void {
  if (!elements.image) return;
  const s = cssScale(state);
  elements.image.style.transform =
    `translate(calc(-50% + ${state.translateX}px), calc(-50% + ${state.translateY}px)) scale(${s})`;
}

/**
 * Animate momentum after pan release — velocity decays per frame via damping.
 * Skipped when reduced motion is preferred.
 */
export function animateMovement(
  state: ZoooomState,
  elements: ZoooomElements,
  onPan?: (x: number, y: number) => void,
): void {
  if (state.reducedMotion) {
    state.velocityX = 0;
    state.velocityY = 0;
    return;
  }

  state.isAnimating = true;

  function step() {
    state.translateX += state.velocityX;
    state.translateY += state.velocityY;
    state.velocityX *= VELOCITY_DAMPING;
    state.velocityY *= VELOCITY_DAMPING;

    updateTransform(state, elements);
    onPan?.(state.translateX, state.translateY);

    if (Math.abs(state.velocityX) > 0.1 || Math.abs(state.velocityY) > 0.1) {
      requestAnimationFrame(step);
    } else {
      state.velocityX = 0;
      state.velocityY = 0;
      state.isAnimating = false;
    }
  }

  requestAnimationFrame(step);
}

/** Center the image in the container (reset translate without changing scale) */
export function centerImage(state: ZoooomState, elements: ZoooomElements): void {
  if (!elements.container || !elements.image) return;
  state.translateX = 0;
  state.translateY = 0;
  updateTransform(state, elements);
}

/** Reset view to scale=1, centered, zero velocity */
export function resetView(state: ZoooomState, elements: ZoooomElements): void {
  state.scale = 1;
  state.translateX = 0;
  state.translateY = 0;
  state.velocityX = 0;
  state.velocityY = 0;
  updateTransform(state, elements);
}

/**
 * Calculate the base scale that fits the native image into the container.
 * Called once on image load.
 */
export function calculateBaseScale(elements: ZoooomElements): number {
  if (!elements.image || !elements.container) return 1;

  const natW = elements.image.naturalWidth;
  const natH = elements.image.naturalHeight;
  const conW = elements.container.clientWidth;
  const conH = elements.container.clientHeight;

  if (!natW || !natH || !conW || !conH) return 1;

  return Math.min(conW / natW, conH / natH);
}

/**
 * Calculate the maximum user-facing scale.
 * scale=1 means fitted; maxScale lets you zoom to native resolution * overscale.
 */
export function calculateMaxScale(
  state: ZoooomState,
  overscaleFactor: number = OVERSCALE_FACTOR,
): number {
  if (!state.baseScale || state.baseScale <= 0) return 10;

  // At scale=1, CSS scale = baseScale. Native pixels = 1/baseScale.
  // Allow zooming to native res * overscale factor.
  const nativeScale = 1 / state.baseScale;
  const mobileOverscale = window.innerWidth <= 768 ? overscaleFactor * 2 : overscaleFactor;
  return Math.max(nativeScale * mobileOverscale, 1);
}

/**
 * Zoom toward a specific point (cursor, pinch center, or container center).
 * Maintains the image point under the target coordinate.
 * All coordinate math uses the actual CSS scale (baseScale * userScale).
 */
export function zoomTowardsPoint(
  state: ZoooomState,
  elements: ZoooomElements,
  delta: number,
  pointX?: number,
  pointY?: number,
  onZoom?: (scale: number) => void,
): void {
  if (!elements.container || !elements.image) return;

  const currentUserScale = state.scale;
  const newUserScale = Math.max(MIN_SCALE, Math.min(state.scale * delta, state.maxScale));

  if (newUserScale === currentUserScale) return;

  const currentCSS = state.baseScale * currentUserScale;
  const newCSS = state.baseScale * newUserScale;

  const containerRect = elements.container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  const targetX = pointX ?? containerCenterX;
  const targetY = pointY ?? containerCenterY;

  // Calculate the image point under the target coordinate using actual CSS scale
  const imageX = (targetX - containerCenterX - state.translateX) / currentCSS;
  const imageY = (targetY - containerCenterY - state.translateY) / currentCSS;

  // Update translation to keep that point stationary at the new scale
  state.translateX = targetX - containerCenterX - imageX * newCSS;
  state.translateY = targetY - containerCenterY - imageY * newCSS;

  // Smooth zoom transition (skipped for reduced motion)
  if (!state.reducedMotion) {
    elements.image.style.transition = 'transform 0.2s ease-out';
  }

  state.scale = newUserScale;
  updateTransform(state, elements);
  onZoom?.(state.scale);

  if (!state.reducedMotion) {
    setTimeout(() => {
      if (elements.image) {
        elements.image.style.transition = '';
      }
    }, 200);
  }
}
