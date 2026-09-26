# Cloudflare Workers public demo

The public endpoint is [Sepolia Fly Lab](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en), serving the same UI as Anvil. See [inputs, signers, gas budget, and deployment record](sepolia.md).

```sh
npm run sepolia:build
node scripts/cloudflare.mjs deploy --config wrangler.sepolia.jsonc --dry-run
npm run deploy                 # alias of sepolia:publish
npm run test:sepolia:public     # read-only public-page verification
```

`wrangler.sepolia.jsonc` configures `services/sepolia/worker.js`. Static Assets serves the shared UI; Cron and a Durable Object send budget-limited stimulus transactions. Decisions and learning run in the browser.

Deployment commands read only Cloudflare credentials from the root `.env`. Signing keys are separate Cloudflare Secrets and are never served as browser assets.

Use `npm run dev` or `npm run local:up` locally; see [ports and setup](local-anvil.md).

The old standalone 12-agent browser mode's launch, test, and deployment configuration was removed. That change did not delete any previously deployed Worker. Use the Sepolia URL above for judging.
