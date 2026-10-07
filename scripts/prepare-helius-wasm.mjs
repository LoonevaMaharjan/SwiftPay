import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const packageDist = join(process.cwd(), 'node_modules', '@lightprotocol', 'hasher.rs', 'dist');
const moduleDir = join(packageDist, 'browser-fat', 'es');

for (const filename of ['light_wasm_hasher_bg.wasm', 'hasher_wasm_simd_bg.wasm']) {
  const source = join(packageDist, filename);
  const destination = join(moduleDir, filename);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
