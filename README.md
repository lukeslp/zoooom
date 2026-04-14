# zoooom

<div align="center">

![enhance](https://media.tenor.com/atZ7_JeUlugAAAAM/enhance-supertroopers.gif)

</div>

Zero-dependency pan/zoom image viewer. 25KB.

I got tired of image hosts compressing everything and couldn't find a viewer that zoomed toward the cursor instead of the center. So I built one.

**[Interactive demo](https://dr.eamer.dev/downloads/zoooom/)** · **[Gallery (165 images)](https://dr.eamer.dev/viewer/)**

```bash
npm install zoooom
```

```js
import Zoooom from 'zoooom';
new Zoooom('#container', { src: 'image.jpg' });
```

---

## What's different

Most zoom libraries either scale from center (wrong), require a framework, or are map engines in disguise.

This one zooms toward your cursor. The coordinate math keeps the pixel under your pointer stationary at every scale change. Trackpad scrolling is detected separately from mouse wheel clicks and gets continuous exponential zoom instead of discrete steps. Pinch-to-zoom tracks the actual midpoint between your fingers, updated each frame. Safari gesture events are handled where available.

Images render at native resolution regardless of container size. A calculated base scale fits them visually, so zooming in reveals actual source pixels instead of upscaling a constrained raster. This works in a 500px embed or a full-viewport viewer.

**Zero dependencies. ~25KB. Works with a script tag.**

---

## Input

| Method | Action |
|--------|--------|
| Mouse drag | Pan |
| Scroll wheel | Zoom toward cursor |
| Trackpad | Continuous zoom toward cursor |
| Ctrl+wheel | Pinch gesture (Windows/Linux) |
| Safari gestures | Native gesture zoom |
| Single touch | Pan |
| Two-finger pinch | Zoom with center tracking |
| Arrow keys | Pan with momentum |
| +/- keys | Zoom |
| R key | Reset |
| Joystick (plugin) | 8-direction pan + zoom |

## API

```js
const viewer = new Zoooom(container, options);

viewer.zoomIn()
viewer.zoomOut()
viewer.enhance()                 // alias: zoomIn
viewer.zoomTo(scale)
viewer.zoomToPoint(scale, x, y)
viewer.panTo(x, y)
viewer.panBy(dx, dy)
viewer.center()
viewer.reset()
viewer.load(src, alt?)
viewer.destroy()

viewer.scale        // current zoom (1 = fitted)
viewer.translateX   // current X offset
viewer.translateY   // current Y offset
viewer.isLoaded

viewer.on('load' | 'error' | 'zoom' | 'pan' | 'reset' | 'destroy', fn)
viewer.off(event, fn)
```

## Options

| Option | Default | |
|--------|---------|---|
| `src` | — | Image URL |
| `alt` | `'Image'` | Alt text |
| `minScale` | `0.8` | Min zoom |
| `maxScale` | `'auto'` | From native dimensions |
| `zoomFactor` | `1.5` | Per-step multiplier |
| `velocityDamping` | `0.85` | Momentum friction |
| `trackpadSensitivity` | `0.002` | Continuous zoom tuning |
| `mouse` | `true` | |
| `touch` | `true` | |
| `wheel` | `true` | |
| `keyboard` | `true` | |
| `loading` | `true` | Loading spinner |
| `injectStyles` | `true` | Auto-inject CSS |
| `respectReducedMotion` | `true` | Honor motion preference |
| `onLoad` | — | |
| `onZoom` | — | |
| `onPan` | — | |

The container must have explicit dimensions (width and height). The library does not set these.

## Joystick Plugin

```js
import { ZoooomJoystick } from 'zoooom/joystick';
new ZoooomJoystick(viewer, { radius: 60, deadzone: 0.1, maxSpeed: 10 });
```

Full bundle: `unpkg.com/zoooom/dist/zoooom-full.iife.global.js`

## Accessibility

- `prefers-reduced-motion` honored (no transitions, no momentum)
- Full keyboard navigation
- ARIA on all controls
- 44px touch targets
- Joystick announces direction and speed to screen readers

## CSS Variables

```css
[data-zoooom] {
  --zoooom-bg: #000;
  --zoooom-spinner-color: #2196f3;
  --zoooom-spinner-track: rgba(255, 255, 255, 0.3);
  --zoooom-spinner-size: 40px;
  --zoooom-loading-bg: rgba(0, 0, 0, 0.85);
  --zoooom-cursor: grab;
  --zoooom-cursor-active: grabbing;
}
```

Disable auto-injection with `injectStyles: false` and use `zoooom/css` for a standalone stylesheet.

## Script Tag

```html
<div id="v" style="width:100%;height:100vh"></div>
<script src="https://unpkg.com/zoooom/dist/zoooom.iife.global.js"></script>
<script>new Zoooom('#v', { src: 'photo.jpg' });</script>
```

## License

MIT
