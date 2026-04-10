export const JOYSTICK_CSS = `
.zoooom-joystick-wrap {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  touch-action: none;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.zoooom-joystick-wrap.visible {
  opacity: 1;
  pointer-events: auto;
}

.zoooom-joystick-toggle {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  backdrop-filter: blur(4px);
  transition: background 0.2s, box-shadow 0.2s;
}

.zoooom-joystick-toggle:hover {
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
}

.zoooom-joystick-toggle:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.zoooom-disc {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.6);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.zoooom-disc.active {
  border-color: rgba(255, 255, 255, 0.9);
}

.zoooom-inner-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  display: flex;
  position: relative;
  z-index: 3;
}

.zoooom-zoom-half {
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 22px;
  color: #fff;
  user-select: none;
  transition: background 0.15s;
}

.zoooom-zoom-half:hover {
  background: rgba(255, 255, 255, 0.25);
}

.zoooom-zoom-out {
  border-radius: 36px 0 0 36px;
  border-right: 1px solid rgba(255, 255, 255, 0.4);
}

.zoooom-zoom-in {
  border-radius: 0 36px 36px 0;
}

.zoooom-arrows {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  pointer-events: none;
  overflow: hidden;
}

.zoooom-arrow {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.zoooom-arrow-n {
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 14px solid rgba(255, 255, 255, 0.7);
}

.zoooom-arrow-e {
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 14px solid rgba(255, 255, 255, 0.7);
}

.zoooom-arrow-s {
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 14px solid rgba(255, 255, 255, 0.7);
}

.zoooom-arrow-w {
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 14px solid rgba(255, 255, 255, 0.7);
}

.zoooom-disc.north .zoooom-arrow-n,
.zoooom-disc.south .zoooom-arrow-s,
.zoooom-disc.east .zoooom-arrow-e,
.zoooom-disc.west .zoooom-arrow-w,
.zoooom-disc.north-east .zoooom-arrow-n,
.zoooom-disc.north-east .zoooom-arrow-e,
.zoooom-disc.south-east .zoooom-arrow-s,
.zoooom-disc.south-east .zoooom-arrow-e,
.zoooom-disc.south-west .zoooom-arrow-s,
.zoooom-disc.south-west .zoooom-arrow-w,
.zoooom-disc.north-west .zoooom-arrow-n,
.zoooom-disc.north-west .zoooom-arrow-w {
  opacity: 1;
}

@media (max-width: 768px) {
  .zoooom-disc {
    width: 140px;
    height: 140px;
  }

  .zoooom-inner-circle {
    width: 56px;
    height: 56px;
  }

  .zoooom-joystick-toggle {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .zoooom-joystick-wrap {
    transition: none;
  }

  .zoooom-arrow {
    transition: none;
  }
}
`;

let injected = false;

export function injectJoystickStyles(): void {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-zoooom-joystick', '');
  style.textContent = JOYSTICK_CSS;
  document.head.appendChild(style);
  injected = true;
}
