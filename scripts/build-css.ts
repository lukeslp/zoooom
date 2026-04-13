/**
 * Extract CSS template literals from style modules to standalone .css files.
 * Run as part of the build: tsx scripts/build-css.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

async function main() {
  mkdirSync(distDir, { recursive: true });

  const { ZOOOOM_CSS } = await import('../src/styles/core.js');
  const { JOYSTICK_CSS } = await import('../src/styles/joystick.js');

  writeFileSync(join(distDir, 'zoooom.css'), ZOOOOM_CSS.trim() + '\n');
  writeFileSync(join(distDir, 'zoooom-joystick.css'), JOYSTICK_CSS.trim() + '\n');

  console.log('wrote dist/zoooom.css');
  console.log('wrote dist/zoooom-joystick.css');
}

main();
