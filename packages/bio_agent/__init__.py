"""MaleCNS measured partial topology with engineered rate dynamics and decoder."""
from functools import lru_cache
import hashlib
import json
import math
from pathlib import Path
from packages.shared import AgentState, Stimulus

MODEL_VERSION = 'male-cns-rate-threshold-v2'
_GRAPH_BYTES = (Path(__file__).parent / 'connectome' / 'male-cns-slice.json').read_bytes()
GRAPH_SHA256 = '0x' + hashlib.sha256(_GRAPH_BYTES).hexdigest()
if GRAPH_SHA256 != '0xfa923a4bdf0c41af7d0fc9197507f0935adcee957a6417c765db9700d46df987':
    raise ValueError('Required MaleCNS graph digest mismatch')
_GRAPH = json.loads(_GRAPH_BYTES)
if _GRAPH['dataset'] != 'male-cns:v1.0' or len(_GRAPH['nodes']) != 7 or len(_GRAPH['edges']) != 19:
    raise ValueError('Required MaleCNS topology unavailable')
_INDEX = {node['id']: i for i, node in enumerate(_GRAPH['nodes'])}
_SCALE = max(edge['count'] for edge in _GRAPH['edges'])

@lru_cache(maxsize=257)
def _response(bin_: int) -> float:
    activity = [0.0] * len(_INDEX)
    for _ in range(32):
        drive = [0.0] * len(_INDEX)
        for edge in _GRAPH['edges']:
            drive[_INDEX[edge['post']]] += edge['count'] / _SCALE * activity[_INDEX[edge['pre']]]
        drive[_INDEX[_GRAPH['inputNode']]] += bin_ / 256
        activity = [.75 * a + .25 * math.tanh(d) for a, d in zip(activity, drive)]
    return sum(activity[_INDEX[node]] for node in _GRAPH['readoutNodes']) / len(_GRAPH['readoutNodes']) / .151

def step(stimulus: Stimulus, threshold: float = 0.5) -> AgentState:
    if not math.isfinite(threshold) or not 0 <= threshold <= 1:
        raise ValueError('threshold must be between 0 and 1')
    activation = _response(math.floor(stimulus.value * 256 + .5))
    return AgentState(activation=activation, action='explore' if activation >= threshold else 'rest', model_version=MODEL_VERSION)
