import { readFile } from 'node:fs/promises';
import { keccak256 } from 'ethers';
export const OFFICIAL_AQUA = '0x1111113ccf1426a8e30e2bff5e005d929bf6a90a';
export async function verifyAquaFork(provider, manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const info = await provider.send('anvil_nodeInfo', []);
  if (!info.forkConfig?.forkUrl || Number(info.forkConfig.forkBlockNumber) !== manifest.blockNumber)
    throw Error('Official Aqua mode requires the recorded local fork');
  if (manifest.chainId !== 1 || manifest.aqua !== OFFICIAL_AQUA)
    throw Error('Unrecognized official deployment');
  const block = await provider.getBlock(manifest.blockNumber);
  const code = await provider.getCode(OFFICIAL_AQUA);
  if (block?.hash !== manifest.blockHash || code === '0x' || keccak256(code) !== manifest.codeHash)
    throw Error('Fork block or official Aqua bytecode does not match upstream evidence');
  return manifest;
}
