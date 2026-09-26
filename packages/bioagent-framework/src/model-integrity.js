import { MALE_CNS } from '../../bio_agent/connectome/male-cns.js';
let verified;
export async function verifyMaleCNSBytes(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const actual = '0x' + [...new Uint8Array(hash)].map((x) => x.toString(16).padStart(2, '0')).join('');
  if (actual !== MALE_CNS.graphSha256) throw Error('Connectome artifact digest mismatch');
  return actual;
}
export async function verifyMaleCNSArtifact(expectedModel = MALE_CNS.graphSha256) {
  if (expectedModel !== MALE_CNS.graphSha256) throw Error('Unsupported connectome model');
  verified ??= (async () => {
    const url = new URL('../../bio_agent/connectome/male-cns-slice.json', import.meta.url);
    if (url.protocol === 'file:') {
      const { readFile } = await import('node:fs/promises');
      return verifyMaleCNSBytes(await readFile(url));
    }
    const response = await fetch(url);
    if (!response.ok) throw Error('Connectome artifact unavailable');
    return verifyMaleCNSBytes(await response.arrayBuffer());
  })();
  try {
    return await verified;
  } catch (error) {
    verified = undefined;
    throw error;
  }
}
