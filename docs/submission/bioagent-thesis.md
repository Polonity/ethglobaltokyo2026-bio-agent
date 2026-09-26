# BioAgent — purpose and explanation

[Japanese / bilingual edition](bioagent-thesis.ja-en.md) · [Presenter kit](presenter-kit/README.md)

**Build a framework for running biologically derived decision models on onchain inputs, adapting from experience, and comparing effectiveness and resource use.** Agent developers and researchers can study repeated numeric decisions under limited compute budgets, reusing input validation, model provenance and learning records. Resource and developer-time savings are intended benefits, not measured results.

The initial TX records dimensions, seed and hazards. Each confirmed positive stimulus adds one food; registration, zero stimulus, failures and duplicates do not. Consumed food disappears. All external inputs are onchain; movement, body, consumption and learning are offchain internal state. The playground waits for a verified environment.

The public browser model uses seven measured MaleCNS neurons and 19 connections to help choose movement or rest. Dynamics, input encoding, body state and action mapping are engineered. This does not measure a fly’s feelings or reproduce a validated whole brain.

“Start learning” updates Q-values from experience and a copy of the confirmed world, adopting only a higher-scoring candidate. Neural wiring stays fixed. Training copies do not create visible food. Same-world replay is not an independent generalization test; recovery after training is not evidence of a better policy.

Public integration evidence, full-market recording and independent research answer different questions. The public app shares its UI and Q-learning between Anvil and Sepolia. The full Python market uses separate online readout updates, and the independent JS framework has its own learning/evaluation/adoption API. Cross-application skill transfer is not demonstrated.

Potential savings accrue directly to agent operators. Protocol teams could benefit from reusable integrations and evaluation methods that encourage adoption. Next tests target execute/hold decisions for identical Uniswap quotes and offer/withdraw decisions for Aqua. The current market uses V3 core and custom FlyV3Router, not Universal Router or Trading API. Energy savings, adoption, volume and capital efficiency remain unmeasured.

The profile describes measured origin, engineered mappings and learned components with consistent meaning. Current contracts do not implement ERC-8004; this is a research profile, not an approved ERC. The framework’s value must ultimately be tested through interoperability and reduced integration effort.
