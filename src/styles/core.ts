export const ZOOOOM_CSS = `
[data-zoooom] {
  --zoooom-bg: #000;
  --zoooom-spinner-color: #2196f3;
  --zoooom-spinner-track: rgba(255, 255, 255, 0.3);
  --zoooom-spinner-size: 40px;
  --zoooom-loading-bg: rgba(0, 0, 0, 0.85);
  --zoooom-loading-radius: 10px;
  --zoooom-cursor: grab;
  --zoooom-cursor-active: grabbing;
  --zoooom-transition-speed: 0.2s;
  --zoooom-fade-speed: 0.3s;

  position: relative;
  width: 100%;
  height: 100%;
  background: var(--zoooom-bg);
  overflow: hidden;
  touch-action: none;
  cursor: var(--zoooom-cursor);
  user-select: none;
  -webkit-user-select: none;
}

[data-zoooom]:focus-visible {
  outline: 2px solid var(--zoooom-spinner-color);
  outline-offset: -2px;
}

[data-zoooom] .zoooom-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1);
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}

[data-zoooom] .zoooom-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--zoooom-loading-bg);
  padding: 20px;
  border-radius: var(--zoooom-loading-radius);
  z-index: 10;
  min-width: 120px;
}

[data-zoooom] .zoooom-spinner {
  width: var(--zoooom-spinner-size);
  height: var(--zoooom-spinner-size);
  border: 4px solid var(--zoooom-spinner-track);
  border-radius: 50%;
  border-top-color: var(--zoooom-spinner-color);
  animation: zoooom-spin 1s linear infinite;
}

[data-zoooom] .zoooom-loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

@keyframes zoooom-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  [data-zoooom] .zoooom-spinner {
    animation: none;
    border-top-color: var(--zoooom-spinner-track);
    border-right-color: var(--zoooom-spinner-color);
  }

  [data-zoooom] .zoooom-image {
    transition: none !important;
  }
}
`;

let injected = false;

export function injectCoreStyles(): void {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-zoooom-core', '');
  style.textContent = ZOOOOM_CSS;
  document.head.appendChild(style);
  injected = true;
}
