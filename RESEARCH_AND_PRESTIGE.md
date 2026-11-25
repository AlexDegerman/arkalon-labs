# 🧪 Research Matrix & Nested Prestige

Complete reference for the 44-node Research Matrix, three nested Prestige tiers (AR, CF, OS), all 32 prestige shop upgrades, and the 12-system facility automation suite.

---

## 📑 Contents

- [Research Matrix](#-research-matrix)
  - [Core Rules, Overclocking & Study Queue](#core-rules-overclocking--study-queue)
  - [Computation Branch (C1–C10)](#computation-branch-c1c10)
  - [Energy Branch (E1–E10)](#energy-branch-e1e10)
  - [Reality Branch (R1–R10)](#reality-branch-r1r10)
  - [Arkalon Branch (O1–O10)](#arkalon-branch-o1o10)
  - [Infinite Nodes](#infinite-nodes)
- [Nested Prestige Loops](#-nested-prestige-loops)
  - [Tier I — Reality Recalibration (AR)](#tier-i--reality-recalibration-ar)
  - [Tier II — Timeline Severance (CF)](#tier-ii--timeline-severance-cf)
  - [Tier III — Singular Synthesis (OS)](#tier-iii--singular-synthesis-os)
- [Prestige Upgrade Shops](#-prestige-upgrade-shops)
  - [Arkalon Resonance Upgrades (16)](#arkalon-resonance-upgrades-16)
  - [Chronal Fracture Upgrades (10)](#chronal-fracture-upgrades-10)
  - [Omni-Spar Upgrades (6)](#omni-spar-upgrades-6)
- [Automation Suite & Smart Auto-Prestige](#-automation-suite--smart-auto-prestige)

---

## 🧪 Research Matrix

Unlocks upon owning **10 Research Desks**. Research nodes are timed studies unlocked sequentially by branch tier (`1–10`), viewable in both **Grid** and **Dependency Tree** layouts.

### Core Rules, Overclocking & Study Queue

- **Parallel Processing (`1 → 3` Slots):** The facility starts with **1** active study slot. **Node R3** unlocks a **2nd** slot, and CF **Deep Research Slots** unlocks a **3rd**. Parallel slots must always study **different branches** simultaneously.
- **Active Overclocking:** While a node is running, spend liquid RP to immediately reduce its remaining study timer by **25%** of total study duration (minimum `5s`). Near completion, the RP cost scales down proportionally to the remaining time (minimum `1 RP`).
- **O6 Prerequisite Bypass:** Completing **Node O6** grants **1 bypass per prestige run**, allowing direct study of a node whose branch prerequisite is not yet complete (must be started directly rather than queued).
- **Study Queue & Smart Presets:** Unlocked via AR **Auto-Research Queue**. Base capacity is **4** slots, expandable up to **8** via `SC10` (`+1/tier`) and `AC8` (`+1`). Includes one-click queue presets (**Shortest**, **Cheapest**, **Rush Tier**) and manual reordering.
- **Study Speed Stacking:** Time reductions stack multiplicatively across `C2` (`-5%`), `R2` (`-15%`), `O2` (`-10%` Arkalon), AR `Research Accelerant` (`0.97^lv`), CF `Temporal Compression` (`-25%`), `R_INF` (`0.99^lv`, `95%` hard cap), `Empirical Compass` (`-10%` Reality), `Chronos Array` Phase 1 (`-10%` Reality), `Relic 1`, `SC3` (`+15%/tier` Arkalon speed), `SC7` (`0.85^tier`), `AC3` (`0.80^tier`), and the `Omniscient` achievement (`-10%`). `SC2` Tier 1 makes all Tier-1 nodes complete instantly (`0s`).

### Computation Branch (C1–C10)

| ID | Name | Cost | Base Time | Effect |
| :--- | :--- | :--- | :--- | :--- |
| `C1` | Asymptotic Compaction | `100` RP | `5s` | Reduces Research Desk cost scaling (growth factor `-0.02`). |
| `C2` | Algorithmic Superposition | `5.00K` RP | `1m` | Reduces all research study times by `5%`. |
| `C3` | Godel Boundary Decoupling | `7.50 Trillion` RP | `30m` | `+10%` base output to Computation-class buildings per completed research node. |
| `C4` | Superrecursive Logic Gates | `1.20 Undecillion` RP | `1h` | Neural Cores gain `+5%` production per Server Cluster owned. |
| `C5` | Hilbert-Space Addressing | `3.00 Septendecillion` RP | `2h` | `+0.1` to global production exponent multiplier. |
| `C6` | Trans-Finite Recursion | `8.50 Quattuorvigintillion` RP | `4h` | Increases all active anomaly buff multipliers by `+25%`. |
| `C7` | Non-Turing Architecture | `400.00 Untrigintillion` RP | `8h` | `1.15x` RP output to all Computation-class generators. |
| `C8` | The Omega Algorithm | `9.00 Novemtrigintillion` RP | `24h` | Computation-class generators multiplied by `ln(lifetime RP)`. |
| `C9` | Trans-Turing Synapse | `10.00 Duoquadragintillion` RP | `48h` | Reduces cost scaling of generators above Tier 10 by `0.015`. |
| `C10` | Godel Transcendence | `10.00 Septenquadragintillion` RP | `96h` | `+1%` output to all generators per completed tech node. |

### Energy Branch (E1–E10)

| ID | Name | Cost | Base Time | Effect |
| :--- | :--- | :--- | :--- | :--- |
| `E1` | Kinetic Recycling | `300` RP | `10s` | `+15%` offline RP efficiency. |
| `E2` | Entropy Harvesting | `15.00K` RP | `2m` | `+20%` offline RP efficiency. |
| `E3` | Singularity Integration | `4.50 Quadrillion` RP | `45m` | Singularity Reactors apply `+0.25%` to all lower-tier generators per Reactor owned. |
| `E4` | Zero-Point Inflation | `90.00 Duodecillion` RP | `2h` | `5x` RP output to all Energy-class generators. |
| `E5` | Vacuum Polarisers | `180.00 Novemdecillion` RP | `4h` | `+0.5%` global production per AR earned (scales with Harmonic Cap). |
| `E6` | Plasma Lattice Confinement | `2.20 Septenvigintillion` RP | `8h` | Reduces Energy-class generator cost scaling (growth factor `-0.02`). |
| `E7` | Chronal Disruption Fuses | `7.10 Quintrigintillion` RP | `16h` | All spatial anomalies last `2x` longer. |
| `E8` | Infinite Entropic Sink | `1.50 Unquadragintillion` RP | `32h` | Energy-class generators scale by `1 + 0.1 * ln(lifetime RP)`. |
| `E9` | Primordial Inflation Loops | `10.00 Duoquadragintillion` RP | `48h` | `1.5x` RP output for Stellar Harvesters and Galactic Engines. |
| `E10` | Absolute Entropic Death | `10.00 Septenquadragintillion` RP | `96h` | Energy-class generators receive `10x` point generation. |

### Reality Branch (R1–R10)

| ID | Name | Cost | Base Time | Effect |
| :--- | :--- | :--- | :--- | :--- |
| `R1` | Spatial Compactness | `800` RP | `15s` | Reduces the first purchase cost of Server Clusters and Quantum Computers by `15%`. |
| `R2` | Sub-Space Tunneling | `40.00K` RP | `3m` | Research study durations permanently reduced by `15%`. |
| `R3` | Metric Manipulation | `9.10 Quintillion` RP | `1h` | Allows two simultaneous research projects from different branches. |
| `R4` | Localized Chronology Erasers | `5.00 Quindecillion` RP | `3h` | Research timers run `2x` faster while any anomaly is active. |
| `R5` | Dimensional Permeability | `13.00 Duovigintillion` RP | `6h` | Persists across Tier I prestiges and grants `1.10x` RP output to all generators. |
| `R6` | Matter-Data Coexistence | `660.00 Novemvigintillion` RP | `12h` | `+1%` global generator RP per generator unit currently owned. |
| `R7` | Anthropic Fine-Tuning | `8.00 Septentrigintillion` RP | `24h` | Persists across Tier I prestiges; Reality Engines produce `10x` RP for `5m` after prestige. |
| `R8` | Timeline Collapse Protocol | `330.00 Unquadragintillion` RP | `48h` | Amplifies prestige currency exponentially based on proximity to Trequinquagintillion. |
| `R9` | Multi-Dimensional Manifold | `10.00 Duoquadragintillion` RP | `48h` | Increases max offline progression from `12h` to `24h`. |
| `R10` | Timeline Collapser Core | `10.00 Septenquadragintillion` RP | `96h` | `+0.5` to master global production exponent. |

### Arkalon Branch (O1–O10)

| ID | Name | Cost | Base Time | Effect |
| :--- | :--- | :--- | :--- | :--- |
| `O1` | Synaptic Resonance | `2.00K` RP | `30s` | Unlocks Arkalon telemetry, Relic tab, and awards Relic 1. |
| `O2` | Sub-Vocal Telemetry | `100.00K` RP | `5m` | Reduces Arkalon Branch research study times by `10%`. |
| `O3` | Predictive Synchronization | `2.00 Sextillion` RP | `1h 30m` | Arkalon predicts anomaly arrivals with a live countdown timer. |
| `O4` | Forbidden Protocol Theta | `88.00 Sexdecillion` RP | `3h` | Arkalon Interface base yield increased by `300%` (`4x`). |
| `O5` | Synapse Replication | `410.00 Trevigintillion` RP | `6h` | Reduces all generator RP costs by `0.01%` per Arkalon Interface owned (max `90%`). |
| `O6` | Non-Causal Intercepts | `3.90 Untrigintillion` RP | `12h` | Bypass one missing prerequisite tech choice per reset run. |
| `O7` | Trans-Reality Synthesis | `50.00 Octotrigintillion` RP | `24h` | `+1%` Arkalon Resonance effectiveness per prestige completed. |
| `O8` | Dimensional Convergence | `10.00 Unquadragintillion` RP | `48h` | `+0.5%` RP output to all generators per completed research node. |
| `O9` | Omega Mind Mirror | `10.00 Duoquadragintillion` RP | `48h` | Arkalon Interface base output multiplied by `5.0x`. |
| `O10` | Arkalon Synchronicity Matrix | `100.00 Quinquagintillion` RP | `192h` (`8d`) | All branch multipliers apply to all generator classes. Ultimate convergence node. |

### Infinite Nodes

Unlocked per branch upon completing **Tier 8** (`C8`, `E8`, `R8`, `O8`). Infinite nodes complete instantly with `+1`, `+10`, and `MAX` manual bulk purchasing, and persist across Tier I prestiges (reset on Tier II).

| ID | Name | Base Cost | Scaling | Effect per Level |
| :--- | :--- | :--- | :--- | :--- |
| `C_INF` | Infinite Computational Throughput | `100.00 Quintillion` (`10²⁰`) | `1.5x` | `+10%` compounding calculation efficiency (Computation-class). |
| `E_INF` | Infinite Vacuum Extraction | `500.00 Quintillion` (`5×10²⁰`) | `1.6x` | `+8%` compounding energy output (Energy-class). |
| `R_INF` | Infinite Space-Time Dilation | `2.50 Sextillion` (`2.5×10²¹`) | `1.7x` | `-1%` research study durations multiplicatively (hard-capped at `95%` / Lv299; scales active timers immediately). |
| `O_INF` | Infinite Synaptic Expansion | `10.00 Sextillion` (`10²²`) | `1.8x` | `+5%` Arkalon Resonance multiplier strength. |

---

## 🔄 Nested Prestige Loops

### Tier I — Reality Recalibration (AR)

- **Unlock Gate:** `1.00 Billion` (`10⁹`) lifetime RP.
- **Gain Formula:** `floor(5 * sqrt(lifetimeRP / 10^9))`, softcapped (`^0.25` in log-space) above `500,000 AR`, further scaled by *Void Compass* (Relic 9), CF *Resonance Amplification* (`1.5 * max(1, CF)`), `EC3` (`+25%`), `prestige_50` (`+10%`), and `R8` proximity (capped at `2,000,000,000`).
- **Passive Multiplier:** Counted AR (unspent + spent AR, floored by `Resonance Memory`, up to a `500` base cap raised by `Harmonic Resonance Cap`) grants `+10%` RP per unit (expandable via `Super-Symmetry`, `E5`, `O7`, and `O_INF`).
- **Resets:** RP, generator quantities, unretained research nodes, active timers, and megaproject progress.
- **Retains:** Generator module levels, Synthesizers, AR upgrades, relics & Dust, achievements, Anomalous Operations, `R5`/`R7`, up to 3 Tier-4 nodes (*Quantum Memory*), and Tier 1–2 auto-completion (*Arkalon Matrix Mirror*).

### Tier II — Timeline Severance (CF)

- **Unlock Gate:** **Chronos Array** megaproject complete + `10³⁵` (`100.00 Decillion`) lifetime RP.
- **Gain Formula:** `floor(10 * ((lifetimeRP / 10^35) ^ 0.2) * R8)` (capped at `2,000,000,000`).
- **Resets:** Everything from Tier I plus unspent AR balance, Synthesizers, all completed/infinite research (unless auto-studied by *Matrix Mirror*), and active relic sockets (emptied, keeping all unlocked relics & levels).
- **Retains:** AR & CF upgrades, permanent **Resonance Memory** AR floor (preserving pre-reset counted AR), completed megaprojects, unlocked relics/levels/presets/Dust, achievements, Operations, and Omni-Spars.

### Tier III — Singular Synthesis (OS)

- **Unlock Gate:** **Omega Singularity Sphere** megaproject complete + `10⁸⁵` (`10.00 Septenvigintillion`) lifetime RP.
- **Gain Formula:** `floor(10 * ((lifetimeRP / 10^85) ^ 0.1) * R8)` (capped at `2,000,000,000`).
- **Resets:** Everything from Tier II plus Chronal Fracture balance and economic AR/CF upgrades (including `Deep Research Slots`).
- **Retains:** Omni-Spar upgrades, QoL automation upgrades (`Bulk Procurement`, `Auto-Buy (Basic)`, `Auto-Research Queue`, `Auto-Module Buyer`, `Auto-Buy Synthesizers`, `Auto-Upgrade Relics`), Resonance Memory floor, completed megaprojects, relics/Dust, Operations, and achievements.

---

## 🛒 Prestige Upgrade Shops

*(Standard multi-level upgrades scale linearly as `baseCost * (level + 1)` unless noted with exponential `costScaling`; all prestige upgrades are suspended during `AC2` and `EC1`.)*

### Arkalon Resonance Upgrades (16)

| Upgrade | Base Cost & Scaling | Max Lv | Effect |
| :--- | :--- | :--- | :--- |
| Generator Priming | `2 AR` (`1.6x` exp) | `30` | `1.35x` compounding output to all generators per level. |
| Neural Pipeline | `6 AR` (linear) | `5` | `+10%` anomaly spawn frequency per level (`0.9^lv` interval). |
| Chronal Anchor | `10 AR` | `1` | Start post-prestige with `1s` of prior run's peak RP/s as flat RP. |
| Research Accelerant | `10 AR` (linear) | `10` | `-3%` research study time per level (multiplicative). |
| Dimensional Blueprinting | `15 AR` | `1` | Start each Tier I prestige with `5` free units of Generators 1–3. |
| Anomaly Extender | `15 AR` (linear) | `5` | `+5s` to all anomaly durations per level. |
| Relic Resonance | `20 AR` (linear) | `10` | `+5%` to all equipped relic effects per level. |
| Milestone Sharpener | `25 AR` (linear) | `5` | Quantity milestones trigger `1` unit earlier per level (floor `10`). |
| Auto-Buy (Basic) | `75 AR` | `1` | Automatically buys `1` unit of the cheapest affordable generator every `5s`. |
| Auto-Research Queue | `100 AR` | `1` | Unlocks Study Queue, Smart Sort Presets, and auto-starts queued nodes. |
| Super-Symmetry | `150 AR` | `1` | `+10%` global production per counted AR (follows Harmonic Cap). |
| Challenge Accelerant | `250 AR` | `1` | Challenge RP targets reduced by `25%`. |
| Quantum Overdrive | `500 AR` (`2.0x` exp) | `20` | Doubles (`2x`) global RP production per level. |
| Harmonic Resonance Cap | `1,500 AR` (`3.0x` exp) | `10` | Raises passive AR bonus cap by `+500 AR` per level (up to `5,500 AR`). |
| Resonance Compression | `25,000 AR` (`5.0x` exp) | `5` | `+0.02` to global production exponent per level. |
| Bulk Procurement | `500,000 AR` | `1` | Unlocks `MAX ALL (M)` equipment sweep and `Upgrade All` modules button. |

### Chronal Fracture Upgrades (10)

| Upgrade | Base Cost | Max Lv | Effect |
| :--- | :--- | :--- | :--- |
| Temporal Compression | `10 CF` | `1` | All research timers `-25%` permanently. |
| Resonance Amplification | `15 CF` | `1` | Future AR yields multiplied by `1.5 * CF` held (min `1.5x`). |
| Auto-Buy Synthesizers | `20 CF` | `1` | Automatically buys the cheapest affordable unlocked Synthesizer every `5s`. |
| Generator Transcendence | `20 CF` (linear) | `5` | `+5%` base output to generators Tier 6+ per level. |
| Quantum Memory | `25 CF` | `1` | Retain up to `3` Tier-4 research nodes across Tier I prestiges. |
| Relic Preservation | `30 CF` | `1` | Relic swap cooldown removed (instant swaps). |
| Auto-Upgrade Relics | `35 CF` | `1` | Automatically upgrades unlocked Relics with Dust up to your target level cap. |
| Megaproject Efficiency | `35 CF` (linear) | `3` | Megaproject construction costs `-10%` per level (up to `-30%`). |
| Deep Research Slots | `40 CF` | `1` | Unlocks 3rd parallel research slot (requires distinct branch from both). |
| Auto-Module Buyer | `50 CF` | `1` | Automatically purchases affordable module upgrades every `1s`. |

### Omni-Spar Upgrades (6)

| Upgrade | Base Cost | Max Lv | Effect |
| :--- | :--- | :--- | :--- |
| Dimensional Transcendence | `5 OS` | `1` | Reduces cost growth factors by `0.05` across all generators (floor `1.01`). |
| The Automated Lab | `8 OS` | `1` | Unlocks Smart Auto-Prestige for Tier I prestiges. |
| Exponential Catalyst | `10 OS` | `1` | `+0.15 + 0.08 * log10(1 + total OS earned)` to production exponent (max `+0.75`). |
| Auto-Dyson Swarm | `12 OS` | `1` | Automatically initiates and maintains Arkalon Dyson Swarm construction. |
| Automated Timeline Severance | `20 OS` | `1` | Auto-executes Tier II prestiges (requires *The Automated Lab*). |
| Automated Singular Synthesis | `30 OS` | `1` | Auto-executes Tier III prestiges (requires *Automated Timeline Severance*). |

---

## 🤖 Automation Suite & Smart Auto-Prestige

### 12 Toggleable Systems

| Feature | Interval | Unlock Source | Behavior |
| :--- | :--- | :--- | :--- |
| Auto-Buy (Basic) | `5s` | AR `Auto-Buy (Basic)` | Buys cheapest affordable generator. |
| Auto-Buy (Optimal) | `2s` | `SC6` Tier 3 | Buys generator with highest marginal PPS/RP within configurable RP reserve (`0–90%`). |
| Auto-Buy Synthesizers | `5s` | CF `Auto-Buy Synthesizers` | Buys cheapest affordable unlocked Synthesizer. |
| Auto-Research Queue | `1s` | AR `Auto-Research Queue` | Auto-starts next branch-compatible queued node when a slot opens. |
| Auto-Module Buyer | `1s` | CF `Auto-Module Buyer` | Buys cheapest affordable module upgrade below cap. |
| Auto-Equip Relic | `1s` | Complete `AC6` | Equips highest-level unequipped relic into open slots. |
| Auto-Upgrade Relics | `1s` | CF `Auto-Upgrade Relics` | Upgrades cheapest relic below target cap (`1–100`) respecting Dust reserve. |
| Auto-Launch Probe | `1s` | `SC12` Tier 3 | Launches idle probes to your selected sector while preserving equipped subsystem. |
| Auto-Dyson Swarm | `1s` | OS `Auto-Dyson Swarm` | Activates Arkalon Dyson Swarm whenever megaproject bay is idle. |
| Auto-Prestige Tier I | `1s` | OS `The Automated Lab` | Executes calibrated Tier I prestige after 15s minimum run duration. |
| Auto-Prestige Tier II | `1s` | OS `Automated Timeline Severance` | Executes Tier II prestige when `Target CF` is met (optional hold for Tier III). |
| Auto-Prestige Tier III | `1s` | OS `Automated Singular Synthesis` | Executes Tier III prestige when `Target OS` is met. |

### Smart Auto-Prestige Calibration

- **Three Tier-I Trigger Modes:**
  - `Fixed AR`: Triggers when projected AR gain meets your target floor.
  - `Multiplier`: Triggers when projected AR exceeds `ratio * max(currentAR, floor(resonanceMemoryAR * 0.25))` (default `2x`).
  - `PPS Stall`: Triggers after `45s` of run time when RP/s growth stalls (`≤1%` gain across a `15s` window).
- **Safety Guards:** Active one-time Megaprojects always pause auto-prestige (with an optional Dyson Swarm hold toggle that auto-bypasses when `Auto-Dyson Swarm` is active), active anomalies receive a `10s` grace window before resetting, and every trigger opens a `3s` cancelable countdown banner.