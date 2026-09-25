"""Reproduce the pinned, deliberately small MaleCNS topology demo.
Requires pyarrow==21.0.0; raw source files stay in .local/connectome-source.
No neuronal dynamics or behavior are inferred by this extraction.
"""
import hashlib
import json
from pathlib import Path
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.feather as feather

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".local/connectome-source"
OUT = ROOT / "packages/bio_agent/connectome"
BASE = "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/"
ROOT_ID = 10001
LIMIT = 6

def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8 * 1024 * 1024), b""):
            h.update(chunk)
    return "0x" + h.hexdigest()

annotations = feather.read_table(SOURCE / "annotations.feather",
    columns=["bodyId", "type", "instance", "superclass"]).to_pylist()
by_id = {r["bodyId"]: r for r in annotations}
assert by_id[ROOT_ID]["type"] == "DNp01"
with pa.memory_map(str(SOURCE / "weights.feather"), "r") as source:
    reader = pa.ipc.open_file(source)
    candidates = []
    for i in range(reader.num_record_batches):
        batch = reader.get_batch(i)
        rows = batch.filter(pc.equal(batch.column("body_pre"), ROOT_ID)).to_pylist()
        candidates.extend(r for r in rows if r["body_post"] in by_id and r["body_post"] != ROOT_ID)
    candidates.sort(key=lambda r: (-r["weight"], r["body_post"]))
    selected = [ROOT_ID] + [r["body_post"] for r in candidates[:LIMIT]]
    assert len(set(selected)) == LIMIT + 1
    ids = pa.array(selected, type=pa.int64())
    edges = []
    for i in range(reader.num_record_batches):
        batch = reader.get_batch(i)
        mask = pc.and_(pc.is_in(batch.column("body_pre"), value_set=ids),
                       pc.is_in(batch.column("body_post"), value_set=ids))
        edges.extend(batch.filter(mask).to_pylist())

result = {
    "schema": "bioagent.male-cns-slice.v1",
    "dataset": "male-cns:v1.0",
    "license": "CC-BY-4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": "MaleCNS: FlyEM / HHMI Janelia, University of Cambridge, MRC LMB and Google Research. https://male-cns.janelia.org/",
    "changes": "Selected body 10001 and its six strongest annotated outgoing neighbors, retained only induced edges; original IDs/counts preserved. Dynamics and action mappings are artificial.",
    "sources": [
        {"uri": BASE + "body-annotations-male-cns-v1.0-minconf-0.5.feather",
         "sha256": sha(SOURCE / "annotations.feather")},
        {"uri": BASE + "connectome-weights-male-cns-v1.0-minconf-0.5.feather",
         "sha256": sha(SOURCE / "weights.feather")}
    ],
    "extractionSha256": sha(Path(__file__)),
    "selection": {"rootBodyId": str(ROOT_ID), "outgoingNeighbors": LIMIT,
                  "sort": "weight descending, body_post ascending", "edges": "induced, all positive counts, including self edges"},
    "nodes": [{"id": str(i), "type": by_id[i]["type"], "instance": by_id[i]["instance"],
               "superclass": by_id[i]["superclass"]} for i in selected],
    "edges": [{"pre": str(r["body_pre"]), "post": str(r["body_post"]), "count": r["weight"]}
              for r in sorted(edges, key=lambda r: (r["body_pre"], r["body_post"]))],
    "inputNode": str(ROOT_ID),
    "readoutNodes": [str(i) for i in selected[1:]]
}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "male-cns-slice.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({"nodes": len(selected), "edges": len(edges), "selected": result["nodes"]}, indent=2))
