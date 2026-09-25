// Server-side, read-only Uniswap quote adapter. Never imported by the browser bundle.
import { createHash } from 'node:crypto';
import { UniswapPriceBioAgent } from '../../../packages/bio_agent/runtime/agents.js';
const ENDPOINT = 'https://trade-api.gateway.uniswap.org/v1/quote';
export async function fetchUniswapObservation({
  apiKey,
  market,
  swapper,
  fetchImpl = fetch,
  now = Date.now,
}) {
  if (typeof window !== 'undefined') throw new Error('Quote credentials must stay on the server');
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('Uniswap API key required');
  if (!/^0x[0-9a-f]{40}$/i.test(swapper || '')) throw new Error('Quote swapper address required');
  const validator = new UniswapPriceBioAgent({ id: 'quote-validation', owner: swapper }, market);
  const request = {
    type: 'EXACT_INPUT',
    tokenInChainId: market.chainId,
    tokenOutChainId: market.chainId,
    tokenIn: market.tokenIn,
    tokenOut: market.tokenOut,
    amount: market.amountIn,
    swapper,
    protocols: ['V3'],
    routingPreference: 'BEST_PRICE',
    slippageTolerance: 0.5,
  };
  const response = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`Uniswap quote HTTP ${response.status}`);
  const raw = await response.text();
  const result = JSON.parse(raw);
  const quote = result.quote;
  if (
    result.routing !== 'CLASSIC' ||
    !result.requestId ||
    quote?.txFailureReason ||
    quote?.input?.token?.toLowerCase() !== market.tokenIn.toLowerCase() ||
    quote?.output?.token?.toLowerCase() !== market.tokenOut.toLowerCase() ||
    quote?.input?.amount !== market.amountIn ||
    (quote.chainId !== undefined && quote.chainId !== market.chainId)
  )
    throw new Error('Unsupported or mismatched Uniswap quote');
  const observedAt = now();
  const observation = {
    source: 'uniswap-api',
    observationId: result.requestId,
    routing: result.routing,
    chainId: market.chainId,
    tokenIn: market.tokenIn,
    tokenOut: market.tokenOut,
    amountIn: market.amountIn,
    amountOut: quote.output.amount,
    observedAt,
    endpoint: ENDPOINT,
    rawResponseHash: `0x${createHash('sha256').update(raw).digest('hex')}`,
    query: request,
  };
  validator.observe(observation, observedAt);
  return observation;
}
