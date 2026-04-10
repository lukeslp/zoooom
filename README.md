# zoooom

<div align="center">

![enhance](https://media.tenor.com/atZ7_JeUlugAAAAM/enhance-supertroopers.gif)

*"Enhance."*

</div>

---

You know the scene. Someone squints at a blurry surveillance photo, says "enhance," and suddenly it's crystal clear at 4000x zoom. Every cop show. Every sci-fi movie. Every time, you think: that's not how images work.

**Except now it is.**

`zoooom` is a zero-dependency pan/zoom engine for images. Mouse, touch, trackpad, keyboard, and — because why not — a virtual joystick. Drop it on any image and let people *enhance* to their heart's content.

## Install

```bash
npm install zoooom
```

## Quick Start

```js
import Zoooom from 'zoooom';

const viewer = new Zoooom('#photo', { src: 'evidence.jpg' });
viewer.enhance(); // you know you want to
```

That's it. Two lines. You now have:
- Mouse drag to pan
- Scroll wheel / trackpad pinch to zoom (toward your cursor, not the center like an animal)
- Touch: single-finger pan, two-finger pinch
- Keyboard: arrows to pan, `+`/`-` to zoom, `R` to reset
- A loading spinner that fades out when the image is ready
- Momentum on release (that satisfying drift)
- Auto-calculated max zoom from the image's actual resolution

## Script Tag

No bundler? No problem.

```html
<div id="viewer" style="width: 100%; height: 100vh;"></div>
<script src="https://unpkg.com/zoooom/dist/zoooom.iife.global.js"></script>
<script>
  new Zoooom('#viewer', { src: 'satellite.jpg' });
</script>
```

## What Makes This Different

Most image zoom libraries are either:
1. jQuery plugins from 2014 that zoom to center (not cursor position)
2. React/Vue wrappers that bring 200KB of framework along
3. Overkill map engines that want tile servers

`zoooom` is none of those. It's the interaction engine extracted from an accessibility-first image viewer I built to display 165 high-resolution infographics. Battle-tested with mouse, touch, trackpad, keyboard, and even joystick input across Chrome, Firefox, Safari, and mobile.

**Zero dependencies. ~25KB core (before gzip). Works with any image.**

The zoom-toward-cursor math is correct (not the naive "scale from center" that most libs do). Trackpad detection distinguishes precision scrolling from mouse wheel clicks. Safari gesture events are handled. Pinch-to-zoom tracks the actual pinch center, not the image center.

## Options

```js
new Zoooom('#container', {
  src: 'photo.jpg',           // required
  alt: 'A satellite image',   // default: 'Image'
  minScale: 0.8,              // how far you can zoom out
  maxScale: 'auto',           // 'auto' = calculated from natural image dimensions
  zoomFactor: 1.5,            // multiplier per zoom step
  velocityDamping: 0.85,      // momentum friction (0 = ice rink, 1 = brick wall)
  trackpadSensitivity: 0.002, // fine-tuning for continuous trackpad zoom
  mouse: true,                // enable mouse input
  touch: true,                // enable touch input
  wheel: true,                // enable wheel/trackpad
  keyboard: true,             // enable keyboard nav
  loading: true,              // show loading spinner
  injectStyles: true,         // auto-inject CSS (disable for BYO styles)
  respectReducedMotion: true, // honor prefers-reduced-motion
  onLoad: () => {},           // fires when image is ready
  onZoom: (scale) => {},      // fires on zoom change
  onPan: (x, y) => {},        // fires on pan
});
```

## API

```js
const viewer = new Zoooom('#el', { src: 'img.jpg' });

viewer.zoomIn();           // zoom in by zoomFactor
viewer.zoomOut();          // zoom out
viewer.enhance();          // same as zoomIn(), but funnier
viewer.zoomTo(3);          // set specific scale
viewer.zoomToPoint(2, x, y); // zoom toward a point
viewer.panTo(100, -50);   // set position directly
viewer.panBy(10, 0);      // relative pan
viewer.reset();            // back to scale=1, centered
viewer.center();           // center without changing zoom
viewer.load('new.jpg');    // load a different image
viewer.destroy();          // clean up everything

// Read state
viewer.scale;        // current zoom level
viewer.translateX;   // current X offset
viewer.translateY;   // current Y offset
viewer.isLoaded;     // whether image is ready

// Events
viewer.on('load', () => {});
viewer.on('zoom', (scale) => {});
viewer.on('pan', (x, y) => {});
viewer.on('reset', () => {});
viewer.on('destroy', () => {});
viewer.off('zoom', handler);
```

## Joystick Plugin

For when arrow keys aren't enough and you want that drone-camera-operator feeling:

```js
import Zoooom from 'zoooom';
import { ZoooomJoystick } from 'zoooom/joystick';

const viewer = new Zoooom('#container', { src: 'map.jpg' });
const joystick = new ZoooomJoystick(viewer);
```

The joystick gives you:
- A virtual disc for 8-directional panning (hover or drag)
- Split-circle center for zoom in/out
- Dwell-to-activate (hover 100ms, then move to pan)
- Direction arrows showing which way you're going
- Screen reader ARIA support (announces direction + speed)
- Compass toggle button to show/hide

```js
// Joystick options
new ZoooomJoystick(viewer, {
  radius: 60,          // panning zone radius (px)
  deadzone: 0.1,       // center deadzone (fraction)
  maxSpeed: 10,        // max pan speed (px/frame)
  showToggle: true,    // show the toggle button
  dwellTimeout: 100,   // ms before dwell activates
});

joystick.show();       // show programmatically
joystick.hide();       // hide
joystick.destroy();    // remove from DOM
```

Script tag (full bundle with joystick included):

```html
<script src="https://unpkg.com/zoooom/dist/zoooom-full.iife.global.js"></script>
<script>
  const viewer = new Zoooom('#container', { src: 'photo.jpg' });
  const joystick = new ZoooomJoystick(viewer);
</script>
```

## CSS Customization

Styles are auto-injected. Override with CSS variables:

```css
[data-zoooom] {
  --zoooom-bg: #1a1a1a;
  --zoooom-spinner-color: #ff6b6b;
  --zoooom-spinner-track: rgba(255, 255, 255, 0.2);
  --zoooom-spinner-size: 48px;
  --zoooom-loading-bg: rgba(0, 0, 0, 0.9);
  --zoooom-loading-radius: 12px;
  --zoooom-cursor: crosshair;
  --zoooom-cursor-active: move;
}
```

Or disable auto-injection and bring your own:

```js
new Zoooom('#el', { src: 'img.jpg', injectStyles: false });
```

```html
<link rel="stylesheet" href="node_modules/zoooom/dist/zoooom.css">
```

## Accessibility

- Full keyboard navigation (arrows, +/-, R, Tab)
- `prefers-reduced-motion` respected — no transitions, no momentum, instant show
- ARIA labels on all interactive elements
- Joystick announces direction and speed to screen readers
- Container is focusable and has `role="application"` with usage hints
- Minimum 44px touch targets

## Browser Support

ES2020+: Chrome 80+, Firefox 74+, Safari 14+, Edge 80+.

## The Name

Four o's because three felt restrained and five was too many.

## License

MIT
