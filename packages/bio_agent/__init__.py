"""Replaceable demo runtime; this is not a MaleCNS simulation."""
from packages.shared import AgentState, Stimulus

MODEL_VERSION = 'threshold-demo-v1'


def step(stimulus: Stimulus, threshold: float = 0.5) -> AgentState:
    if not 0 <= threshold <= 1:
        raise ValueError('threshold must be between 0 and 1')
    return AgentState(
        activation=stimulus.value,
        action='explore' if stimulus.value >= threshold else 'rest',
        model_version=MODEL_VERSION,
    )
