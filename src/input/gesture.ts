import { ZOOM_FACTOR } from '../core/constants.js';
import { zoomTowardsPoint } from '../core/transform.js';
import type { ZoooomState, ZoooomElements, InputCleanup } from '../types.js';

/**
 * Attach Safari gesture events (gesturestart/change/end).
 * Only activates in Safari where GestureEvent exists.
 */
export function attachGesture(
  state: ZoooomState,
  elements: ZoooomElements,
  onZoom?: (scale: number) => void,
): InputCleanup {
  const { container } = elements;

  // Only Safari supports gesture events
  if (!('ongesturestart' in window)) {
    return () => {};
  }

  let startScale = 1;

  function handleGestureStart(e: Event) {
    e.preventDefault();
    startScale = state.scale;
  }

  function handleGestureChange(e: Event) {
    e.preventDefault();
    const ge = e as unknown as { scale: number };
    const rect = container.getBoundingClientRect();
    const delta = ge.scale > 1 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    zoomTowardsPoint(state, elements, delta, rect.width / 2, rect.height / 2, onZoom);
  }

  function handleGestureEnd(e: Event) {
    e.preventDefault();
  }

  container.addEventListener('gesturestart', handleGestureStart, { passive: false } as EventListenerOptions);
  container.addEventListener('gesturechange', handleGestureChange, { passive: false } as EventListenerOptions);
  container.addEventListener('gestureend', handleGestureEnd, { passive: false } as EventListenerOptions);

  return () => {
    container.removeEventListener('gesturestart', handleGestureStart);
    container.removeEventListener('gesturechange', handleGestureChange);
    container.removeEventListener('gestureend', handleGestureEnd);
  };
}
