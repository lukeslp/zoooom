import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Zoooom } from '../core/Zoooom.js';

// jsdom doesn't implement matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Zoooom class', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 800, height: 600,
      top: 0, left: 0, bottom: 600, right: 800,
      x: 0, y: 0, toJSON: () => {},
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('creates an image element inside the container', () => {
    const viewer = new Zoooom(container, { src: '' });
    expect(container.querySelector('img.zoooom-image')).toBeTruthy();
    viewer.destroy();
  });

  it('sets data-zoooom attribute on container', () => {
    const viewer = new Zoooom(container, { src: '' });
    expect(container.hasAttribute('data-zoooom')).toBe(true);
    viewer.destroy();
  });

  it('sets ARIA attributes on container', () => {
    const viewer = new Zoooom(container, { src: '' });
    expect(container.getAttribute('role')).toBe('application');
    expect(container.getAttribute('tabindex')).toBe('0');
    expect(container.getAttribute('aria-label')).toContain('arrow keys');
    viewer.destroy();
  });

  it('throws for missing container', () => {
    expect(() => new Zoooom('#nonexistent', { src: '' })).toThrow('not found');
  });

  it('accepts a CSS selector string', () => {
    container.id = 'test-zoooom';
    const viewer = new Zoooom('#test-zoooom', { src: '' });
    expect(container.hasAttribute('data-zoooom')).toBe(true);
    viewer.destroy();
  });

  describe('state', () => {
    it('starts at scale 1', () => {
      const viewer = new Zoooom(container, { src: '' });
      expect(viewer.scale).toBe(1);
      expect(viewer.translateX).toBe(0);
      expect(viewer.translateY).toBe(0);
      viewer.destroy();
    });
  });

  describe('methods', () => {
    it('reset() returns to scale 1, centered', () => {
      const viewer = new Zoooom(container, { src: '' });
      // Manually change state via panTo
      viewer.panTo(100, -50);
      expect(viewer.translateX).toBe(100);
      viewer.reset();
      expect(viewer.scale).toBe(1);
      expect(viewer.translateX).toBe(0);
      expect(viewer.translateY).toBe(0);
      viewer.destroy();
    });

    it('panTo() sets translate', () => {
      const viewer = new Zoooom(container, { src: '' });
      viewer.panTo(200, -100);
      expect(viewer.translateX).toBe(200);
      expect(viewer.translateY).toBe(-100);
      viewer.destroy();
    });

    it('panBy() adds to translate', () => {
      const viewer = new Zoooom(container, { src: '' });
      viewer.panTo(100, 100);
      viewer.panBy(50, -30);
      expect(viewer.translateX).toBe(150);
      expect(viewer.translateY).toBe(70);
      viewer.destroy();
    });

    it('enhance() is an alias for zoomIn()', () => {
      const viewer = new Zoooom(container, { src: '', maxScale: 20 });
      const scaleBefore = viewer.scale;
      viewer.enhance();
      expect(viewer.scale).toBeGreaterThan(scaleBefore);
      viewer.destroy();
    });
  });

  describe('events', () => {
    it('emits pan event on panTo', () => {
      const viewer = new Zoooom(container, { src: '' });
      const handler = vi.fn();
      viewer.on('pan', handler);
      viewer.panTo(10, 20);
      expect(handler).toHaveBeenCalledWith(10, 20);
      viewer.destroy();
    });

    it('emits reset event', () => {
      const viewer = new Zoooom(container, { src: '' });
      const handler = vi.fn();
      viewer.on('reset', handler);
      viewer.reset();
      expect(handler).toHaveBeenCalled();
      viewer.destroy();
    });

    it('off() removes handler', () => {
      const viewer = new Zoooom(container, { src: '' });
      const handler = vi.fn();
      viewer.on('pan', handler);
      viewer.off('pan', handler);
      viewer.panTo(10, 20);
      expect(handler).not.toHaveBeenCalled();
      viewer.destroy();
    });
  });

  describe('destroy', () => {
    it('removes image element from container', () => {
      const viewer = new Zoooom(container, { src: '' });
      expect(container.querySelector('img')).toBeTruthy();
      viewer.destroy();
      expect(container.querySelector('img')).toBeNull();
    });

    it('removes data-zoooom attribute', () => {
      const viewer = new Zoooom(container, { src: '' });
      viewer.destroy();
      expect(container.hasAttribute('data-zoooom')).toBe(false);
    });

    it('removes role and aria-label', () => {
      const viewer = new Zoooom(container, { src: '' });
      viewer.destroy();
      expect(container.hasAttribute('role')).toBe(false);
      expect(container.hasAttribute('aria-label')).toBe(false);
    });
  });
});
