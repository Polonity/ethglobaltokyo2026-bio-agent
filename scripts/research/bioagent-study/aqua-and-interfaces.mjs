import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Arena} from '../../../packages/bio_agent/browser/arena.js';
import {IBioAgentRuntime,ForagingBioAgent,UniswapPriceBioAgent} from '../../../packages/bio_agent/runtime/agents.js';
import {UniswapSwapBioAgent} from '../../../packages/bio_agent/runtime/swap-agent.js';
import {defaultAquaPolicy,trainAquaPolicy} from '../../../packages/training/browser/aqua-learning.js';
import {decideAqua} from '../../../packages/bio_agent/connectome/aqua-controller.js';
import {exportReadout,restoreReadout} from '../../../packages/training/browser/readout.js';
import {protocol,mean,save} from './common.mjs';
const graph=JSON.parse(await fs.readFile('packages/bio_agent/connectome/male-cns-slice.json','utf8'));
const records=[];
for(const agentId of protocol.aqua.agents){
 const initial=defaultAquaPolicy();let policy=initial;const rounds=[];
 for(let round=1;round<=protocol.aqua.trainingRounds;round++){policy=trainAquaPolicy(policy,agentId);rounds.push({round,version:policy.version,gain:policy.gain,report:policy.report});}
 const samples=protocol.aqua.risks.map(risk=>{
  const a=decideAqua(graph,risk,agentId,initial),b=decideAqua(graph,risk,agentId,policy),target=risk/10000*.24;
  const compact=d=>({response:d.response,action:d.action,spreadBps:d.spreadBps,rawResponse:d.rawResponse});
  assert.ok(a.rawResponse<.1||b.action==='dock');
  return {risk,target,before:compact(a),after:compact(b),rule:{response:target,error:0}};
 });
 records.push({agentId,rounds,samples,beforeMSE:mean(samples.map(s=>(s.before.response-s.target)**2)),afterMSE:mean(samples.map(s=>(s.after.response-s.target)**2)),ruleMSE:0,changedActions:samples.filter(s=>s.before.action!==s.after.action).length,changedSpreads:samples.filter(s=>s.before.spreadBps!==s.after.spreadBps).length});
}
await save('aqua.json',{schema:'bioagent.aqua-study.v1',records,limitation:protocol.aqua.limitations});

const owner='0x'+'11'.repeat(20),pool='0x'+'22'.repeat(20),now=100000;
const arena=new Arena(270001,{agentCount:1});arena.autoLearn=false;
const market={chainId:31337,tokenIn:pool,tokenOut:'0x'+'33'.repeat(20),amountIn:'1000000000000000000'};
const instances=[new ForagingBioAgent({id:'foraging',owner},arena,'1'),new UniswapPriceBioAgent({id:'quote',owner},market),new UniswapSwapBioAgent({id:'swap',owner},{chainId:31337,pool})];
const swap={source:'evm-swap-log',protocol:'uniswap-v3-event',chainId:31337,pool,observedAt:now,blockNumber:1,transactionIndex:0,logIndex:0,blockHash:'0x'+'44'.repeat(32),transactionHash:'0x'+'55'.repeat(32),sqrtPriceX96:(1n<<96n).toString(),fixture:true};
swap.eventId=`${swap.chainId}:${pool}:${swap.blockHash}:${swap.transactionHash}:0`;
const inputs={foraging:{name:'BioAgentStatusUpdated',agentId:'1',status:{activity:2,energy:7000,stimulus:5500,revision:'1'},transactionHash:'0x'+'66'.repeat(32),fixture:true},quote:{...market,source:'fixture',routing:'CLASSIC',observationId:'quote-1',observedAt:now,amountOut:'2000000000'},swap};
// This scheduler has no task-specific branches; only input adapters differ.
const run=(agents,data)=>agents.map(agent=>{const acceptance=agent.observe(data[agent.identity.id],now);const stepped=agent.step(.2,now);return {identity:agent.identity,kind:agent.kind,acceptance,snapshot:agent.snapshot(),clockAfter:stepped.runtime.time,hasCommonLearning:typeof agent.learn==='function',hasCommonCheckpoint:typeof agent.checkpoint==='function',inheritsRuntime:agent instanceof IBioAgentRuntime};});
const common=run(instances,inputs);
assert.ok(common.every(r=>r.clockAfter===.2&&r.inheritsRuntime));
const shared=new Arena(270019,{agentCount:2});shared.autoLearn=false;
const a=new ForagingBioAgent({id:'shared-1',owner},shared,'1'),b=new ForagingBioAgent({id:'shared-2',owner},shared,'2');
const checkpoint=shared.checkpoint();[a,b].forEach(agent=>agent.step(.2));
const naive={time:shared.time,actionsPerAgent:shared.flies.map(f=>f.activeTicks)};
const correct=Arena.restore(checkpoint);correct.tick(.2);
const environmentScheduled={time:correct.time,actionsPerAgent:correct.flies.map(f=>f.activeTicks)};
assert.equal(naive.time,.4);assert.equal(environmentScheduled.time,.2);
const artifact=exportReadout(arena.flies[0],'foraging');let wrongAppRejected=false,wrongModelRejected=false;
try{restoreReadout(arena.flies[0],artifact,'market');}catch{wrongAppRejected=true;}
try{restoreReadout(arena.flies[0],{...artifact,model:'wrong'},'foraging');}catch{wrongModelRejected=true;}
assert.ok(wrongAppRejected&&wrongModelRejected);
await save('interfaces.json',{schema:'bioagent.interface-study.v1',scope:'Runtime fixtures only, not verified chain receipts',commonLoop:{adapterKinds:common.length,records:common,limitation:'All three adapters wrap the existing foraging Arena; not three independent task engines'},sharedEnvironment:{naive,environmentScheduled,lesson:'Advance a shared environment once per tick; per-agent base step currently advances all agents'},artifactGuards:{wrongAppRejected,wrongModelRejected},gaps:['IBioAgentRuntime has no common learn/checkpoint/restore methods','Solidity IBioAgent defines input status, not execution or learning','Generic TypeScript IBioAgentRuntimeV1 is proposed, not implemented by current classes']});
console.log(JSON.stringify({aqua:records.map(r=>({agent:r.agentId,beforeMSE:r.beforeMSE,afterMSE:r.afterMSE,ruleMSE:r.ruleMSE,changedActions:r.changedActions})),interfaces:{commonAdapters:common.length,naive,environmentScheduled}}));
