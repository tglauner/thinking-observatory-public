import { readFile, writeFile, mkdir, rm, rename } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { PUBLIC_FILES, WORKER_CONFIG, assertNoSymlink, publicSource } from './public-assets.mjs';

export async function buildSite(root = process.cwd()) {
  root = resolve(root);
  const assets = [];
  for (const name of Object.keys(PUBLIC_FILES).sort()) {
    const source = await publicSource(root, name);
    const content = await readFile(source);
    if (content.length > 25 * 1024 * 1024) throw new Error(`Public asset exceeds 25 MiB: ${name}`);
    assets.push({ name, content, size: content.length, sha256: createHash('sha256').update(content).digest('hex') });
  }
  for (const target of ['dist', '.cloudflare/output', 'output/build-manifest.json']) {
    await assertNoSymlink(root, target, { allowMissing: true });
  }
  const manifest = {
    version: 1,
    worker: WORKER_CONFIG.name,
    files: assets.map(({ name, size, sha256 }) => ({ path: name, size, sha256 })),
  };
  manifest.buildId = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  const staging = join(root, `.dist-build-${process.pid}-${randomUUID()}`);
  await mkdir(staging);
  try {
    for (const asset of assets) {
      const target = join(staging, asset.name);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, asset.content);
    }
    await rm(join(root, 'dist'), { recursive: true, force: true });
    await rename(staging, join(root, 'dist'));
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  // Assets-only Build Output v0, verified against pinned cf beta.31's schemas.
  // There is deliberately no bundle, server entrypoint, account ID or binding.
  const cloudOutput = join(root, '.cloudflare/output/v0');
  await rm(join(root, '.cloudflare/output'), { recursive: true, force: true });
  const workerDir = join(cloudOutput, 'workers/default');
  await mkdir(join(workerDir, 'assets'), { recursive: true });
  await writeFile(join(cloudOutput, 'config.json'), JSON.stringify({ buildContext: { isPreview: false } }, null, 2) + '\n');
  await writeFile(join(workerDir, 'worker.config.json'), JSON.stringify(WORKER_CONFIG, null, 2) + '\n');
  for (const asset of assets) {
    const target = join(workerDir, 'assets', asset.name);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, asset.content);
  }
  await mkdir(join(root, 'output'), { recursive: true });
  await writeFile(join(root, 'output/build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const manifest = await buildSite();
    console.log(`[build ${manifest.buildId.slice(0, 12)}] ${manifest.files.length} public assets assembled in dist/ and .cloudflare/output/v0/`);
  } catch (error) {
    console.error(`[build failed] ${error.message}`);
    process.exitCode = 1;
  }
}
