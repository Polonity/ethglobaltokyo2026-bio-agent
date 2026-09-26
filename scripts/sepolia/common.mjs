import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { Wallet, JsonRpcProvider } from 'ethers';
export const CHAIN_ID = 11155111;
export const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
export const local = path.resolve('.local/sepolia');
export const deploymentPath = path.resolve('contracts/deployments/sepolia.json');
export const sha256 = (data) => '0x' + createHash('sha256').update(data).digest('hex');
export async function provider() {
  const p = new JsonRpcProvider(RPC_URL, undefined, { batchMaxCount: 1 });
  p.pollingInterval = 3000;
  const chain = BigInt(await p.send('eth_chainId', []));
  if (chain !== BigInt(CHAIN_ID)) {
    p.destroy();
    throw Error('Ethereum Sepolia RPC required');
  }
  return p;
}
export async function loadWallet() {
  const [encrypted, password] = await Promise.all([
    fs.readFile(path.join(local, 'keystore.json'), 'utf8'),
    fs.readFile(path.join(local, 'passphrase'), 'utf8'),
  ]);
  return Wallet.fromEncryptedJson(encrypted, password);
}
export async function ensureWallet() {
  await fs.mkdir(local, { recursive: true, mode: 0o700 });
  try {
    return await loadWallet();
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  // Never overwrite a partial setup. Keep all testnet signing material out of Git and stdout.
  for (const file of ['keystore.json', 'passphrase']) {
    try {
      await fs.access(path.join(local, file));
      throw Error('Partial Sepolia wallet setup; recover before continuing');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  const wallet = Wallet.createRandom(),
    password = randomBytes(32).toString('base64url');
  const encrypted = await wallet.encrypt(password);
  await fs.writeFile(path.join(local, 'passphrase'), password, { mode: 0o600, flag: 'wx' });
  await fs.writeFile(path.join(local, 'keystore.json'), encrypted, { mode: 0o600, flag: 'wx' });
  await fs.writeFile(
    path.join(local, 'public.json'),
    JSON.stringify(
      {
        chainId: CHAIN_ID,
        address: wallet.address,
        purpose: 'BioAgent Sepolia test deployment and smoke tests',
      },
      null,
      2,
    ) + '\n',
    { mode: 0o600, flag: 'wx' },
  );
  return wallet;
}
export async function artifact() {
  return JSON.parse(await fs.readFile('contracts/out/BioAgentRegistry.sol/BioAgentRegistry.json', 'utf8'));
}
export async function json(pathname, value) {
  await fs.mkdir(path.dirname(pathname), { recursive: true });
  await fs.writeFile(
    pathname,
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n',
  );
}
