import type { JoystickOptions } from '../types.js';
import { JOYSTICK_RADIUS, JOYSTICK_DEADZONE, MAX_JOYSTICK_SPEED, DWELL_TIMEOUT } from '../core/constants.js';
import type { Zoooom } from '../core/Zoooom.js';
import { createJoystickDOM, destroyJoystickDOM, type JoystickDOM } from './dom.js';
import { injectJoystickStyles } from '../styles/joystick.js';

const DIRECTIONS = [
  'east', 'south-east', 'south', 'south-west',
  'west', 'north-west', 'north', 'north-east',
] as const;

function angleToDirection(angle: number): string {
  if (angle >= -22.5 && angle < 22.5) return 'east';
  if (angle >= 22.5 && angle < 67.5) return 'south-east';
  if (angle >= 67.5 && angle < 112.5) return 'south';
  if (angle >= 112.5 && angle < 157.5) return 'south-west';
  if (angle >= 157.5 || angle < -157.5) return 'west';
  if (angle >= -157.5 && angle < -112.5) return 'north-west';
  if (angle >= -112.5 && angle < -67.5) return 'north';
  return 'north-east';
}

export class ZoooomJoystick {
  private viewer: Zoooom;
  private dom: JoystickDOM;
  private options: Required<JoystickOptions>;
  private visible = false;
  private active = false;
  private animationId: number | null = null;
  private joystickX = 0;
  private joystickY = 0;
  private currentDirection = '';
  private dwellTimer: ReturnType<typeof setTimeout> | null = null;
  private isDwelling = false;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(viewer: Zoooom, options?: JoystickOptions) {
    this.viewer = viewer;
    this.options = {
      radius: options?.radius ?? JOYSTICK_RADIUS,
      deadzone: options?.deadzone ?? JOYSTICK_DEADZONE,
      maxSpeed: options?.maxSpeed ?? MAX_JOYSTICK_SPEED,
      position: options?.position ?? 'bottom-center',
      showToggle: options?.showToggle ?? true,
      dwellTimeout: options?.dwellTimeout ?? DWELL_TIMEOUT,
    };

    injectJoystickStyles();

    const elements = this.viewer.getElements();
    this.dom = createJoystickDOM(elements.container);
    this.bindEvents();
  }

  show(): void {
    this.visible = true;
    this.dom.wrap.classList.add('visible');
    this.dom.wrap.setAttribute('aria-hidden', 'false');
    this.dom.toggle.setAttribute('aria-expanded', 'true');
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }

  hide(): void {
    this.visible = false;
    this.dom.wrap.classList.remove('visible');
    this.dom.wrap.setAttribute('aria-hidden', 'true');
    this.dom.toggle.setAttribute('aria-expanded', 'false');
    this.stopMovement();
    this.clearDirection();
  }

  destroy(): void {
    this.hide();
    this.stopMovement();
    if (this.dwellTimer) clearTimeout(this.dwellTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    destroyJoystickDOM(this.dom);
  }

  private bindEvents(): void {
    const { toggle, disc, zoomIn, zoomOut, innerCircle } = this.dom;

    // Toggle button
    toggle.addEventListener('click', () => {
      if (this.visible) this.hide();
      else this.show();
    });

    toggle.addEventListener('mouseenter', () => this.show());
    toggle.addEventListener('mouseleave', () => {
      this.hideTimer = setTimeout(() => this.hide(), 15000);
    });

    // Disc — panning
    disc.addEventListener('mousemove', (e) => {
      if (e.target !== disc) return;
      if (!this.isDwelling) {
        this.startDwell(e);
      } else {
        this.handleMove(e);
      }
    });

    disc.addEventListener('mousedown', (e) => {
      if (e.target !== disc) return;
      e.preventDefault();
      this.handleMove(e);

      const moveHandler = (me: MouseEvent) => this.handleMove(me);
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', moveHandler);
        this.stopDwell();
        this.resetJoystick();
      }, { once: true });
    });

    disc.addEventListener('mouseleave', () => {
      this.stopDwell();
      this.resetJoystick();
    });

    // Touch on disc
    disc.addEventListener('touchstart', (e) => {
      if (e.target !== disc) return;
      e.preventDefault();
      this.handleMove(e);

      const moveHandler = (te: TouchEvent) => this.handleMove(te);
      document.addEventListener('touchmove', moveHandler, { passive: false });
      document.addEventListener('touchend', () => {
        document.removeEventListener('touchmove', moveHandler);
        this.stopDwell();
        this.resetJoystick();
      }, { once: true });
    }, { passive: false });

    // Zoom buttons
    zoomIn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewer.zoomIn();
    });

    zoomOut.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewer.zoomOut();
    });

    // Stop panning when entering inner circle
    innerCircle.addEventListener('mouseenter', () => {
      this.stopDwell();
      this.resetJoystick();
    });

    innerCircle.addEventListener('mousedown', (e) => e.stopPropagation());
    innerCircle.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
  }

  private handleMove(event: MouseEvent | TouchEvent): void {
    if (!this.visible) return;

    const clientX = 'clientX' in event ? event.clientX : event.touches[0]?.clientX ?? 0;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0]?.clientY ?? 0;

    const rect = this.dom.disc.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = clientX - centerX;
    const distY = clientY - centerY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Normalize to -1..1
    let normalizedX = distX / this.options.radius;
    let normalizedY = distY / this.options.radius;

    if (distance > this.options.radius) {
      normalizedX = normalizedX * (this.options.radius / distance);
      normalizedY = normalizedY * (this.options.radius / distance);
    }

    if (Math.abs(normalizedX) < this.options.deadzone) normalizedX = 0;
    if (Math.abs(normalizedY) < this.options.deadzone) normalizedY = 0;

    this.joystickX = normalizedX;
    this.joystickY = normalizedY;

    // Direction feedback
    if (distance > this.options.radius * this.options.deadzone) {
      const angle = Math.atan2(distY, distX) * 180 / Math.PI;
      const dir = angleToDirection(angle);
      if (dir !== this.currentDirection) {
        this.clearDirection();
        this.dom.disc.classList.add(dir);
        this.currentDirection = dir;
      }
    } else {
      this.clearDirection();
    }

    // Start movement if not already running
    if (!this.animationId && (Math.abs(normalizedX) > this.options.deadzone || Math.abs(normalizedY) > this.options.deadzone)) {
      this.active = true;
      this.dom.disc.classList.add('active');
      this.startMovement();
      this.updateAria(normalizedX, normalizedY);
    } else if (Math.abs(normalizedX) <= this.options.deadzone && Math.abs(normalizedY) <= this.options.deadzone) {
      this.active = false;
      this.dom.disc.classList.remove('active');
      this.stopMovement();
      this.dom.disc.setAttribute('aria-valuenow', '0');
      this.dom.disc.setAttribute('aria-valuetext', 'Center position — not moving');
    }
  }

  private startDwell(e: MouseEvent | TouchEvent): void {
    if (this.dwellTimer) clearTimeout(this.dwellTimer);
    this.dwellTimer = setTimeout(() => {
      this.isDwelling = true;
      this.handleMove(e);
    }, this.options.dwellTimeout);
  }

  private stopDwell(): void {
    if (this.dwellTimer) {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = null;
    }
    this.isDwelling = false;
  }

  private startMovement(): void {
    if (this.animationId) return;
    const step = () => {
      if (!this.active) { this.stopMovement(); return; }
      const vx = -this.joystickX * this.options.maxSpeed;
      const vy = -this.joystickY * this.options.maxSpeed;
      this.viewer.applyVelocity(vx, vy);
      this.animationId = requestAnimationFrame(step);
    };
    this.animationId = requestAnimationFrame(step);
  }

  private stopMovement(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private resetJoystick(): void {
    this.joystickX = 0;
    this.joystickY = 0;
    this.active = false;
    this.stopMovement();
    this.clearDirection();
    this.dom.disc.classList.remove('active');
  }

  private clearDirection(): void {
    if (this.currentDirection) {
      this.dom.disc.classList.remove(this.currentDirection);
      this.currentDirection = '';
    }
  }

  private updateAria(x: number, y: number): void {
    const magnitude = Math.sqrt(x * x + y * y);
    this.dom.disc.setAttribute('aria-valuenow', magnitude.toFixed(2));

    let direction: string;
    if (Math.abs(x) > Math.abs(y)) {
      direction = x > 0 ? 'right' : 'left';
    } else {
      direction = y > 0 ? 'down' : 'up';
    }

    const intensity = magnitude > 0.7 ? 'fast' : magnitude > 0.3 ? 'medium' : 'slow';
    this.dom.disc.setAttribute('aria-valuetext', `Moving ${intensity} ${direction}`);
  }
}
