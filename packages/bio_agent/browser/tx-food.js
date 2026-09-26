// Event-to-environment mapping. Callers must verify receipt/canonical chain provenance first.
const hash = (v) => typeof v === 'string' && /^0x[0-9a-f]{64}$/i.test(v);
export function enableTxFood(world) {
  world.foods = [];
  world.respawnFood = false;
  world.foodMode = 'confirmed-tx';
  world.foodEvents = [];
}
export function addTxFood(world, event, consumed = new Set()) {
  if (world.foodMode !== 'confirmed-tx') throw Error('Confirmed-TX food mode required');
  if (
    !hash(event.transactionHash) ||
    !hash(event.blockHash) ||
    !/^0x[0-9a-f]{40}$/i.test(event.registry) ||
    !Number.isSafeInteger(event.chainId) ||
    event.chainId < 1 ||
    !Number.isSafeInteger(event.blockNumber) ||
    event.blockNumber < 0 ||
    !Number.isSafeInteger(event.logIndex) ||
    event.logIndex < 0 ||
    !/^[1-9]\d*$/.test(String(event.agentId)) ||
    !/^[1-9]\d*$/.test(String(event.revision)) ||
    !Number.isInteger(event.stimulus) ||
    event.stimulus < 0 ||
    event.stimulus > 10000
  )
    throw Error('Invalid confirmed food event');
  if (BigInt(event.revision) === 1n || event.stimulus === 0) return false;
  const id = `${event.chainId}:${event.registry.toLowerCase()}:${event.transactionHash.toLowerCase()}:${event.logIndex}`;
  const previous = world.foodEvents.find((e) => e.id === id);
  if (previous) {
    if (previous.source.blockHash !== event.blockHash) throw Error('Food event reorg; reload required');
    return false;
  }
  // A deterministic visualization coordinate, not a coordinate stored in the contract.
  const n = BigInt(event.transactionHash) + BigInt(event.logIndex);
  let x, y;
  for (let attempt = 0; attempt < 32; attempt++) {
    x = 2 + Number((n + BigInt(attempt * 7919)) % 32000n) / 1000;
    y = 2 + Number(((n >> 32n) + BigInt(attempt * 3571)) % 18000n) / 1000;
    if (!world.hazards.some((h) => Math.hypot(x - h.x, y - h.y) < h.radius + 1.5)) break;
  }
  const record = { id, source: structuredClone(event), x, y, consumed: consumed.has(id) };
  world.foodEvents.push(record);
  if (!record.consumed) world.foods.push({ id, x, y, source: structuredClone(event) });
  return true;
}
export function consumeFood(world, food, rng, width = 36, height = 22) {
  if (world.respawnFood === false) {
    const i = world.foods.findIndex((f) => f.id === food.id);
    if (i >= 0) world.foods.splice(i, 1);
    const event = world.foodEvents?.find((e) => e.id === food.id);
    if (event) event.consumed = true;
  } else {
    food.x = 2 + rng() * (width - 4);
    food.y = 2 + rng() * (height - 4);
  }
}
export function statusFoodEvent(cause, status = cause.status) {
  return {
    chainId: Number(cause.chainId),
    registry: cause.registry || cause.registryAddress,
    agentId: String(cause.agentId),
    transactionHash: cause.transactionHash,
    blockHash: cause.blockHash,
    blockNumber: Number(cause.blockNumber),
    logIndex: Number(cause.logIndex),
    revision: String(status.revision),
    stimulus: Number(status.stimulus),
  };
}
