import argparse
import json
from pathlib import Path

from packages.bio_agent import MODEL_VERSION, step
from packages.shared import Stimulus


def train() -> dict:
    # Deliberately synthetic. Training score is not held-out performance.
    samples = [(0.1, 'rest'), (0.3, 'rest'), (0.6, 'explore'), (0.9, 'explore')]
    scores = []
    for threshold in (0.25, 0.5, 0.75):
        correct = sum(
            step(Stimulus('synthetic', None, i, f'synthetic:{i}', value), threshold).action == label
            for i, (value, label) in enumerate(samples)
        )
        scores.append((correct / len(samples), threshold))
    accuracy, threshold = max(scores)
    return {
        'schema_version': 1,
        'base_model_version': MODEL_VERSION,
        'dataset': 'synthetic-demo-v1',
        'threshold': threshold,
        'training_accuracy': accuracy,
        'sample_count': len(samples),
        'evaluation': 'training-only; no held-out evaluation',
        'automatically_applied': False,
    }


def main():
    parser = argparse.ArgumentParser(description='Run a synthetic training scaffold')
    parser.add_argument('--output', type=Path, default=Path('data/training/demo-model.json'))
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(train(), indent=2) + '\n', encoding='utf-8')
    print(f'Training scaffold artifact: {args.output}')


if __name__ == '__main__':
    main()
