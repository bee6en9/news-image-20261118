// main.ts — copies the pre-rendered entry.png into the output directory.
// Node 22 stdlib only. Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir: string = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const here: string = dirname(fileURLToPath(import.meta.url));
mkdirSync(outDir, { recursive: true });
copyFileSync(join(here, 'entry.png'), join(outDir, 'entry.png'));
console.log('wrote ' + join(outDir, 'entry.png'));
