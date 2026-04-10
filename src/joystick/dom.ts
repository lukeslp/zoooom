/**
 * Create the joystick DOM structure.
 * Returns references to key elements for event binding.
 */
export interface JoystickDOM {
  wrap: HTMLElement;
  toggle: HTMLButtonElement;
  disc: HTMLElement;
  innerCircle: HTMLElement;
  zoomIn: HTMLElement;
  zoomOut: HTMLElement;
}

export function createJoystickDOM(container: HTMLElement): JoystickDOM {
  // Toggle button (compass)
  const toggle = document.createElement('button');
  toggle.className = 'zoooom-joystick-toggle';
  toggle.setAttribute('aria-label', 'Toggle navigation joystick');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = '\u2316'; // ⌖ position indicator
  container.appendChild(toggle);

  // Joystick wrapper
  const wrap = document.createElement('div');
  wrap.className = 'zoooom-joystick-wrap';
  wrap.setAttribute('aria-hidden', 'true');

  // Disc (outer pan area)
  const disc = document.createElement('div');
  disc.className = 'zoooom-disc';
  disc.setAttribute('role', 'slider');
  disc.setAttribute('aria-label', 'Pan navigation control');
  disc.setAttribute('aria-valuenow', '0');
  disc.setAttribute('aria-valuemin', '0');
  disc.setAttribute('aria-valuemax', '1');
  disc.setAttribute('aria-valuetext', 'Center position — not moving');
  disc.setAttribute('tabindex', '0');

  // Inner circle (zoom)
  const innerCircle = document.createElement('div');
  innerCircle.className = 'zoooom-inner-circle';

  const zoomOut = document.createElement('div');
  zoomOut.className = 'zoooom-zoom-half zoooom-zoom-out';
  zoomOut.setAttribute('role', 'button');
  zoomOut.setAttribute('aria-label', 'Zoom out');
  zoomOut.setAttribute('tabindex', '0');
  zoomOut.textContent = '\u2212'; // −

  const zoomIn = document.createElement('div');
  zoomIn.className = 'zoooom-zoom-half zoooom-zoom-in';
  zoomIn.setAttribute('role', 'button');
  zoomIn.setAttribute('aria-label', 'Zoom in');
  zoomIn.setAttribute('tabindex', '0');
  zoomIn.textContent = '+';

  innerCircle.appendChild(zoomOut);
  innerCircle.appendChild(zoomIn);

  // Direction arrows
  const arrows = document.createElement('div');
  arrows.className = 'zoooom-arrows';
  arrows.setAttribute('aria-hidden', 'true');
  for (const dir of ['n', 'e', 's', 'w']) {
    const arrow = document.createElement('div');
    arrow.className = `zoooom-arrow zoooom-arrow-${dir}`;
    arrows.appendChild(arrow);
  }

  disc.appendChild(innerCircle);
  disc.appendChild(arrows);
  wrap.appendChild(disc);
  container.appendChild(wrap);

  return { wrap, toggle, disc, innerCircle, zoomIn, zoomOut };
}

export function destroyJoystickDOM(dom: JoystickDOM): void {
  dom.wrap.remove();
  dom.toggle.remove();
}
