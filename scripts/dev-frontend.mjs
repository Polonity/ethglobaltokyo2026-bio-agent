import { spawnSync } from 'node:child_process';
const result = spawnSync('node_modules/.bin/wrangler', ['dev', ...process.argv.slice(2)], {
  env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' },
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
