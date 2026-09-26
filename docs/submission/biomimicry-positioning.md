# From biomimicry to BioAgent

Research/pitch snapshot, 2026-09-26. [Later MaleCNS learning integration](../design/malecns-learning.md) supersedes the historical synthetic/fixed-circuit implementation status. Complements the [thesis](bioagent-thesis.md).

**Just as sharkskin inspired surfaces that reduce drag, biological circuits can inspire how agents act.** BioAgent makes that choice traceable from circuit source and mappings to actions. Inspiration is a research direction, not a demonstrated performance gain.

## Product precedents

| Biological structure | Product                        | Evidence scope                                                                                                                                                                                                         |
| -------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sharkskin grooves    | AeroSHARK riblet film          | [Lufthansa Technik](https://www.lufthansa-technik.com/en/aeroshark) describes approximately 1% fuel/emission reduction for specified applications, not every geometry/condition                                        |
| Burdock hooks        | VELCRO hook-and-loop fasteners | [Manufacturer history](https://www.velcro.com/original-thinking/our-timeline-of-innovation/): observation followed by material/manufacturing development                                                               |
| Lotus leaf surface   | Lotusan facade paint           | [Sto technical sheet](https://www.sto-sea.com/media/documents/download_broschuere_1/03__facade/05__facade_paint_1/StoColor_Lotusan_TDS_SE_24.02.2022.pdf): water repellence/microstructure and rain-dependent cleaning |
| Gecko toes           | Gecko Gripper                  | [NASA2020 account](https://www.nasa.gov/technology/tech-transfer-spinoffs/new-commercial-robot-copies-geckos-toes/): commercial gripping via microstructure/intermolecular contact, separate from space prototypes     |

These establish examples, not biomimicry's success rate or universal superiority.

## Research hypothesis

Related functional structures can be starting points/constraints rather than searching from scratch. For agents, test adaptation from limited experience, bounded-compute response, and stability under disturbed inputs. [Research rationale](../standards/why-bioagent.md).

Evolution does not optimize arbitrary human tasks. Simulating neural connectivity on a CPU does not automatically inherit a living fly's energy efficiency. Select relevant structure, state engineered mappings/learning, and decide through measurements.

Engineering usefulness and biological fidelity are separate axes: compare reward/samples/latency/resources/noise tolerance under matched budgets; independently check source connectivity, neural predictions, and biological behavior. Useful engineering need not reproduce an organism, but usefulness does not prove brain emulation.

## Proposed tests, not completed results

- Measured graph versus degree-preserving shuffle and matched artificial models, multiple seeds/equal learning budgets: unseen reward and samples to target.
- Body inputs on/off with changed food/stimuli: resource use, recovery, stability.
- Small-circuit computational advantage on the same hardware/quality target: latency, memory, and power if measured.

Market tests need isolated chronological data plus fees/impact. Foraging results do not establish market profit. At the initial milestone, two games were synthetic and Circuit Lab's measured7-neuron/19-edge response changed under ablation. That proved dependence, not superiority of biological arrangement. [Circuit evidence](../design/circuit-evidence.md).

## Profile and blockchain role

Consumers need to know borrowed structure, engineered additions, trainable components, and evaluation conditions. The proposed profile shares those meanings while reusing ordinary identity/authority/communication. Onchain stimuli provide common traceable inputs; records alone do not establish performance or biology.

A possible presentation introduces sharkskin/fasteners, then circuit-inspired action, shows input TX→response→provenance/computation, and closes with the shared profile. “Can inspire” expresses the hypothesis accurately.
