# zoooom

<div align="center">

![enhance](https://media.tenor.com/atZ7_JeUlugAAAAM/enhance-supertroopers.gif)

</div>

Zero-dependency pan/zoom image viewer. 25KB.

I built this because I wanted to host high-resolution images without compression destroying them, and couldn't find a viewer that zoomed toward the cursor instead of the center.

**[Interactive demo](https://dr.eamer.dev/downloads/zoooom/)** · **[Gallery (165 images)](https://dr.eamer.dev/viewer/)**

```bash
npm install zoooom
```

```js
import Zoooom from 'zoooom';
new Zoooom('#container', { src: 'image.jpg' });
```

---

## What Makes This Different

Most image zoom libraries are either:
1. jQuery plugins from 2014 that zoom to center (not cursor position)
2. React/Vue wrappers that bring 200KB of framework along
3. Overkill map engines that want tile servers

`zoooom` is none of those. It's the interaction engine extracted from an accessibility-first image viewer I built to display 165 high-resolution infographics. Battle-tested with mouse, touch, trackpad, keyboard, and even joystick input across Chrome, Firefox, Safari, and mobile.

**Zero dependencies. ~25KB core (before gzip). Works with any image.**

The zoom-toward-cursor math is correct (not the naive "scale from center" that most libs do). Trackpad detection distinguishes precision scrolling from mouse wheel clicks. Safari gesture events are handled. Pinch-to-zoom tracks the actual pinch center, not the image center.

---

## Input

| Method | Action |
|--------|--------|
| Mouse drag | Pan |
| Scroll wheel | Zoom toward cursor (discrete steps) |
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
```

## Script Tag

```html
<div id="v" style="width:100%;height:100vh"></div>
<script src="https://unpkg.com/zoooom/dist/zoooom.iife.global.js"></script>
<script>new Zoooom('#v', { src: 'photo.jpg' });</script>
```

## License

MIT
