import { defineConfig } from 'cf/config';
import { WORKER_CONFIG, WORKER_DOMAINS } from './scripts/public-assets.mjs';

// Static assets only. npm run build writes the prebuilt deployment artifact.
export default defineConfig({ worker: { ...WORKER_CONFIG, domains: [...WORKER_DOMAINS] } });
