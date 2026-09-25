"""Independent scalar reference for exported JS circuit traces; standard library only."""
import hashlib
import json
import math
from pathlib import Path
import sys
root = Path(__file__).resolve().parents[1]
graph = json.loads((root / "packages/bio_agent/connectome/male-cns-slice.json").read_text())
evidence = json.loads(Path(sys.argv[1]).read_text())
graph_ref = evidence["descriptor"]["origin"]["graph"]
assert graph_ref["digest"]["algorithm"] == "sha256"
assert graph_ref["digest"]["value"] == "0x" + hashlib.sha256(
    (root / "packages/bio_agent/connectome/male-cns-slice.json").read_bytes()).hexdigest()
records = evidence["records"]
index = {n["id"]: i for i, n in enumerate(graph["nodes"])}
scale = max(e["count"] for e in graph["edges"])
checked = 0
for record in records:
    for kind in ["intact", "ablated"]:
        trial = record[kind]
        activity = [0.0] * len(index)
        for tick, actual in enumerate(trial["trace"], 1):
            drive = [0.0] * len(index)
            if kind == "intact":
                for e in graph["edges"]:
                    drive[index[e["post"]]] += e["count"] / scale * activity[index[e["pre"]]]
            drive[index[graph["inputNode"]]] += trial["stimulus"]
            activity = [0.75 * a + 0.25 * math.tanh(d) for a, d in zip(activity, drive)]
            response = sum(activity[index[i]] for i in graph["readoutNodes"]) / len(graph["readoutNodes"])
            assert actual["tick"] == tick
            assert len(actual["activity"]) == len(activity)
            assert all(abs(a-b) < 1e-12 for a,b in zip(actual["activity"],activity))
            assert abs(actual["response"] - response) < 1e-12
            assert actual["action"] == ("advance" if response >= 0.1 else "wait")
            checked += 1
        assert trial["final"] == trial["trace"][-1]
assert checked > 0
print(f"Independent Python reference matches {checked} trace steps (absolute tolerance 1e-12).")
