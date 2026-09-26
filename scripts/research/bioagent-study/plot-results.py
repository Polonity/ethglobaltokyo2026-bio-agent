import json
from pathlib import Path
import plotly.graph_objects as go
from plotly.subplots import make_subplots
out=Path(__file__).resolve().parents[3]/'artifacts/bioagent-study-20260926'
s=json.loads((out/'summary.json').read_text())
fig=make_subplots(rows=1,cols=3,subplot_titles=['A. Training did not improve overall reward','B. Less loss in two synthetic regimes','C. Full model vs an engineered rule'],horizontal_spacing=.09)
for variant,label,color in [('existing-adoption','Current adoption','#315B9E'),('constrained-selection','Constrained selection','#087E74')]:
    r=[x for x in s['light'] if x['variant']==variant and x['profile']=='default']
    fig.add_trace(go.Scatter(x=[0]+[x['round'] for x in r],y=[0]+[x['delta']['reward'] for x in r],name=label,mode='lines+markers',line={'color':color},legendgroup='foraging'),row=1,col=1)
regimes=['Rising','Falling','Oscillating']
for key,label,color in [('meanBeforePnL','Frozen market policy','#A0AAB2'),('meanAfterPnL','Learned market policy','#087E74')]:
    fig.add_trace(go.Bar(x=regimes,y=[r[key] for r in s['market']],name=label,marker_color=color,legendgroup='market'),row=1,col=2)
vals=[s['full'][k]['rewards'] for k in ['baseline','learned','heuristic']]
fig.add_trace(go.Bar(x=['Untrained','After adoption','Input rule'],y=vals,text=[f'{v:.2f}' for v in vals],textposition='outside',marker_color=['#A0AAB2','#087E74','#315B9E'],showlegend=False),row=1,col=3)
fig.update_yaxes(title_text='Reward change vs frozen policy',row=1,col=1)
fig.update_yaxes(title_text='Final PnL / agent (toy token1)',row=1,col=2)
fig.update_yaxes(title_text='Cumulative reward / agent',range=[-3.5,12],row=1,col=3)
fig.update_xaxes(title_text='Training rounds',tickvals=[0,1,3,5],row=1,col=1)
for i,text in enumerate(['7 neurons; 5 training seeds; 20 test layouts.<br>Default profile; descriptive means.','Synthetic prices and quotes.<br>3 training seeds × 5 tapes; every mean is negative.','166,700 neurons; 3 training seeds; 2 test worlds.<br>Not a matched biological-topology comparison.']):
    fig.add_annotation(text=text,x=(i+.5)/3,y=-.26,xref='paper',yref='paper',showarrow=False,font={'size':12,'color':'#576671'},xanchor='center')
fig.update_layout(title='BioAgent study — measured gains, regressions and limits',template='plotly_white',width=1536,height=650,margin={'l':70,'r':30,'t':100,'b':150},font={'family':'Arial','size':13},barmode='group',legend={'orientation':'h','y':-.42,'x':0},paper_bgcolor='white')
fig.write_html(out/'results-chart.html',include_plotlyjs=True,config={'displayModeBar':False},full_html=True)
(out/'results-chart-spec.json').write_text(fig.to_json())
print('Plotly chart written')
