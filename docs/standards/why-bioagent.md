# Why propose a BioAgent profile?

Research/design snapshot: 2026-09-26. Distinguish primary-source findings from our design inferences. This does not prove scientific novelty or the need for an independent ERC.

## Traceable inputs

As agents consume external data and act, other participants need to identify the source and ordering of their inputs. Onchain records provide shared contract/data/order references under the chosen chain/finality assumptions. [Ethereum AI agents](https://ethereum.org/ai-agents/) discusses transparent data and contract interactions.

A recorded Swap does not prove a fair price or a good trade. External truth retains [oracle trust assumptions](https://ethereum.org/developers/docs/oracles/). Keep provenance, freshness, finality, execution, and model validity separate. Reading RPC is not complete trustless verification; local Anvil demonstrates reproducibility, not decentralized trust.

## Related activity

[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004), Draft at review, addresses identity/reputation/validation, not event-to-neural encoding. The [EF Q1 2026 allocation post](https://blog.ethereum.org/2026/04/29/allocation-q1-26), published2026-04-29, lists ERC-8004 developer engagement support; this establishes activity, not adoption dominance. [ERC-8350](https://eips.ethereum.org/EIPS/eip-8350), also Draft at review, separates authorized state commitments from their meaning.

Registration alone guarantees neither correctness nor benign behavior. Current contracts are not ERC-8004-compliant. Its NFT dependency does not require adding NFTs to BioAgent.

## Definition and research

A connectome-derived BioAgent uses measured biological connectivity in the input-to-action computation. It may use a slice, no body, fixed dynamics, or a trainable readout, provided scope/assumptions are declared. A mascot or ordinary neural network alone does not meet that definition. Synthetic and bio-inspired controls remain explicitly labeled.

| Primary research                                                                                                              | Finding scope                                                                                       | Our inferred profile need                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Shiu et al., Nature2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11446845/)                                                 | Connectivity/transmitter-informed taste and grooming sensorimotor modeling with experimental checks | Dataset/extraction, dynamics, IDs, mappings, behavior-specific evidence                                 |
| [Lappalainen et al., Nature2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11525180/)                                          | Connectivity constraints and task optimization both support visual-response prediction              | Separate fixed biological constraints from optimized components                                         |
| [NeuroMechFly v2](https://www.nature.com/articles/s41592-024-02497-y), [implementation](https://github.com/NeLy-EPFL/flygym/) | Sensory/motor/body/environment simulation                                                           | Declare feedback loops, time steps, and interface versions                                              |
| [The digital sphinx, author manuscript2026](https://faculty.washington.edu/tuthill/docs/TheSphinx_2026.pdf)                   | Worm connectivity plus learned motor decoder can generate fly-like walking                          | Visual similarity alone does not establish biological fidelity; evaluate decoder and circuit separately |

Peer-review status of the last manuscript was not established by this review. These authors did not propose Ethereum profiles. The studies support separating structure, assumptions, and optimization—not universal speed, safety, energy, finance advantages, or mandatory ERC standardization. They do not all use MaleCNS; bind our claims to [the actual dataset/release](https://male-cns.janelia.org/).

## Additional semantics, compatible APIs

Ordinary users may treat both implementations as agents. Body, memory, continual learning, and checkpoints are not biologically unique. Extra semantics matter when another implementation inspects/reuses/compares **what biological structure was used**:

- Dataset, extraction, neuron/cell-to-execution mapping, and transformations.
- Input normalization, temporal encoding, target channels/cells, delay, and engineered mapping.
- Encoder→neural model→decoder→execution guard boundaries and contribution tests.
- Fixed/updated topology, weights, gain, readout, and state lineage.
- Scoped behavior/conditions/predictions/comparisons/evidence, separating trading results from biological validation.

Metadata can store these fields already. The contribution sought is shared meanings and checks, not a new storage mechanism. Engineering uses may declare biological evaluation unperformed.

## Proposed layers and next evidence

Compose general identity/communication/authority/reputation with a connectome profile, optional body/learning descriptions, and task profiles. This is semantic layering, not four required contracts. Preserve the current foraging ABI while evaluating the design.

Neural computation and every state tick need not be onchain. Blockchain is useful when independent participants need common inputs/history; a research model itself does not require it.

Next evidence: trace a measured circuit from source to execution; compare identical tapes with ablation, shuffled structure, and fixed decoder; separate circuit participation from performance benefit; exchange descriptors/state between independent producers/consumers; assess matched held-out performance and integration effort before claiming interoperability or superiority.

[Design direction](bioagent-design-direction.md) · [Prior art](prior-art-and-bioagent.md) · [Circuit evidence](../design/circuit-evidence.md) · [Experimental requirements](experiment-derived-requirements.md)
