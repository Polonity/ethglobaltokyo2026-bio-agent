import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BrainClient} from '../../full/brain-client.mjs';
import {rollout} from '../../../services/full-apps/experiment.mjs';
import {ForagingEnvironment} from '../../../services/full-apps/foraging.mjs';
const root=process.cwd(),out=path.join(root,'artifacts/bioagent-study-20260926');
const protocol=JSON.parse(await fs.readFile('docs/research/bioagent-study-20260926/protocol.json','utf8'));
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'protocol.json'),JSON.stringify(protocol,null,2)+'\n');
const p=protocol.fullForaging,records=[];
const compact=r=>({seed:r.seed,phase:r.phase,steps:r.steps,neurons:r.neurons,rewards:r.rewards,mean:r.mean,neuralMs:r.neuralMs,policyVersions:r.lastDecision.map(d=>d.policyVersion),policyHashes:r.lastDecision.map(d=>d.policyHash),food:r.snapshot.flies.map(f=>f.score),contacts:r.snapshot.flies.map(f=>f.collisions),sourceIds:r.ids});
for(const trainingSeed of p.trainingSeeds){
 const state=path.join(out,`full-state-${trainingSeed}`);
 await fs.mkdir(state); // Refuse to reuse a trained database silently.
 process.env.FULL_APPS_STATE_DIR=state;
 const client=new BrainClient();
 try{
  const brain=await client.call('describe');
  const run=async(phase,seed,steps,candidates=[null,null])=>{
   console.log(JSON.stringify({experiment:'full-foraging',trainingSeed,phase,seed,steps,event:'start'}));
   return rollout({client,chain:null,tape:[],app:'foraging',variant:'full',phase,seed,steps,candidates});
  };
  const collection=await run('collect',trainingSeed,p.collectionTicks);
  const candidates=[];
  for(let agent=0;agent<2;agent++)candidates.push(await client.call('train',{app:'foraging',variant:'full',agent}));
  const before=await run('selection',p.selectionSeed,p.evaluationTicks);
  const after=await run('selection',p.selectionSeed,p.evaluationTicks,candidates.map(c=>c.candidateHash));
  const baseline=[];
  for(const seed of p.testSeeds)baseline.push(compact(await run('test',seed,p.evaluationTicks)));
  const adoption=[];
  for(let agent=0;agent<2;agent++)adoption.push(await client.call('adopt',{candidateHash:candidates[agent].candidateHash,evaluation:{before:before.mean[agent],after:after.mean[agent],metric:'mean observed foraging action reward',evaluationDecisionIds:[...before.ids[agent],...after.ids[agent]]}}));
  const learned=[];
  for(const seed of p.testSeeds)learned.push(compact(await run('test',seed,p.evaluationTicks)));
  const heuristic=p.testSeeds.map(seed=>{
   const env=new ForagingEnvironment(seed);
   for(let tick=0;tick<p.evaluationTicks;tick++){
    const obs=env.observe();env.apply(obs.map(o=>o.allowed.reduce((a,b)=>o.drives[b]>o.drives[a]?b:a)));
   }
   return {seed,rewards:env.flies.map(f=>f.reward),food:env.flies.map(f=>f.score),contacts:env.flies.map(f=>f.collisions)};
  });
  assert.ok(brain.full.neurons>160000);
  const record={trainingSeed,brain,collection:compact(collection),candidates,selection:{before:compact(before),after:compact(after)},adoption,baseline,learned,heuristic};
  records.push(record);await fs.writeFile(path.join(out,'full-foraging.json'),JSON.stringify({schema:'bioagent.full-foraging-study.v1',records,complete:records.length===p.trainingSeeds.length},null,2)+'\n');
  console.log(JSON.stringify({experiment:'full-foraging',trainingSeed,event:'complete',adopted:adoption.map(x=>x.adopted)}));
 }finally{client.close();}
}
