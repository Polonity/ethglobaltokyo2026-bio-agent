import { BrowserProvider, Contract, Interface, JsonRpcProvider } from 'ethers';
import { EvmBioAgentSource } from '../../packages/bioagent-framework/src/evm-source.js';
export { EvmBioAgentSource };
export const CHAIN_ID = 11155111;
export const ABI = [
  'function getAgent(uint256) view returns (tuple(address owner,bytes32 modelHash,string metadataURI))',
  'function getStatus(uint256) view returns (tuple(uint8 activity,uint16 energy,uint16 stimulus,uint64 revision,uint64 updatedAt))',
  'function registerAgent(bytes32,string) returns (uint256)',
  'function updateStatus(uint256,uint64,uint8,uint16,uint16)',
  'event BioAgentRegistered(uint256 indexed agentId,address indexed owner,bytes32 indexed modelHash,string metadataURI)',
  'event BioAgentStatusUpdated(uint256 indexed agentId,uint64 indexed revision,address indexed writer,uint8 activity,uint16 energy,uint16 stimulus,uint64 updatedAt)',
];
export function readProvider() {
  return new JsonRpcProvider(new URL('/api/sepolia/rpc', location.href).href, undefined, {
    batchMaxCount: 1,
  });
}
export async function connectWallet(ethereum) {
  if (!ethereum?.request) throw Error('A browser wallet is required / ブラウザーウォレットが必要です');
  await ethereum.request({ method: 'eth_requestAccounts' });
  if (BigInt(await ethereum.request({ method: 'eth_chainId' })) !== BigInt(CHAIN_ID))
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
  const provider = new BrowserProvider(ethereum, 'any');
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}
export async function sendStatus({
  ethereum,
  wallet,
  config,
  agentId,
  status,
  revision,
  registeredOwner,
  onSubmitted,
}) {
  if (BigInt(await ethereum.request({ method: 'eth_chainId' })) !== BigInt(CHAIN_ID))
    throw Error('Switch to Ethereum Sepolia');
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  if (
    accounts[0]?.toLowerCase() !== wallet.address.toLowerCase() ||
    registeredOwner.toLowerCase() !== wallet.address.toLowerCase()
  )
    throw Error('Only this agent’s owner can update its input');
  const registry = new Contract(config.registryAddress, ABI, wallet.signer);
  const tx = await registry.updateStatus(agentId, revision, status.activity, status.energy, status.stimulus);
  onSubmitted?.(tx.hash);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw Error('Input transaction reverted');
  return receipt;
}
export async function registerAgent({ ethereum, wallet, config, onSubmitted }) {
  if (BigInt(await ethereum.request({ method: 'eth_chainId' })) !== BigInt(CHAIN_ID))
    throw Error('Switch to Ethereum Sepolia');
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  if (accounts[0]?.toLowerCase() !== wallet.address.toLowerCase())
    throw Error('Wallet account changed; reconnect');
  const registry = new Contract(config.registryAddress, ABI, wallet.signer);
  const tx = await registry.registerAgent(config.modelHash, new URL('/model.json', location.href).href);
  onSubmitted?.(tx.hash);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw Error('Registration reverted');
  const parsed = receipt.logs
    .map((log) => {
      try {
        return new Interface(ABI).parseLog(log);
      } catch {
        return null;
      }
    })
    .find((log) => log?.name === 'BioAgentRegistered');
  if (!parsed) throw Error('Registration event missing');
  return { agentId: parsed.args.agentId.toString(), receipt };
}
