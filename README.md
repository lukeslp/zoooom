# zoooom

<div align="center">

![enhance](https://media.tenor.com/atZ7_JeUlugAAAAM/enhance-supertroopers.gif)

</div>

Zero-dependency pan/zoom image viewer. 25KB.

I built this because I wanted to host high-resolution images without compression destroying them, and couldn't find a viewer that zoomed toward the cursor instead of the center.

```bash
npm install zoooom
```

```js
import Zoooom from 'zoooom';
new Zoooom('#container', { src: 'image.jpg' });
```

---

## What's different

- Zoom targets the cursor, not the image center
- Trackpad vs mouse wheel detection (continuous vs discrete zoom)
- Pinch center tracking updates each frame
- Max zoom auto-calculated from the image's native resolution
- Momentum on pan release
- No framework, no build step required

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

viewer.scale        // current zoom
viewer.translateX   // current X
viewer.translateY   // current Y
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
- Joystick announces direction + speed to screen readers

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

/* Or: injectStyles: false + your own stylesheet */
```

## Script Tag

```html
<div id="v" style="width:100%;height:100vh"></div>
<script src="https://unpkg.com/zoooom/dist/zoooom.iife.global.js"></script>
<script>new Zoooom('#v', { src: 'photo.jpg' });</script>
```

## License

MIT
