# Thinking Observatory

Public source for [thinkingobservatory.com](https://thinkingobservatory.com), an independent, interactive study room for quantitative reasoning. It offers original exercises, mathematical exhibits, a diagnostic, spaced review and a mixed assessment. Progress stays in the learner's browser; the site has no backend or conversational tutor.

The teaching approach adapts [Jane Street's Socratic Tutor skill](https://github.com/janestreet/agent_skills/blob/master/socratic-tutor/SKILL.md) under its [MIT license](https://github.com/janestreet/agent_skills/blob/master/LICENSE.md). The site is an independent adaptation, not endorsed by Jane Street. The notice at `public/licenses/jane-street-socratic-tutor.txt` applies to that skill material, not to the website's original code or curriculum.

## Run locally

Use Node.js 22.23 or newer in the 22.x series, then run:

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173/>. No API key, database or environment file is needed.

## Test and build

```bash
npm run check
```

This runs the tests and assembles the static public allowlist in `dist/`.

## Cloudflare deployment

The production configuration targets the `thinkingobservatory.com` Worker custom domain. Deployment is for the project owner:

```bash
npx cf auth login
npm run deploy
```

Do not run the deploy command from a fork without first changing `cloudflare.config.ts` and `scripts/public-assets.mjs` to your own Worker and domain. See [the deployment notes](docs/DEPLOYMENT.md).

## Licensing

No license for the website's original code or exercises is granted by this repository. The upstream MIT notice applies only to the adapted Socratic Tutor skill material identified above.
