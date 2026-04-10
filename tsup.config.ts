import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      joystick: 'src/joystick/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
  },
  {
    entry: { 'zoooom.iife': 'src/index.ts' },
    format: ['iife'],
    globalName: 'Zoooom',
    dts: false,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
  },
  {
    entry: { 'zoooom-full.iife': 'src/full.ts' },
    format: ['iife'],
    globalName: 'Zoooom',
    dts: false,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
  },
]);
