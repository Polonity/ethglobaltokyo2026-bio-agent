# Documentary video credits

Status: credit copy and placement for the documentary edit. This document does not certify that a rendered video already contains these credits.

Opening overlay (while MaleCNS is introduced):

```text
Connectome data: MaleCNS v1.0
male-cns.janelia.org
```

Closing design animation footer (final 12 seconds; preserve separate space for the English speech captions):

```text
Connectome data: MaleCNS v1.0
FlyEM / HHMI Janelia · University of Cambridge
MRC Laboratory of Molecular Biology · Google Research
male-cns.janelia.org · CC BY 4.0
BioAgent adaptation: engineered dynamics, sensory encoding & action readout
```

Include the same attribution and these links in the video description:

- Project and attribution: https://male-cns.janelia.org/
- Dataset download: https://male-cns.janelia.org/download/
- License: https://creativecommons.org/licenses/by/4.0/

The source dataset identifier is `male-cns:v1.0`. Our full runtime uses 166,700 classified neurons from that release, with induced connections between them. It is an adaptation of anatomical connectivity data; do not present our sensory encoding, dynamics, or learned behavior as validated by the dataset creators. Credit is not an endorsement.

For the learning shot, a compact supporting overlay can read:

```text
AMD Ryzen 9 9950X · CPU execution
Ridge Regression · NumPy / SciPy
```

Only the output layer is fitted using collected action rewards. The spoken script omits solver details to keep the GUI central; the experiment's method and independent evaluation are documented in [foraging-validation.md](foraging-validation.md). Training, selection, and final test layouts must not be conflated.

Before final export: verify credit legibility at 720p, no overlap with dialogue captions or collection counters, at least 10 seconds of closing credit visibility, and sync subtitles to the presenter's actual English recording. No synthetic voiceover.
