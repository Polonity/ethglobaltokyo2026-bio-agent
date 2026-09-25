"""Shared, versionable input and state contracts."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Stimulus:
    source: str
    chain_id: int | None
    block_number: int
    block_hash: str
    value: float

    def __post_init__(self):
        if not 0 <= self.value <= 1:
            raise ValueError('value must be between 0 and 1')


@dataclass(frozen=True)
class AgentState:
    activation: float
    action: str
    model_version: str
