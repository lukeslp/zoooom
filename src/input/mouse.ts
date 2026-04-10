import type { ZoooomState, ZoooomElements, InputCleanup } from '../types.js';
import { updateTransform } from '../core/transform.js';

/**
 * Attach mouse drag-to-pan handlers.
 * Returns a cleanup function to remove all listeners.
 */
export function attachMouse(
  state: ZoooomState,
  elements: ZoooomElements,
  onPan?: (x: number, y: number) => void,
): InputCleanup {
  const { container } = elements;

  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // Left button only
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    container.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!state.isDragging) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    state.translateX += dx;
    state.translateY += dy;
    state.startX = e.clientX;
    state.startY = e.clientY;
    updateTransform(state, elements);
    onPan?.(state.translateX, state.translateY);
  }

  function handleMouseUp() {
    if (state.isDragging) {
      state.isDragging = false;
      container.style.cursor = 'grab';
    }
  }

  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);

  return () => {
    container.removeEventListener('mousedown', handleMouseDown);
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseup', handleMouseUp);
    container.removeEventListener('mouseleave', handleMouseUp);
  };
}
