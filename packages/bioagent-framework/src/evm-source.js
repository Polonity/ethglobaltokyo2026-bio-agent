import { Contract, getAddress } from 'ethers';
const ABI = [
  'function getAgent(uint256) view returns (tuple(address owner,bytes32 modelHash,string metadataURI))',
  'function getStatus(uint256) view returns (tuple(uint8 activity,uint16 energy,uint16 stimulus,uint64 revision,uint64 updatedAt))',
];
// Read-only RPC adapter. A trusted RPC observation is not an independent state proof.
export class EvmBioAgentSource {
  constructor(provider, { chainId, registry, agentId, confirmations = 2 }) {
    if (
      !Number.isSafeInteger(chainId) ||
      chainId < 1 ||
      !/^[1-9]\d*$/.test(String(agentId)) ||
      !Number.isSafeInteger(confirmations) ||
      confirmations < 0
    )
      throw Error('Invalid chain source');
    this.provider = provider;
    this.chainId = chainId;
    this.registry = getAddress(registry);
    this.agentId = String(agentId);
    this.confirmations = confirmations;
    this.contract = new Contract(this.registry, ABI, provider);
  }
  async read() {
    const actualChain = BigInt(await this.provider.send('eth_chainId', []));
    if (actualChain !== BigInt(this.chainId)) throw Error('Wrong RPC chain');
    const head = Number(BigInt(await this.provider.send('eth_blockNumber', [])));
    const blockNumber = head - this.confirmations;
    if (blockNumber < 0) throw Error('Insufficient confirmation depth');
    const tag = '0x' + blockNumber.toString(16);
    const block = await this.provider.send('eth_getBlockByNumber', [tag, false]);
    if (!block?.hash) throw Error('Missing source block');
    const [definition, state] = await Promise.all([
      this.contract.getAgent(this.agentId, { blockTag: tag }),
      this.contract.getStatus(this.agentId, { blockTag: tag }),
    ]);
    const canonical = await this.provider.send('eth_getBlockByNumber', [tag, false]);
    if (canonical?.hash !== block.hash) throw Error('Source block changed during read');
    return {
      source: 'evm-rpc-state',
      chainId: this.chainId,
      registry: this.registry.toLowerCase(),
      agentId: this.agentId,
      owner: definition.owner.toLowerCase(),
      model: definition.modelHash.toLowerCase(),
      block: {
        number: blockNumber,
        hash: block.hash,
        timestamp: Number(BigInt(block.timestamp)),
        confirmations: this.confirmations,
      },
      status: {
        activity: Number(state.activity),
        energy: Number(state.energy),
        stimulus: Number(state.stimulus),
        revision: state.revision.toString(),
        updatedAt: Number(state.updatedAt),
      },
    };
  }
}
