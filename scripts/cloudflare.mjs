// Pass only Cloudflare deployment credentials from the root .env to Wrangler.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
const values = parseEnv(readFileSync('.env', 'utf8'));
const env = { ...process.env };
for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
  if (values[key]) env[key] = values[key];
  if (!env[key]) throw new Error(`Missing ${key}`);
}
// Disable automatic .env loading: unrelated R2 credentials must not become Worker vars.
env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = 'false';
const args = process.argv.slice(2);
if (!args.length) throw new Error('Specify a Wrangler command');
const result = spawnSync('node_modules/.bin/wrangler', args, { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
