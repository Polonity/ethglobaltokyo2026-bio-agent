# BioAgent: from experiments to a framework

[Japanese / bilingual edition](README.ja-en.md)

**Conclusion.** A reusable framework and learning effects were demonstrated in synthetic foraging. Biological performance superiority was not demonstrated. Higher reward also consumed more body energy.

The new opt-in adapter uses reward-driven random search over three readout coefficients: rest bias, fatigue response and directional persistence. Neural topology is fixed. The previous Q learner remains unchanged. After development, we froze the protocol before final fitting and held-out testing. Five search seeds share 12 training worlds; 20 selection worlds govern adoption. Sixty unseen worlds per profile test the adopted policies. A relocated-hazard stress profile is reported separately.

Default reward increased **18.79 → 56.12**, food **6.80 → 20.84**, and contacts **1.25 → 0.10**. All five search runs passed the specified mean reward/contact test. Two-axis bootstrap reward change: **+37.34 [28.85, 46.84]**. Contact change: **−1.15 [−2.94, 0.00]**. These intervals do not cover alternative training-world datasets or all possible environments.

The matched direct-input learner scored **56.08**; the connectome advantage was **+0.045 [−0.123, +0.197]**, so superiority was not established. One engineered rule scored **49.05**, with slightly fewer contacts (**0.083**). We did not compare against every ordinary AI or LLM. The additional hazard guard did not change the measured policies' results. Reduced resting, from **192.07 to 7.68 ticks**, was the visible behavioral difference.

An exploratory body audit then found final energy **0.722 → 0.361**, and low-energy ticks **0 → 48.50 / 300**. This is a reward–energy tradeoff, not unqualified biological adaptation. An optional final-energy adoption floor now rejects reward-improving candidates that violate a specified reserve requirement. We verified the rejection, not a newly learned policy satisfying that floor.

**Why a framework?** Two different task engines share learning and artifact APIs. Restored policies reproduce 300 decisions per task without retraining. Artifact compatibility checks cover identity, task and model/mapping versions. One shared clock prevents duplicate Arena advancement through that API. Three actual local Registry updates produced six traceable decisions across two adapters; the CLI, rollback rejection and read-only source methods were verified. Browser interactions and historical replay matched the EVM evidence exactly.

**Sponsor value.** The practical proposal is a reusable way to compare candidate controllers against rules and direct-input models on identical inputs, reject regressions, and trace decisions to chain state and policy versions. Increased router use, user adoption, trading returns and power savings remain hypotheses. A concrete next Uniswap task is quote-and-fee-based candidate/hold decisions, measured against matched controls on unseen data. The current Aqua task is artificial calibration; its defining formula solves the target exactly.

**What is biological?** A measured 7-neuron, 19-edge MaleCNS slice participates in feature computation. Dynamics, mappings and body model are engineered. The existing full 166, 700-neuron runtime is separate and not integrated into this framework release.

**What was learned?** Three readout coefficients were selected from 48 reward-evaluated candidates per run. This is optimization from experience, not biological synaptic plasticity or proof of live-animal learning.

**What does save/restore prove?** Reuse within a compatible task and runtime. It does not demonstrate skill transfer between tasks or restore the complete environment state. SHA-256 checks content integrity, not authorship.

**Is it cheaper than an LLM?** The approximately 600-byte saved policy is not the runtime memory footprint. No matched LLM capability, energy or total-cost comparison was performed.

**Can it trade automatically?** The package returns decisions only and has no signer or transaction execution. A consumer must supply its own authorization and execution-time checks. The chain source trusts its RPC and is not a cryptographic state-proof verifier.

## Reproduction and evidence

Run from the repository root:

```sh
npm run test:framework
npm run research:adaptation
node scripts/research/bioagent-adaptation/body-audit.mjs
npm run test:framework:chain
npm run test:framework:browser
```

Primary protocol hash: `1db1bf40c3f88601a877e981ca8a10add46cf5cef205d99ae71d0216b471c314`. Development results remain in `development.json`. Generated files are under `artifacts/bioagent-adaptation-20260926/` (Git-ignored). Protocol and reproducible source are tracked in the repository. The evidence package contains their hashes and a ZIP manifest.
