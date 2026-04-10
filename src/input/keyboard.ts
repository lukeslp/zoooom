import { PAN_STEP, ZOOM_FACTOR } from '../core/constants.js';
import { zoomTowardsPoint, animateMovement, resetView } from '../core/transform.js';
import type { ZoooomState, ZoooomElements, InputCleanup } from '../types.js';

/**
 * Attach keyboard navigation handlers.
 * Arrows pan, +/- zoom, R resets, Escape is reserved for parent contexts.
 */
export function attachKeyboard(
  state: ZoooomState,
  elements: ZoooomElements,
  panStep: number = PAN_STEP,
  zoomFactor: number = ZOOM_FACTOR,
  onPan?: (x: number, y: number) => void,
  onZoom?: (scale: number) => void,
): InputCleanup {
  const { container } = elements;

  function handleKeyDown(e: KeyboardEvent) {
    let handled = true;

    switch (e.key) {
      case 'ArrowLeft':
        state.velocityX = panStep * 0.2;
        animateMovement(state, elements, onPan);
        break;
      case 'ArrowRight':
        state.velocityX = -panStep * 0.2;
        animateMovement(state, elements, onPan);
        break;
      case 'ArrowUp':
        state.velocityY = panStep * 0.2;
        animateMovement(state, elements, onPan);
        break;
      case 'ArrowDown':
        state.velocityY = -panStep * 0.2;
        animateMovement(state, elements, onPan);
        break;
      case '+': case '=':
        zoomTowardsPoint(state, elements, zoomFactor, undefined, undefined, onZoom);
        break;
      case '-':
        zoomTowardsPoint(state, elements, 1 / zoomFactor, undefined, undefined, onZoom);
        break;
      case 'r': case 'R':
        resetView(state, elements);
        break;
      default:
        handled = false;
    }

    if (handled) e.preventDefault();
  }

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}
