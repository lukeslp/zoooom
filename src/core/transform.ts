import { MIN_SCALE, OVERSCALE_FACTOR, VELOCITY_DAMPING } from './constants.js';
import type { ZoooomState, ZoooomElements } from '../types.js';

/**
 * Apply the current transform state to the image element.
 * Uses translate(calc(-50% + Xpx), calc(-50% + Ypx)) scale(S) for center-anchored zoom.
 */
export function updateTransform(state: ZoooomState, elements: ZoooomElements): void {
  if (!elements.image) return;
  elements.image.style.transform =
    `translate(calc(-50% + ${state.translateX}px), calc(-50% + ${state.translateY}px)) scale(${state.scale})`;
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
 * Calculate the maximum zoom scale from the image's natural vs displayed dimensions.
 * Allows zooming to full native resolution * overscale factor.
 */
export function calculateMaxScale(
  elements: ZoooomElements,
  overscaleFactor: number = OVERSCALE_FACTOR,
): number {
  if (!elements.image) return 10;

  const naturalWidth = elements.image.naturalWidth;
  const naturalHeight = elements.image.naturalHeight;
  const displayWidth = elements.image.clientWidth;
  const displayHeight = elements.image.clientHeight;

  if (!naturalWidth || !naturalHeight || !displayWidth || !displayHeight) return 10;

  const widthRatio = naturalWidth / displayWidth;
  const heightRatio = naturalHeight / displayHeight;
  const maxScaleFactor = Math.max(widthRatio, heightRatio);

  // Higher overscale on mobile for full-res zoom
  const mobileOverscale = window.innerWidth <= 768 ? overscaleFactor * 2 : overscaleFactor;
  return Math.max(maxScaleFactor * mobileOverscale, MIN_SCALE);
}

/**
 * Zoom toward a specific point (cursor, pinch center, or container center).
 * Maintains the image point under the target coordinate.
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

  const currentScale = state.scale;
  const newScale = Math.max(MIN_SCALE, Math.min(state.scale * delta, state.maxScale));

  if (newScale === currentScale) return;

  const containerRect = elements.container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  const targetX = pointX ?? containerCenterX;
  const targetY = pointY ?? containerCenterY;

  // Calculate the image point under the target coordinate
  const imageX = (targetX - containerCenterX - state.translateX) / currentScale;
  const imageY = (targetY - containerCenterY - state.translateY) / currentScale;

  // Update translation to keep that point stationary
  state.translateX = targetX - containerCenterX - imageX * newScale;
  state.translateY = targetY - containerCenterY - imageY * newScale;

  // Smooth zoom transition (skipped for reduced motion)
  if (!state.reducedMotion) {
    elements.image.style.transition = 'transform 0.2s ease-out';
  }

  state.scale = newScale;
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
