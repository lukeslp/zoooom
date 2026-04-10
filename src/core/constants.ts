/** Default pan distance for keyboard arrows (px) */
export const PAN_STEP = 50;

/** Zoom multiplier per discrete step (>1 zooms in) */
export const ZOOM_FACTOR = 1.5;

/** Minimum zoom scale (allows slight zoom-out) */
export const MIN_SCALE = 0.8;

/** Multiplier beyond native resolution for max zoom */
export const OVERSCALE_FACTOR = 2;

/** Friction coefficient for momentum — velocity *= this each frame */
export const VELOCITY_DAMPING = 0.85;

/** Sensitivity for trackpad continuous zoom */
export const TRACKPAD_SENSITIVITY = 0.002;

/** Joystick panning zone radius (px) */
export const JOYSTICK_RADIUS = 60;

/** Center deadzone as fraction of radius */
export const JOYSTICK_DEADZONE = 0.1;

/** Maximum joystick panning speed (px/frame) */
export const MAX_JOYSTICK_SPEED = 10;

/** Dwell timeout before joystick activates (ms) */
export const DWELL_TIMEOUT = 100;
