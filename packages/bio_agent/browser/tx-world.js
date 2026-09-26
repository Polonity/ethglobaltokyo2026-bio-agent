import { enableTxFood } from './tx-food.js';
export const WORLD_SCHEMA = '0x7c2ae28905a4824dbd041084357fb6f451344527b8380843d2bbf0102fe137a2';
export function validateWorldInput(input) {
  if (
    input?.schema !== 'bioagent.foraging-world.v1' ||
    !Number.isSafeInteger(input.seed) ||
    input.seed < 0 ||
    input.seed > 0xffffffff
  )
    throw Error('Invalid world schema/seed');
  for (const key of ['width', 'height'])
    if (!Number.isFinite(input[key]) || input[key] < 10 || input[key] > 100)
      throw Error('Invalid world dimensions');
  if (
    !Number.isFinite(input.foodMargin) ||
    input.foodMargin < 1.1 ||
    input.foodMargin * 2 >= Math.min(input.width, input.height)
  )
    throw Error('Invalid food margin');
  if (!Array.isArray(input.hazards) || input.hazards.length > 8) throw Error('Invalid hazards');
  for (const h of input.hazards)
    if (
      ![h.x, h.y, h.radius].every(Number.isFinite) ||
      h.radius <= 0 ||
      h.x - h.radius < 0 ||
      h.y - h.radius < 0 ||
      h.x + h.radius > input.width ||
      h.y + h.radius > input.height
    )
      throw Error('Invalid hazard coordinates');
  return {
    schema: input.schema,
    seed: input.seed,
    width: input.width,
    height: input.height,
    foodMargin: input.foodMargin,
    hazards: input.hazards.map(({ x, y, radius }) => ({ x, y, radius })),
  };
}
export function emptyTxWorld() {
  const world = { width: 0, height: 0, hazards: [], stimulus: 0, energy: 0, mode: 'rest', worldSource: null };
  enableTxFood(world);
  return world;
}
export function applyTxWorld(world, event) {
  if (
    event.name !== 'BioAgentStimulusAccepted' ||
    event.schema !== WORLD_SCHEMA ||
    event.agentId !== '1' ||
    !event.receiptVerified ||
    !/^0x[0-9a-f]{64}$/i.test(event.transactionHash)
  )
    throw Error('Confirmed environment TX required');
  const input = validateWorldInput(event.configuration);
  const previous = world.worldSource;
  if (previous && BigInt(event.nonce) <= BigInt(previous.nonce)) {
    if (event.nonce === previous.nonce && event.blockHash !== previous.blockHash)
      throw Error('World input reorg');
    return false;
  }
  enableTxFood(world); // A configuration TX explicitly starts a new environment epoch.
  Object.assign(world, input, { worldSource: structuredClone(event) });
  return true;
}
