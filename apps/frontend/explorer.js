// Only known chain IDs can produce public explorer links. Never send Anvil hashes there.
export function transactionLink(chainId, hash) {
  if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) return null;
  const explorers = { 1: 'https://etherscan.io', 11155111: 'https://sepolia.etherscan.io' };
  const base = explorers[String(chainId)];
  if (base) return { href: `${base}/tx/${hash}`, label: 'Etherscanで取引を見る ↗', local: false };
  if (String(chainId) === '31337')
    return { href: `/api/chain/receipt?hash=${hash}`, label: 'Anvilの取引詳細を見る ↗', local: true };
  return null;
}
