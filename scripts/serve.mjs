import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { PUBLIC_FILES, publicSource } from './public-assets.mjs';

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };

export function createPublicServer(root = process.cwd()) {
  root = resolve(root);
  return createServer(async (request, response) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
    const reply = (status, body) => { response.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }); response.end(request.method === 'HEAD' ? undefined : body); };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      reply(405, 'Method not allowed.');
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
    catch { reply(400, 'Malformed request path.'); return; }
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!Object.hasOwn(PUBLIC_FILES, name)) { reply(404, 'Public asset not found.'); return; }
    try {
      const source = await publicSource(root, name);
      const content = await readFile(source);
      response.writeHead(200, { ...headers, 'Content-Type': MIME[extname(name)] || 'text/plain; charset=utf-8', 'Content-Length': content.length });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error(`[preview] Cannot serve ${name}: ${error.message}`);
      reply(error.code === 'ENOENT' ? 404 : 500, 'Public asset unavailable.');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPublicServer();
  server.on('error', error => {
    console.error(`[preview failed] ${error.code === 'EADDRINUSE' ? 'Port 5173 is already in use. Stop the previous preview process and retry.' : error.message}`);
    process.exitCode = 1;
  });
  server.listen(5173, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:5173/';
    console.log(`[preview] ${url} — serving public assets only. Press Control-C to stop.`);
    if (process.argv.includes('--open')) {
      const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
      const browser = spawn(command, [url], { stdio: 'ignore' });
      browser.on('error', () => console.log(`[preview] Open ${url} in your browser.`));
    }
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
