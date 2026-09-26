"""Seeded exploration and unbiased score ties; no access to target coordinates."""
import numpy as np


def select_action(scores, allowed, rng, epsilon=0.):
    values = np.asarray(scores, dtype=float)
    if not np.isfinite(values).all() or not allowed:
        raise ValueError('Finite scores and allowed actions required')
    if rng.random() < epsilon:
        return int(rng.choice(allowed)), 'exploration'
    best = max(values[a] for a in allowed)
    ties = [a for a in allowed if np.isclose(values[a], best, rtol=0, atol=1e-12)]
    return int(rng.choice(ties)), 'tie-break' if len(ties) > 1 else 'policy'
