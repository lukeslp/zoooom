/** Configuration options for the Zoooom viewer */
export interface ZoooomOptions {
  /** Image URL to display (required) */
  src: string;
  /** Alt text for the image */
  alt?: string;

  // Zoom behavior
  /** Minimum zoom scale (default: 0.8) */
  minScale?: number;
  /** Maximum zoom scale — 'auto' calculates from natural dimensions (default: 'auto') */
  maxScale?: number | 'auto';
  /** Multiplier beyond native resolution for max zoom (default: 2) */
  overscaleFactor?: number;
  /** Zoom multiplier per discrete step (default: 1.5) */
  zoomFactor?: number;

  // Pan behavior
  /** Keyboard pan distance in pixels (default: 50) */
  panStep?: number;
  /** Momentum friction coefficient, 0-1 (default: 0.85) */
  velocityDamping?: number;

  // Trackpad
  /** Sensitivity for continuous trackpad zoom (default: 0.002) */
  trackpadSensitivity?: number;

  // Input methods
  /** Enable mouse drag/wheel (default: true) */
  mouse?: boolean;
  /** Enable touch pan/pinch (default: true) */
  touch?: boolean;
  /** Enable wheel/trackpad zoom (default: true) */
  wheel?: boolean;
  /** Enable keyboard navigation (default: true) */
  keyboard?: boolean;

  // Loading
  /** Show loading spinner — true for default, string for custom HTML, false to disable */
  loading?: boolean | string;

  // CSS
  /** Auto-inject bundled CSS (default: true) */
  injectStyles?: boolean;

  // Accessibility
  /** Honor prefers-reduced-motion (default: true) */
  respectReducedMotion?: boolean;

  // Callbacks
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onZoom?: (scale: number) => void;
  onPan?: (x: number, y: number) => void;
}

/** Internal mutable state for the viewer */
export interface ZoooomState {
  scale: number;
  translateX: number;
  translateY: number;
  velocityX: number;
  velocityY: number;
  maxScale: number;
  baseScale: number;
  isDragging: boolean;
  isAnimating: boolean;
  isLoaded: boolean;
  startX: number;
  startY: number;
  initialDistance: number;
  initialScale: number;
  initialTranslateX: number;
  initialTranslateY: number;
  pinchCenter: { x: number; y: number };
  wheelTimeout: ReturnType<typeof setTimeout> | null;
  reducedMotion: boolean;
}

/** Event types emitted by Zoooom */
export type ZoooomEvent = 'load' | 'error' | 'zoom' | 'pan' | 'reset' | 'destroy';

/** Event handler function */
export type ZoooomEventHandler = (...args: unknown[]) => void;

/** Resolved options with defaults applied */
export type ZoooomResolvedOptions = Required<Omit<ZoooomOptions, 'onLoad' | 'onError' | 'onZoom' | 'onPan' | 'maxScale'>> & {
  maxScale: number | 'auto';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onZoom?: (scale: number) => void;
  onPan?: (x: number, y: number) => void;
};

/** DOM elements managed by the viewer */
export interface ZoooomElements {
  container: HTMLElement;
  image: HTMLImageElement;
  loadingOverlay: HTMLElement | null;
}

/** Cleanup function returned by input handlers */
export type InputCleanup = () => void;

/** Joystick plugin options */
export interface JoystickOptions {
  /** Panning zone radius in pixels (default: 60) */
  radius?: number;
  /** Center deadzone as fraction 0-1 (default: 0.1) */
  deadzone?: number;
  /** Max panning speed in px/frame (default: 10) */
  maxSpeed?: number;
  /** Position of the joystick (default: 'bottom-center') */
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right';
  /** Show compass toggle button (default: true) */
  showToggle?: boolean;
  /** Milliseconds before dwell activates panning (default: 100) */
  dwellTimeout?: number;
}
