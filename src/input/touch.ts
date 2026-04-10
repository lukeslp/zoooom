import { MIN_SCALE } from '../core/constants.js';
import { calculateMaxScale, updateTransform } from '../core/transform.js';
import type { ZoooomState, ZoooomElements, InputCleanup } from '../types.js';

function getDistance(e: TouchEvent): number {
  const t1 = e.touches[0];
  const t2 = e.touches[1];
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Attach touch pan and pinch-to-zoom handlers.
 * Returns a cleanup function to remove all listeners.
 */
export function attachTouch(
  state: ZoooomState,
  elements: ZoooomElements,
  overscaleFactor: number,
  onPan?: (x: number, y: number) => void,
  onZoom?: (scale: number) => void,
): InputCleanup {
  const { container } = elements;

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      state.isDragging = true;
      state.startX = e.touches[0].clientX;
      state.startY = e.touches[0].clientY;
      state.initialDistance = 0;
    } else if (e.touches.length === 2) {
      state.isDragging = false;
      state.initialDistance = getDistance(e);
      state.initialScale = state.scale;
      state.initialTranslateX = state.translateX;
      state.initialTranslateY = state.translateY;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const rect = container.getBoundingClientRect();
      state.pinchCenter = {
        x: ((t1.clientX + t2.clientX) / 2) - rect.left,
        y: ((t1.clientY + t2.clientY) / 2) - rect.top,
      };
    }
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 1 && state.isDragging) {
      const dx = e.touches[0].clientX - state.startX;
      const dy = e.touches[0].clientY - state.startY;
      state.translateX += dx;
      state.translateY += dy;
      state.startX = e.touches[0].clientX;
      state.startY = e.touches[0].clientY;
      updateTransform(state, elements);
      onPan?.(state.translateX, state.translateY);
    } else if (e.touches.length === 2 && state.initialDistance > 0) {
      const currentDistance = getDistance(e);
      const scaleFactor = currentDistance / state.initialDistance;
      const targetScale = state.initialScale * scaleFactor;
      state.maxScale = calculateMaxScale(elements, overscaleFactor);
      const newScale = Math.max(MIN_SCALE, Math.min(targetScale, state.maxScale));

      if (newScale === state.scale) return;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const rect = container.getBoundingClientRect();
      const currentPinchCenter = {
        x: ((t1.clientX + t2.clientX) / 2) - rect.left,
        y: ((t1.clientY + t2.clientY) / 2) - rect.top,
      };

      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;

      const imageX = (state.pinchCenter.x - containerCenterX - state.initialTranslateX) / state.initialScale;
      const imageY = (state.pinchCenter.y - containerCenterY - state.initialTranslateY) / state.initialScale;

      state.translateX = currentPinchCenter.x - containerCenterX - imageX * newScale;
      state.translateY = currentPinchCenter.y - containerCenterY - imageY * newScale;

      state.scale = newScale;
      updateTransform(state, elements);
      onZoom?.(state.scale);

      state.pinchCenter = currentPinchCenter;
    }
  }

  function handleTouchEnd() {
    state.isDragging = false;
    state.initialDistance = 0;
  }

  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd);
  container.addEventListener('touchcancel', handleTouchEnd);

  return () => {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('touchcancel', handleTouchEnd);
  };
}
