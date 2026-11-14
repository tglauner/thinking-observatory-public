import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { readBuildOutput } from '@cloudflare/build-output-utils';
import { PUBLIC_FILES } from '../scripts/public-assets.mjs';
import { buildSite } from '../scripts/build.mjs';
import { createPublicServer } from '../scripts/serve.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'jane-learning-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, source] of Object.entries(PUBLIC_FILES)) {
    await mkdir(dirname(join(root, source)), { recursive: true });
    await writeFile(join(root, source), name === 'index.html' ? '<!doctype html><title>Learning</title>' : `public fixture: ${name}`);
  }
  return root;
}

async function preview(t, root) {
  const server = createPublicServer(root);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

async function namesBelow(root) {
  const result = [];
  async function walk(path, prefix = '') {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await walk(join(path, entry.name), `${name}/`);
      else result.push(name);
    }
  }
  await walk(root);
  return result.sort();
}

test('build copies exactly the public allowlist', async t => {
  const root = await fixture(t);
  await buildSite(root);
  assert.deepEqual(await namesBelow(join(root, 'dist')), Object.keys(PUBLIC_FILES).sort());
});

test('build ignores private root and public-directory files without reading them', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'confidential'));
  await writeFile(join(root, 'confidential/private.txt'), 'private fixture');
  await writeFile(join(root, '.env'), 'private fixture');
  await writeFile(join(root, 'public/unapproved.txt'), 'unapproved fixture');
  await buildSite(root);
  const files = await namesBelow(join(root, 'dist'));
  assert.ok(!files.some(name => /confidential|env|unapproved/.test(name)));
});

test('build rejects an allowlisted source symlink', async t => {
  const root = await fixture(t);
  await rm(join(root, 'app.js'));
  await symlink('index.html', join(root, 'app.js'));
  await assert.rejects(buildSite(root), /Refusing symlink/);
});

test('build rejects a symlinked public parent directory', async t => {
  const root = await fixture(t);
  await rm(join(root, 'public'), { recursive: true });
  await symlink('src', join(root, 'public'));
  await assert.rejects(buildSite(root), /Refusing symlink/);
});

test('build rejects a symlinked dist destination before modifying it', async t => {
  const root = await fixture(t);
  await symlink('public', join(root, 'dist'));
  await assert.rejects(buildSite(root), /Refusing symlink/);
  assert.match(await readFile(join(root, 'public/mark.svg'), 'utf8'), /public fixture/);
});

test('build rejects a symlinked metadata destination', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'output'));
  await symlink('../index.html', join(root, 'output/build-manifest.json'));
  await assert.rejects(buildSite(root), /Refusing symlink/);
  assert.match(await readFile(join(root, 'index.html'), 'utf8'), /Learning/);
});

test('build validates all sources before replacing the previous artifact', async t => {
  const root = await fixture(t);
  await buildSite(root);
  await writeFile(join(root, 'dist/prior-release.txt'), 'keep on failed build');
  await rm(join(root, 'src/models.js'));
  await assert.rejects(buildSite(root), /ENOENT/);
  assert.equal(await readFile(join(root, 'dist/prior-release.txt'), 'utf8'), 'keep on failed build');
});

test('rebuild removes stale output while producing stable hashes', async t => {
  const root = await fixture(t);
  const first = await buildSite(root);
  await writeFile(join(root, 'dist/stale.txt'), 'stale');
  const second = await buildSite(root);
  assert.deepEqual(second, first);
  assert.ok(!(await namesBelow(join(root, 'dist'))).includes('stale.txt'));
  const index = second.files.find(file => file.path === 'index.html');
  assert.equal(index.sha256, createHash('sha256').update(await readFile(join(root, 'index.html'))).digest('hex'));
});

test('assets-only Build Output is accepted by the pinned Cloudflare schema', async t => {
  const root = await fixture(t);
  await buildSite(root);
  const output = await readBuildOutput(root);
  assert.equal(output.version, 'v0');
  assert.equal(output.workers.default.config.name, 'jane-street-learning');
  assert.equal(output.workers.default.config.assets.htmlHandling, 'auto-trailing-slash');
  assert.equal(output.workers.default.config.assets.notFoundHandling, 'none');
  assert.equal(output.workers.default.bundleDir, undefined);
  assert.equal(output.workers.default.config.manifest, undefined);
  assert.equal(output.rootConfig.accountId, undefined);
  assert.equal(output.containers.length, 0);
  assert.deepEqual(await namesBelow(output.workers.default.assetsDir), Object.keys(PUBLIC_FILES).sort());
});

test('preview serves HTML and browser modules with correct MIME and no caching', async t => {
  const root = await fixture(t);
  const url = await preview(t, root);
  const html = await fetch(url);
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-type'), /text\/html/);
  assert.equal(html.headers.get('cache-control'), 'no-store');
  const module = await fetch(`${url}/src/engine.js`);
  assert.equal(module.status, 200);
  assert.match(module.headers.get('content-type'), /text\/javascript/);
  assert.equal(module.headers.get('x-content-type-options'), 'nosniff');
});

test('preview maps the public favicon without exposing its directory', async t => {
  const root = await fixture(t);
  const url = await preview(t, root);
  const icon = await fetch(`${url}/mark.svg`);
  assert.equal(icon.status, 200);
  assert.equal(icon.headers.get('content-type'), 'image/svg+xml');
  assert.equal((await fetch(`${url}/public/mark.svg`)).status, 404);
});

test('preview refuses private files, operational docs and unlisted modules', async t => {
  const root = await fixture(t);
  const url = await preview(t, root);
  for (const path of ['/.env', '/confidential/private.txt', '/AGENTS.md', '/package.json', '/scripts/build.mjs', '/src/other.js', '/status/status_slides.pdf']) {
    assert.equal((await fetch(`${url}${path}`)).status, 404, path);
  }
});

test('preview rejects encoded traversal and malformed escape sequences', async t => {
  const root = await fixture(t);
  const url = await preview(t, root);
  assert.equal((await fetch(`${url}/src%2F..%2F.env`)).status, 404);
  assert.equal((await fetch(`${url}/%ZZ`)).status, 400);
});

test('preview supports HEAD and refuses mutating methods', async t => {
  const root = await fixture(t);
  const url = await preview(t, root);
  const head = await fetch(url, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.ok(Number(head.headers.get('content-length')) > 0);
  const post = await fetch(url, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('preview refuses a changed allowlisted asset that becomes a symlink', async t => {
  const root = await fixture(t);
  const url = await preview(t, root);
  await rm(join(root, 'styles.css'));
  await symlink('index.html', join(root, 'styles.css'));
  const response = await fetch(`${url}/styles.css`);
  assert.equal(response.status, 500);
  assert.equal(await response.text(), 'Public asset unavailable.');
});

test('public response headers prevent HTML injection and restrict external scripts', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.match(headers, /Cache-Control: public, max-age=0, must-revalidate, no-transform/);
  assert.match(headers, /Content-Security-Policy: .*script-src 'self'/);
});
