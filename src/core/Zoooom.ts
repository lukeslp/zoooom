import type {
  ZoooomOptions,
  ZoooomResolvedOptions,
  ZoooomState,
  ZoooomElements,
  ZoooomEvent,
  ZoooomEventHandler,
  InputCleanup,
} from '../types.js';
import { MIN_SCALE, ZOOM_FACTOR, OVERSCALE_FACTOR, VELOCITY_DAMPING, PAN_STEP, TRACKPAD_SENSITIVITY } from './constants.js';
import { updateTransform, zoomTowardsPoint, resetView, centerImage } from './transform.js';
import { loadImage } from './loader.js';
import { attachMouse } from '../input/mouse.js';
import { attachTouch } from '../input/touch.js';
import { attachWheel } from '../input/wheel.js';
import { attachKeyboard } from '../input/keyboard.js';
import { attachGesture } from '../input/gesture.js';
import { injectCoreStyles } from '../styles/core.js';

const DEFAULTS: ZoooomResolvedOptions = {
  src: '',
  alt: 'Image',
  minScale: MIN_SCALE,
  maxScale: 'auto',
  overscaleFactor: OVERSCALE_FACTOR,
  zoomFactor: ZOOM_FACTOR,
  panStep: PAN_STEP,
  velocityDamping: VELOCITY_DAMPING,
  trackpadSensitivity: TRACKPAD_SENSITIVITY,
  mouse: true,
  touch: true,
  wheel: true,
  keyboard: true,
  loading: true,
  injectStyles: true,
  respectReducedMotion: true,
};

export class Zoooom {
  private state: ZoooomState;
  private elements: ZoooomElements;
  private options: ZoooomResolvedOptions;
  private cleanups: InputCleanup[] = [];
  private listeners = new Map<string, Set<ZoooomEventHandler>>();
  private resizeHandler: (() => void) | null = null;

  constructor(container: string | HTMLElement, options: ZoooomOptions) {
    this.options = { ...DEFAULTS, ...options } as ZoooomResolvedOptions;

    // Inject styles
    if (this.options.injectStyles) {
      injectCoreStyles();
    }

    // Resolve container
    const el = typeof container === 'string'
      ? document.querySelector<HTMLElement>(container)
      : container;

    if (!el) {
      throw new Error(`Zoooom: container "${container}" not found`);
    }

    // Warn if container has no dimensions
    if (el.clientWidth === 0 || el.clientHeight === 0) {
      console.warn('Zoooom: container has zero dimensions. The viewer needs explicit width/height.');
    }

    // Set up container
    el.setAttribute('data-zoooom', '');
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
    el.setAttribute('role', 'application');
    el.setAttribute('aria-label', 'Image viewer — use arrow keys to pan, +/- to zoom');

    // Create image element
    const img = document.createElement('img');
    img.className = 'zoooom-image';
    img.setAttribute('draggable', 'false');
    el.appendChild(img);

    this.elements = { container: el, image: img, loadingOverlay: null };

    // Detect reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducedMotion = this.options.respectReducedMotion && motionQuery.matches;

    // Initialize state
    this.state = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      velocityX: 0,
      velocityY: 0,
      maxScale: typeof this.options.maxScale === 'number' ? this.options.maxScale : 10,
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
      reducedMotion,
    };

    // Listen for reduced motion changes
    if (this.options.respectReducedMotion) {
      motionQuery.addEventListener('change', (e) => {
        this.state.reducedMotion = e.matches;
      });
    }

    // Attach input handlers
    if (this.options.mouse) {
      this.cleanups.push(attachMouse(this.state, this.elements, this.options.onPan));
    }
    if (this.options.touch) {
      this.cleanups.push(attachTouch(
        this.state, this.elements, this.options.overscaleFactor,
        this.options.onPan, this.options.onZoom,
      ));
    }
    if (this.options.wheel) {
      this.cleanups.push(attachWheel(
        this.state, this.elements, this.options.zoomFactor,
        this.options.trackpadSensitivity, this.options.onZoom,
      ));
    }
    if (this.options.keyboard) {
      this.cleanups.push(attachKeyboard(
        this.state, this.elements, this.options.panStep,
        this.options.zoomFactor, this.options.onPan, this.options.onZoom,
      ));
    }
    this.cleanups.push(attachGesture(this.state, this.elements, this.options.onZoom));

    // Resize handler
    this.resizeHandler = () => centerImage(this.state, this.elements);
    window.addEventListener('resize', this.resizeHandler);

    // Load initial image
    if (this.options.src) {
      this.load(this.options.src, this.options.alt);
    }
  }

  // --- Public state ---

  get scale(): number { return this.state.scale; }
  get translateX(): number { return this.state.translateX; }
  get translateY(): number { return this.state.translateY; }
  get isLoaded(): boolean { return this.state.isLoaded; }

  // --- Public methods ---

  zoomIn(): void {
    zoomTowardsPoint(
      this.state, this.elements, this.options.zoomFactor,
      undefined, undefined, this.options.onZoom,
    );
    this.emit('zoom', this.state.scale);
  }

  zoomOut(): void {
    zoomTowardsPoint(
      this.state, this.elements, 1 / this.options.zoomFactor,
      undefined, undefined, this.options.onZoom,
    );
    this.emit('zoom', this.state.scale);
  }

  /** "Enhance." */
  enhance(): void {
    this.zoomIn();
  }

  zoomTo(scale: number): void {
    const delta = scale / this.state.scale;
    zoomTowardsPoint(this.state, this.elements, delta, undefined, undefined, this.options.onZoom);
    this.emit('zoom', this.state.scale);
  }

  zoomToPoint(scale: number, x: number, y: number): void {
    const delta = scale / this.state.scale;
    zoomTowardsPoint(this.state, this.elements, delta, x, y, this.options.onZoom);
    this.emit('zoom', this.state.scale);
  }

  panTo(x: number, y: number): void {
    this.state.translateX = x;
    this.state.translateY = y;
    updateTransform(this.state, this.elements);
    this.options.onPan?.(x, y);
    this.emit('pan', x, y);
  }

  panBy(dx: number, dy: number): void {
    this.state.translateX += dx;
    this.state.translateY += dy;
    updateTransform(this.state, this.elements);
    this.options.onPan?.(this.state.translateX, this.state.translateY);
    this.emit('pan', this.state.translateX, this.state.translateY);
  }

  reset(): void {
    resetView(this.state, this.elements);
    this.emit('reset');
  }

  center(): void {
    centerImage(this.state, this.elements);
  }

  load(src: string, alt?: string): void {
    loadImage(
      src,
      alt ?? this.options.alt,
      this.state,
      this.elements,
      this.options,
      this.emit.bind(this),
    );
  }

  /**
   * Apply velocity directly (used by joystick plugin).
   * Sets velocity and lets the rAF loop handle movement.
   */
  applyVelocity(vx: number, vy: number): void {
    this.state.translateX += vx;
    this.state.translateY += vy;
    updateTransform(this.state, this.elements);
  }

  /** Get the internal state (for plugin access) */
  getState(): Readonly<ZoooomState> {
    return this.state;
  }

  /** Get the managed elements (for plugin access) */
  getElements(): Readonly<ZoooomElements> {
    return this.elements;
  }

  // --- Events ---

  on(event: ZoooomEvent, handler: ZoooomEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: ZoooomEvent, handler: ZoooomEventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  // --- Lifecycle ---

  destroy(): void {
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.state.wheelTimeout) {
      clearTimeout(this.state.wheelTimeout);
    }

    // Remove DOM
    this.elements.image.remove();
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.remove();
    }
    this.elements.container.removeAttribute('data-zoooom');
    this.elements.container.removeAttribute('role');
    this.elements.container.removeAttribute('aria-label');

    this.listeners.clear();
    this.emit('destroy');
  }
}
