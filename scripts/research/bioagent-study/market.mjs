import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PaperArena,ATOM} from '../../../packages/bio_agent/runtime/paper-arena.js';
import {random} from '../../../packages/bio_agent/browser/arena.js';
import {exportReadout,restoreReadout} from '../../../packages/training/browser/readout.js';
import {protocol,mean,save} from './common.mjs';
const p=protocol.market,hash=x=>'0x'+createHash('sha256').update(x).digest('hex');
function tape(seed,regime,steps){
 const rng=random(seed);let logPrice=0;
 return Array.from({length:steps},(_,i)=>{
  const mode=regime==='mixed'?p.regimes[Math.floor(i/120)%3]:regime;
  const drift=mode==='up'?.002:mode==='down'?-.002:-logPrice*.08;
  logPrice+=drift+(rng()-.5)*.012;
  const price=Math.exp(logPrice),base=`fixture/${seed}/${regime}/${i}`;
  return {id:base,fixture:true,blockNumber:i+1,logIndex:0,transactionHash:hash(base+'/tx'),blockHash:hash(base+'/block'),sqrtPriceX96:(BigInt(Math.round(Math.sqrt(price)*1e9))*(1n<<96n)/1000000000n).toString()};
 });
}
async function quote(side,amountString,event){
 const input=BigInt(amountString),sqrt=BigInt(event.sqrtPriceX96),priceE18=sqrt*sqrt*ATOM/(1n<<192n);
 const reserve1=100000n*ATOM,reserve0=reserve1*ATOM/priceE18,net=input*997n/1000n;
 const output=side==='buy'?reserve0*net/(reserve1+net):reserve1*net/(reserve0+net);
 return {amountIn:amountString,amountOut:output.toString(),blockHash:event.blockHash,blockNumber:event.blockNumber,outputIncludesPoolFeesAndImpact:true,quoteId:hash(`${event.id}/${side}/${amountString}`),source:'synthetic-constant-product-fixture'};
}
function make(seed){const a=new PaperArena(seed);a.startTraining=()=>false;return a;}
function end(a){return a.flies.map(f=>({agent:f.id,pnl:Number(f.pnl)/Number(ATOM),equity:Number(f.equity)/Number(ATOM),version:f.version,pending:!!f.pending}));}
const records=[];let restoreAgentSteps=0;
for(const trainingSeed of p.trainingSeeds){
 const learner=make(trainingSeed);
 for(const e of tape(trainingSeed,'mixed',p.collectionEvents))await learner.consume(e,quote);
 for(let i=0;i<3;i++)PaperArena.prototype.startTraining.call(learner,i);
 while(learner.flies.some(f=>f.state==='learning'))learner.advanceLearning();
 const artifacts=learner.flies.map(f=>exportReadout(f,'market'));
 const reports=learner.flies.map(f=>f.report),tests=[];
 for(const regime of p.regimes)for(const seed of p.testSeeds){
  const baseline=make(seed),trained=make(seed),restored=make(seed);const trades=[0,0];
  for(let i=0;i<3;i++){
   trained.flies[i].q=structuredClone(learner.flies[i].q);trained.flies[i].version=learner.flies[i].version;
   restoreReadout(restored.flies[i],JSON.parse(JSON.stringify(artifacts[i])),'market');
  }
  for(const event of tape(seed,regime,p.testEvents)){
   await baseline.consume(event,quote);await trained.consume(event,quote);await restored.consume(event,quote);
   for(let j=0;j<3;j++){
    const a=trained.flies[j],b=restored.flies[j];
    assert.deepEqual([a.decision,a.decisionVersion,a.equity,a.units,a.cash],[b.decision,b.decisionVersion,b.equity,b.units,b.cash]);restoreAgentSteps++;
   }
   for(const [i,arena] of [baseline,trained].entries())trades[i]+=arena.flies.filter(f=>f.trades[0]?.fillBlock===event.blockNumber).length;
  }
  const before=end(baseline),after=end(trained);
  tests.push({regime,seed,before,after,trades,meanDeltaPnL:mean(after.map((a,i)=>a.pnl-before[i].pnl))});
 }
 records.push({trainingSeed,reports,artifacts,tests});console.log(JSON.stringify({experiment:'market',trainingSeed,adopted:reports.map(r=>r.adopted),meanDeltaPnL:mean(tests.map(t=>t.meanDeltaPnL))}));
}
const summary=p.regimes.map(regime=>{
 const tests=records.flatMap(r=>r.tests.filter(t=>t.regime===regime));
 return {regime,trainingRuns:records.length,scenariosPerTraining:p.testSeeds.length,meanBeforePnL:mean(tests.flatMap(t=>t.before.map(f=>f.pnl))),meanAfterPnL:mean(tests.flatMap(t=>t.after.map(f=>f.pnl))),meanDeltaPnL:mean(tests.map(t=>t.meanDeltaPnL)),positiveEpisodes:tests.filter(t=>t.meanDeltaPnL>1e-9).length,negativeEpisodes:tests.filter(t=>t.meanDeltaPnL< -1e-9).length};
});
await save('market.json',{schema:'bioagent.market-study.v1',execution:protocol.market.execution,summary,reuse:{matchedAgentSteps:restoreAgentSteps,additionalTraining:0},records});
