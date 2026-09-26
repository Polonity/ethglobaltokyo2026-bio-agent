// Frozen protocol, existing runtime only; never contacts running apps or a chain.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Arena,random} from '../../packages/bio_agent/browser/arena.js';
import {exportReadout,restoreReadout} from '../../packages/training/browser/readout.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const protocolPath=path.join(root,'docs/sponsor-pitch/benefit-protocol.json');
const protocolBytes=await fs.readFile(protocolPath),p=JSON.parse(protocolBytes);
const hash=x=>createHash('sha256').update(x).digest('hex');
const out=path.join(root,'artifacts/bioagent-benefits-20260926');
await fs.mkdir(out,{recursive:true});
// Archive the chosen metrics and seeds before executing the comparison.
await fs.writeFile(path.join(out,'protocol.json'),protocolBytes);
const training=new Arena(p.trainingSeed,{agentCount:1});training.autoLearn=false;
const beforeQ=structuredClone(training.flies[0].q);
for(let i=0;i<p.collectionTicks;i++)training.tick();
training.startTraining(training.flies[0]);
for(let i=0;i<p.trainingCalls;i++)training.tick();
assert.equal(training.flies[0].state,'racing');
const artifact=JSON.parse(JSON.stringify(exportReadout(training.flies[0],'foraging')));
const runs=[];let matchedTicks=0;
for(const seed of p.testSeeds){
  const baseline=new Arena(seed,{agentCount:1});baseline.autoLearn=false;
  baseline.flies[0].q=structuredClone(beforeQ);
  const learned=Arena.restore(baseline.checkpoint()),restored=Arena.restore(baseline.checkpoint());
  learned.flies[0].q=structuredClone(training.flies[0].q);
  learned.flies[0].version=training.flies[0].version;
  assert.ok(restoreReadout(restored.flies[0],artifact,'foraging'));
  const rewards=[0,0,0];let changedActions=0;
  for(let i=0;i<p.testTicks;i++){
    [baseline,learned,restored].forEach((arena,j)=>{arena.tick();rewards[j]+=arena.flies[0].lastTransition.reward;});
    assert.deepEqual(learned.flies[0].lastTransition,restored.flies[0].lastTransition);
    if(baseline.flies[0].lastTransition.action!==learned.flies[0].lastTransition.action)changedActions++;
    matchedTicks++;
  }
  const metric=(a,j)=>({food:a.flies[0].score,collisions:a.flies[0].collisions,reward:rewards[j]});
  runs.push({seed,before:metric(baseline,0),learned:metric(learned,1),restored:metric(restored,2),changedActions});
}
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const rng=random(p.bootstrap.seed),summary={};
for(const metric of ['food','collisions','reward']){
  const a=runs.map(r=>r.before[metric]),b=runs.map(r=>r.learned[metric]),delta=b.map((v,i)=>v-a[i]);
  const boot=Array.from({length:p.bootstrap.samples},()=>mean(delta.map(()=>delta[Math.floor(rng()*delta.length)]))).sort((a,b)=>a-b);
  summary[metric]={before:mean(a),learned:mean(b),pairedDifference:mean(delta),pairedBootstrap95:[boot[Math.floor(boot.length*.025)],boot[Math.floor(boot.length*.975)]],wins:delta.filter(d=>d>0).length,ties:delta.filter(d=>d===0).length,losses:delta.filter(d=>d<0).length};
}
const wrongModel=()=>restoreReadout(new Arena(1,{agentCount:1}).flies[0],{...artifact,model:'different-model'},'foraging');
const wrongApp=()=>restoreReadout(new Arena(1,{agentCount:1}).flies[0],artifact,'market');
assert.throws(wrongModel);assert.throws(wrongApp);
const sourceSha256={};
for(const f of ['docs/sponsor-pitch/measure-benefits.mjs','packages/bio_agent/browser/arena.js','packages/bio_agent/browser/body.js','packages/bio_agent/connectome/male-cns.js','packages/bio_agent/connectome/male-cns-slice.json','packages/training/browser/readout.js','packages/training/browser/learning.js'])sourceSha256[f]=hash(await fs.readFile(path.join(root,f)));
const result={schema:'bioagent.benefit-measurement.v1',measuredAt:new Date().toISOString(),protocolSha256:hash(protocolBytes),node:process.version,training:training.flies[0].lastReport,summary,primarySuccess:summary.food.pairedDifference>0&&summary.food.pairedBootstrap95[0]>0,reuse:{matchedTicks,episodes:runs.length,additionalTrainingUpdates:0,wrongModelRejected:true,wrongApplicationRejected:true},runs,sourceSha256,limitations:p.limitations};
await fs.writeFile(path.join(out,'measurement.json'),JSON.stringify(result,null,2)+'\n');
await fs.writeFile(path.join(out,'trained-readout.json'),JSON.stringify(artifact)+'\n');
console.log(JSON.stringify({out,training:result.training,summary,primarySuccess:result.primarySuccess,reuse:result.reuse},null,2));
