import {Arena} from '../../../packages/bio_agent/browser/arena.js';
import {exportReadout,restoreReadout} from '../../../packages/training/browser/readout.js';
import {protocol,mean,save} from './common.mjs';
const p=protocol.lightForaging;
function evaluate(q,seed,profile){
 const a=new Arena(seed,{agentCount:1});a.autoLearn=false;
 a.flies[0].q=structuredClone(q);a.world.stimulus=profile.stimulus;a.world.energy=profile.energy;
 let reward=0;
 for(let i=0;i<p.episodeTicks;i++){a.tick();reward+=a.flies[0].lastTransition.reward;}
 return {food:a.flies[0].score,contacts:a.flies[0].collisions,reward};
}
const summarize=rows=>Object.fromEntries(['food','contacts','reward'].map(k=>[k,mean(rows.map(r=>r[k]))]));
const frozen=Object.fromEntries(p.profiles.map(profile=>[profile.name,p.testSeeds.map(seed=>({seed,...evaluate({},seed,profile)}))]));
const records=[];
for(const trainingSeed of p.trainingSeeds)for(const variant of p.variants){
 const learner=new Arena(trainingSeed,{agentCount:1});learner.autoLearn=false;learner.duration=100000;
 const rounds=[];
 for(let round=1;round<=p.rounds;round++){
  for(let i=0;i<p.collectionTicksPerRound;i++)learner.tick();
  const fly=learner.flies[0],previous={q:structuredClone(fly.q),version:fly.version};
  learner.startTraining(fly);
  while(fly.state==='learning')learner.tick();
  const internal=structuredClone(fly.lastReport);let external=null;
  if(variant==='constrained-selection'&&internal.adopted){
   const before=summarize(p.selectionSeeds.map(seed=>evaluate(previous.q,seed,p.profiles[0])));
   const after=summarize(p.selectionSeeds.map(seed=>evaluate(fly.q,seed,p.profiles[0])));
   const adopted=after.reward>before.reward+1e-9&&after.food>=before.food&&after.contacts<=before.contacts;
   external={before,after,adopted};
   if(!adopted){fly.q=previous.q;fly.version=previous.version;}
  }
  const item={round,internal,external,activeVersion:fly.version};
  if(p.checkpoints.includes(round)){
   item.tests=p.profiles.map(profile=>{
    const episodes=p.testSeeds.map((seed,i)=>({seed,before:frozen[profile.name][i],after:evaluate(fly.q,seed,profile)}));
    const before=summarize(episodes.map(x=>x.before)),after=summarize(episodes.map(x=>x.after));
    return {profile:profile.name,before,after,delta:Object.fromEntries(Object.keys(before).map(k=>[k,after[k]-before[k]])),criterionPassed:after.reward>before.reward&&after.contacts<=before.contacts,episodes};
   });
   item.readout=exportReadout(fly,'foraging');
   const restored=new Arena(1,{agentCount:1});restoreReadout(restored.flies[0],item.readout,'foraging');
  }
  rounds.push(item);
 }
 records.push({trainingSeed,variant,rounds});
 console.log(JSON.stringify({experiment:'light-foraging',trainingSeed,variant,final:rounds.at(-1).tests.map(t=>({profile:t.profile,delta:t.delta,criterionPassed:t.criterionPassed}))}));
}
const summary=[];
for(const variant of p.variants)for(const round of p.checkpoints)for(const profile of p.profiles){
 const tests=records.filter(r=>r.variant===variant).map(r=>r.rounds[round-1].tests.find(t=>t.profile===profile.name));
 summary.push({variant,round,profile:profile.name,trainingRuns:tests.length,before:summarize(tests.map(t=>t.before)),after:summarize(tests.map(t=>t.after)),delta:summarize(tests.map(t=>t.delta)),passedTrainingRuns:tests.filter(t=>t.criterionPassed).length});
}
await save('light-foraging.json',{schema:'bioagent.light-foraging-study.v1',summary,records});
