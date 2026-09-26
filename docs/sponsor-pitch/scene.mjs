export function makeScene(s,i,lang,{deck,C}){
 const els=[],t=v=>typeof v==='object'?v[lang]:v;
 const rect=(x,y,w,h,fill)=>els.push({type:'rect',x,y,w,h,fill});
 const text=(v,x,y,w,h,size=20,color=C.ink,bold=false,extra={})=>els.push({type:'text',text:t(v),x,y,w,h,size,color,bold,...extra});
 const line=(x,y,x2,y2,color=C.line,width=1)=>els.push({type:'line',x,y,x2,y2,color,width});
 rect(0,0,13.333333,7.5,C.bg);rect(.65,.42,.48,.05,C.blue);
 text(s.tag,1.29,.3,11.34,.38,12,C.blue,true);
 text(s.title,.65,1,12.04,1.25,lang==='ja'?35:(t(s.title).length>51?32:36),C.ink,true);
 text(s.lead,.7,2.32,11.95,.88,lang==='ja'?20:19,C.muted);
 if(s.steps){
  const colors=[C.blue,C.teal,C.blue];
  s.steps.forEach((v,j)=>{const x=.65+j*4.17;rect(x,3.73,3.68,1.82,C.white);rect(x,3.73,.05,1.82,colors[j]);text(String(j+1).padStart(2,'0'),x+.24,3.96,3.19,.35,14,colors[j],true);text(v,x+.24,4.54,3.18,.78,lang==='ja'?21:20,C.ink,true);if(j<2&&!(deck.key==='uniswap'&&s.kind==='next'))text('→',x+3.76,4.42,.33,.42,22,C.blue,true,{align:'center'});});
 }else{
  s.questions.forEach((v,j)=>{const y=3.49+j*.89;rect(.68,y,.5,.5,j===0?C.blue:C.teal);text(String(j+1),.68,y+.105,.5,.32,16,C.white,true,{align:'center'});text(v,1.45,y+.035,11.05,.69,lang==='ja'?21:20,C.ink,true);if(j<2)line(1.45,y+.74,12.66,y+.74);});
 }
 rect(.65,6.38,12.03,.62,C.pale);text(s.foot,.84,6.53,11.65,.4,lang==='ja'?13:12.7,C.ink);
 line(.65,7.2,12.67,7.2);text('BIOAGENT × '+deck.name.toUpperCase(),.65,7.28,4.65,.2,8,C.muted,true);text(deck.key==='1inch'?'Powered by Aqua — © Degensoft Ltd 2025':'2026.09.26 / SOURCES '+s.refs.join(' · '),5.1,7.28,6.2,.2,8,C.muted);
 text(`${i+1} / 3`,11.89,7.25,.78,.24,10,C.blue,true,{align:'right'});return els;
}
