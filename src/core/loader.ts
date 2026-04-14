import type { ZoooomState, ZoooomElements, ZoooomResolvedOptions } from '../types.js';
import { calculateBaseScale, calculateMaxScale, centerImage } from './transform.js';

/**
 * Create the loading overlay element (spinner + text).
 * Returns null if loading is disabled.
 */
export function createLoadingOverlay(
  container: HTMLElement,
  loading: boolean | string,
): HTMLElement | null {
  if (loading === false) return null;

  const overlay = document.createElement('div');
  overlay.className = 'zoooom-loading';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'Loading image');

  if (typeof loading === 'string') {
    overlay.innerHTML = loading;
  } else {
    overlay.innerHTML = `
      <div class="zoooom-spinner"></div>
      <div class="zoooom-loading-text">Loading...</div>
    `;
  }

  container.appendChild(overlay);
  return overlay;
}

/** Remove the loading overlay from the DOM */
function removeLoadingOverlay(elements: ZoooomElements): void {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.remove();
    elements.loadingOverlay = null;
  }
}

/**
 * Load an image into the viewer with preloading, loading state, and fade-in.
 * Decoupled from any data source — just takes a URL and alt text.
 */
export function loadImage(
  src: string,
  alt: string,
  state: ZoooomState,
  elements: ZoooomElements,
  options: ZoooomResolvedOptions,
  emit: (event: string, ...args: unknown[]) => void,
): void {
  // Reset transform state
  state.scale = 1;
  state.translateX = 0;
  state.translateY = 0;
  state.velocityX = 0;
  state.velocityY = 0;
  state.isLoaded = false;

  // Remove any existing loading overlay
  removeLoadingOverlay(elements);

  // Create loading overlay
  elements.loadingOverlay = createLoadingOverlay(elements.container, options.loading);

  // Hide image during load
  elements.image.style.opacity = '0';
  elements.image.style.visibility = 'hidden';
  elements.image.setAttribute('aria-hidden', 'true');
  elements.image.setAttribute('alt', '');

  // Preload at full resolution
  const preloader = new Image();

  preloader.onload = () => {
    // Set handlers BEFORE setting src — if the image is cached,
    // the browser may fire onload synchronously on src assignment.
    elements.image.onload = () => {
      removeLoadingOverlay(elements);

      // Restore alt text
      elements.image.setAttribute('alt', alt);
      elements.image.removeAttribute('aria-hidden');

      // Fade in (or show immediately for reduced motion)
      if (state.reducedMotion) {
        elements.image.style.opacity = '1';
        elements.image.style.visibility = 'visible';
      } else {
        setTimeout(() => {
          elements.image.style.transition = 'opacity 0.3s ease-in-out';
          elements.image.style.opacity = '1';
          elements.image.style.visibility = 'visible';

          // Clear transition after fade
          setTimeout(() => {
            elements.image.style.transition = '';
          }, 300);
        }, 50);
      }

      // Calculate base scale (fit native image to container) and max zoom
      state.baseScale = calculateBaseScale(elements);
      if (options.maxScale === 'auto') {
        state.maxScale = calculateMaxScale(state, options.overscaleFactor);
      }

      centerImage(state, elements);
      state.isLoaded = true;
      emit('load');
      options.onLoad?.();
    };

    elements.image.onerror = () => {
      removeLoadingOverlay(elements);
      const error = new Error(`Failed to load image: ${src}`);
      emit('error', error);
      options.onError?.(error);
    };

    elements.image.src = preloader.src;
  };

  preloader.onerror = () => {
    removeLoadingOverlay(elements);
    const error = new Error(`Failed to load image: ${src}`);
    emit('error', error);
    options.onError?.(error);
  };

  preloader.src = src;
}
