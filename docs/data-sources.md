# MaleCNS data sources

Reference: https://male-cns.janelia.org/ (checked 2026-09-25).

The official site publishes male fruit fly CNS connectivity and links to downloads and query tools such as neuPrint. Its landing page identifies the dataset as CC-BY. Check the license version and attribution requirements attached to each imported distribution.

On 2026-09-26, Circuit Lab added a MaleCNS v1.0 extract of 7 neurons and 19 connections, distributed as CC BY 4.0 data. It retains original IDs, connection counts, data and extraction-code hashes, attribution, and changes. Large source data is not bundled. Dynamics and input/output mappings are engineered, not a physiological model. See [circuit verification and extraction](design/circuit-evidence.md).

Record the following in import manifests:

- Distribution URL, release, retrieval date, and hash.
- License, recommended citation, and attribution.
- Source paper and neuron/synapse selection criteria.
- Preprocessing code version and generated graph statistics.
- Stimulus/state/action mappings and model assumptions.

Connectivity alone does not establish behavior or learning capability. Record model construction separately from evaluation results.
