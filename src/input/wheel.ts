import { ZOOM_FACTOR, TRACKPAD_SENSITIVITY } from '../core/constants.js';
import { zoomTowardsPoint } from '../core/transform.js';
import type { ZoooomState, ZoooomElements, InputCleanup } from '../types.js';

/**
 * Attach wheel/trackpad zoom handler.
 * Detects trackpad vs mouse wheel via delta magnitude.
 * Handles Ctrl+wheel for pinch gestures on Windows/Linux.
 */
export function attachWheel(
  state: ZoooomState,
  elements: ZoooomElements,
  zoomFactor: number = ZOOM_FACTOR,
  trackpadSensitivity: number = TRACKPAD_SENSITIVITY,
  onZoom?: (scale: number) => void,
): InputCleanup {
  const { container } = elements;

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = container.getBoundingClientRect();
    const pointX = e.clientX - rect.left;
    const pointY = e.clientY - rect.top;

    let zoomDelta: number;

    if (e.ctrlKey) {
      // Pinch gesture (Ctrl+wheel on Windows/Linux)
      zoomDelta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
    } else {
      // Normalize delta based on deltaMode
      let normalizedDelta: number;
      switch (e.deltaMode) {
        case 1: normalizedDelta = e.deltaY * 20; break;   // LINE
        case 2: normalizedDelta = e.deltaY * 100; break;  // PAGE
        default: normalizedDelta = e.deltaY;               // PIXEL
      }

      if (Math.abs(normalizedDelta) < 40) {
        // Trackpad — continuous zoom
        zoomDelta = Math.exp(-normalizedDelta * trackpadSensitivity);
      } else {
        // Mouse wheel — discrete steps
        zoomDelta = normalizedDelta > 0 ? 1 / zoomFactor : zoomFactor;
      }
    }

    // Manage scroll state class for CSS transition control
    container.classList.add('zoooom-scrolling');
    if (state.wheelTimeout) clearTimeout(state.wheelTimeout);
    state.wheelTimeout = setTimeout(() => {
      container.classList.remove('zoooom-scrolling');
    }, 200);

    zoomTowardsPoint(state, elements, zoomDelta, pointX, pointY, onZoom);
  }

  container.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    container.removeEventListener('wheel', handleWheel);
    if (state.wheelTimeout) clearTimeout(state.wheelTimeout);
  };
}
