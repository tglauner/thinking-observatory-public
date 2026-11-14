import { lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

export const PUBLIC_FILES = Object.freeze({
  'index.html': 'index.html',
  'styles.css': 'styles.css',
  'app.js': 'app.js',
  'src/curriculum.js': 'src/curriculum.js',
  'src/engine.js': 'src/engine.js',
  'src/models.js': 'src/models.js',
  'mark.svg': 'public/mark.svg',
  '_headers': 'public/_headers',
  'robots.txt': 'public/robots.txt',
  'licenses/jane-street-socratic-tutor.txt': 'public/licenses/jane-street-socratic-tutor.txt',
});

export const WORKER_CONFIG = Object.freeze({
  name: 'jane-street-learning',
  compatibilityDate: '2026-11-12',
  assets: { htmlHandling: 'auto-trailing-slash', notFoundHandling: 'none' },
});

export const WORKER_DOMAINS = Object.freeze(['thinkingobservatory.com']);

export async function assertNoSymlink(root, relativePath, { allowMissing = false } = {}) {
  let current = resolve(root);
  const parts = relativePath.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error('Invalid public path.');
  for (const part of parts) {
    current = join(current, part);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${relativePath}`);
    } catch (error) {
      if (allowMissing && error.code === 'ENOENT') return;
      throw error;
    }
  }
}

export async function publicSource(root, publicPath) {
  const source = PUBLIC_FILES[publicPath];
  if (!Object.hasOwn(PUBLIC_FILES, publicPath)) return null;
  await assertNoSymlink(root, source);
  const fullPath = resolve(root, source);
  const entry = await lstat(fullPath);
  if (!entry.isFile()) throw new Error(`Public asset is not a regular file: ${source}`);
  return fullPath;
}
