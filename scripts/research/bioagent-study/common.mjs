import fs from 'node:fs/promises';
import path from 'node:path';
export const out=path.resolve('artifacts/bioagent-study-20260926');
export const protocol=JSON.parse(await fs.readFile('docs/research/bioagent-study-20260926/protocol.json','utf8'));
export const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
export async function save(name,data){await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,name),JSON.stringify(data,null,2)+'\n');}
export const metrics=arena=>({food:arena.flies[0].score,contacts:arena.flies[0].collisions});
