import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const packageDist = join(process.cwd(), 'node_modules', '@lightprotocol', 'hasher.rs', 'dist');
const moduleDir = join(packageDist, 'browser-fat', 'es');

const publicDir = join(process.cwd(), 'public');
await mkdir(publicDir, { recursive: true });

for (const filename of ['light_wasm_hasher_bg.wasm', 'hasher_wasm_simd_bg.wasm']) {
  const source = join(packageDist, filename);
  const destination = join(moduleDir, filename);
  const publicDest = join(publicDir, filename);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  await copyFile(source, publicDest);
}
