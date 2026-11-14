# Deployment

The production custom domain is `thinkingobservatory.com`; `www` is not configured. Cloudflare provisions the custom-domain DNS record and TLS certificate for the active zone. The static release is restricted to the explicit allowlist in `scripts/public-assets.mjs`.

## Validate and deploy

```bash
npm run check
CF_SEND_TELEMETRY=false npx cf deploy dist --dry-run
npm run deploy
```

The deploy command runs the checks and build before uploading `dist/`. Authenticate with `npx cf auth login` when needed. Keep Cloudflare credentials in the CLI's local authentication store; do not put them in this repository or static assets.

This configuration targets the project owner's live domain. A fork must change the Worker name and domain in `cloudflare.config.ts` and `scripts/public-assets.mjs` before deployment.

## Rollback

Use Cloudflare's Worker deployment history to restore the prior known-good version. To revert a source release, revert the corresponding change and redeploy:

```bash
git revert <release-commit>
npm run deploy
```

After rollback, verify the homepage, response headers, public assets and private-path 404s.
