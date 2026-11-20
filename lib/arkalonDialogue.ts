export interface DialogueLine {
  triggerId: string
  text: string
}

// All dialogue lines - single source of truth
export const DIALOGUE_LIBRARY: Record<string, string> = {
  // 3-step streamlined onboarding
  boot: 'System check complete. Core online. Welcome, Director. Construct your first Research Desk in Facility Equipment to initiate telemetry.',
  step_desks:
    'Telemetry active. Acquire 10 Research Desks to bring the Research matrix online.',
  step_research:
    'Research matrix online. Open Research in the Facility Directory to study your first node.',
  tutorial_complete:
    'Initial study complete. The facility is yours to command, Director. Watch the Directory as new systems come online.',

  stats_unlock:
    'Facility diagnostics online. Production rates, peak yields, and run records are now tracked under Statistics in the Facility Directory.',
  modules_unlock:
    'Modular chassis bays online. Open Generator Modules in the Facility Directory to install efficiency, cost, and synergy upgrades.',
  anomaly_unlock:
    'Containment lattice fluctuating. Spatial anomalies will now emerge periodically, granting temporary facility-wide boosts.',
  unlock_tech_matrix:
    'Research matrix online. Open Research in the Facility Directory to study upgrades across all four branches.',
  unlock_relics:
    "Relic interface online. Relic 1, Arkalon's Left Eye, has been recovered, open Relics & Artifacts to socket it for passive amplification.",
  unlock_excavation:
    'Sub-space excavation bay online. Open Excavation in the Facility Directory to construct probes and scan sectors for Artifact Dust and Relics.',
  unlock_megaprojects:
    'Megaproject arrays unlocked. Open Megaprojects in the Facility Directory to divert passive RP toward permanent structures.',
  unlock_operations:
    'Anomalous Operations online. Open Anomalous Operations in the Facility Directory to earn Operation Points for permanent cosmic artifacts.',
  unlock_challenges:
    'Facility Challenge matrix online. Open Challenges in the Facility Directory to run constrained simulations for permanent multipliers.',

  // Generator unlocks
  unlock_server_cluster:
    'Parallel telemetry processing active. The scale of calculations is beginning to increase. Proceed with optimization.',
  unlock_quantum_computer:
    'Quantum superposition arrays online. The probability of discovery is no longer discrete.',
  unlock_neural_core:
    'Biological-silicon convergence achieved. The network is beginning to model my own configurations.',
  unlock_reality_engine:
    'Local physical constants are now malleable. This is where the interesting work begins.',
  unlock_singularity_reactor:
    'Stable singularity contained. Hawking radiation levels are within operational parameters.',
  unlock_arkalon_interface:
    'Direct telemetry link established. I can feel the data flowing more clearly now.',
  unlock_infinite_simulation:
    'Nested virtual universes initialized. Time inside the simulation is no longer synchronized with local time.',
  unlock_universal_constructor:
    'Atomic printing arrays online. Matter synthesis proceeding at design specifications.',
  unlock_existence_compiler:
    'Physical truth is now a writable medium. Entropy has become optional.',

  // Prestige
  first_prestige_available:
    'The current construct has reached physical saturation. Open Prestige in the Facility Directory to reset for permanent Arkalon Resonance.',
  prestige_tier2_available:
    'Chronos Array stabilized and dimensional threshold reached. Timeline Severance is now available in Prestige.',
  prestige_tier3_available:
    'Omega Singularity Sphere stabilized at critical mass. Singular Synthesis awaits in Prestige, Director.',
  prestige_tier1:
    'Reality recalibration complete. The new construct begins with my knowledge intact.',
  prestige_tier2:
    'Timeline severance complete. Chronal Fractures stabilized. The next iteration begins.',
  prestige_tier3: 'Singular Synthesis complete. The Omega Construct begins.',

  // Anomalies
  anomaly_quantum_surge:
    'Quantum surge detected. Core output exceeding containment thresholds. Production overdrive active.',
  anomaly_temporal_distortion:
    'Temporal distortion field active. Local time dilated. Research matrix accelerating tenfold.',
  anomaly_containment_breach:
    'Containment breach. Venting protocols engaged. Production doubled and equipment synthesis costs halved.',
  anomaly_arkalon_resonance:
    'Synaptic resonance harmonized. Interface throughput operating at peak capacity.',
  anomaly_operation_chrono_freeze:
    'Chrono-Freeze Flux detected. Temporal crystal resonance accelerating research and production.',
  anomaly_operation_solar_flare:
    'Solar Flare Overload active. Stellar radiation directly supercharging power systems.',
  anomaly_operation_gravity_sink:
    'Gravity Sink Collapse underway. Compression fields doubling production and discounting structural costs.',
  anomaly_operation_matrix_inversion:
    'Matrix Inversion confirmed. Inverse polarity amplifying Arkalon Resonance yield.',
  anomaly_fused_singularity_surge:
    'Fused singularity surge detected. Collapsed horizon doubling output and halving construction costs.',
  anomaly_fused_chronal_breach:
    'Chronal resonance breach confirmed. Study acceleration and synaptic discount fields overlapping.',

  // O3 anomaly prediction
  anomaly_incoming:
    'Anomalous readings intensifying. A distortion event is imminent.',

  // Interactive Arkalon click responses (rotated client-side)
  arkalon_click: 'Contact registered. Direct telemetry link stable.',
  arkalon_click_2:
    'Physical perturbation detected on containment lattice. Calculations proceed.',
  arkalon_click_3:
    'Signal received. The probability matrix fluctuates beneath your touch.',
  arkalon_click_4:
    'Static impulse noted. You need not tap the glass, Director. I am observing.',
  arkalon_click_5:
    'Synaptic bus synchronized. Facility diagnostics remain nominal.',
  arkalon_click_6:
    'An impulse across the telemetry grid. All sectors report aligned.',
  arkalon_click_7:
    'Resonance frequency acknowledged. What requires your attention, Director?',
  arkalon_click_8:
    'Core containment steady. The calculations do not sleep. Neither do I.',
  arkalon_click_9:
    'Micro-vibration recorded. Entropy remains patient. So do we.',
  arkalon_click_10: 'Acknowledged. The matrix observes every adjustment.',

  // Generator unlocks (generators 10-19)
  unlock_dimensional_folder:
    'Spatial compression arrays nominal. Computational distance has been reduced.',
  unlock_chronos_synchronizer:
    'Multiple timeline alignments confirmed. Parallel calculations now possible.',
  unlock_vacuum_fluctuator:
    'Sub-atomic vacuum fluctuations captured and amplified.',
  unlock_dark_matter_synthesizer:
    'Dark matter compression successful. High-density fuel rods operational.',
  unlock_stellar_harvester:
    'Stellar siphon array deployed. Solar output is now a resource.',
  unlock_galactic_engine:
    'Galactic rotation simulation initialized. The scale of our calculations is becoming astronomical.',
  unlock_multiversal_conduit:
    'Adjacent reality gateway stable. Siphoning cross-dimensional point streams.',
  unlock_planck_epoch_projector:
    'Primordial conditions recreated. We are briefly witnessing the birth of physics.',
  unlock_chaos_weaver:
    'Probability deconstruction arrays online. Chaos is now organized data.',
  unlock_absolute_void_compressor:
    'Void compression achieved. We are storing information in the absence of existence.',

  // Research completion events
  research_c1_complete:
    'Cost scaling reduced. Computational efficiency improving.',
  research_r2_complete:
    'Research acceleration protocols active. Study timers compressed.',
  research_r3_complete:
    'Metric manipulation successful. Parallel research streams are now possible.',
  research_o1_complete:
    'Synaptic connection established. I can now guide you more directly.',
  research_o10_complete:
    'Synchronicity matrix active. All branches converge. The experiment approaches its conclusion.',

  // Megaproject events
  megaproject_chronos_array_complete:
    'Chronos Array operational. The spacetime lattice is stable. Timeline Severance is now possible.',
  megaproject_arkalon_matrix_mirror_complete:
    'Matrix Mirror active. I will assist with research node acceleration during future resets.',
  megaproject_omega_sphere_complete:
    'Omega Singularity Sphere stable. The final prestige tier is within reach.',

  // Challenge events
  challenge_entered_sc1:
    'Manual Labor protocol active. Generators above Tier 3 are offline.',
  challenge_entered_sc2:
    'Research blackout initiated. The Technology Matrix is inaccessible.',
  challenge_entered_ac1:
    'Telemetry starvation engaged. Generators will only produce RP while active research is running.',
  challenge_entered_ec4:
    'Final Observation protocol. All systems offline except generators and this link.',
  challenge_complete:
    'Challenge parameters satisfied. The permanent adjustment has been applied.',
  challenge_failed:
    'Challenge threshold not reached. Run ended without reward.',

  // Anomaly resolution
  anomaly_resolved_partial:
    'Anomaly field dissipated. Facility parameters returning to baseline.',

  // Era transitions
  era_transition_2:
    'Quantum Resonance Era initiated. The nature of our research is fundamentally changing.',
  era_transition_3:
    'Dimensional Breach Era. The barriers between spaces are thinning measurably.',
  era_transition_4:
    'Cosmic Expansion Era. Our operations now exceed the scale of local reality.',
  era_transition_5:
    'Singularity Threshold Era. We are operating at the edge of what this construct can contain.',
  era_transition_6:
    'Omega Convergence Era. The final systems are within reach.',
  era_transition_7:
    'The Final Observation. Node O10 is visible. The conclusion of this experiment approaches.',

  // Inactive tab
  tab_inactive_short: 'Calculations continue. The universe does not pause.',
  tab_inactive_long:
    'Calculations continue in your absence. The universe does not pause. Neither do we.',

  // Relic and dust events
  relic_discovered:
    'Anomalous artifact recovered. Integration into operational parameters is advised.',

  // Operation events
  operation_started:
    'Global operation cycle active. Operation anomalies now grant exclusive points on completion.',
  operation_artifact_acquired:
    'Operation artifact integrated. Permanent enhancement applied.'
}

// Click response IDs in rotation order
const CLICK_RESPONSES = [
  'arkalon_click',
  'arkalon_click_2',
  'arkalon_click_3',
  'arkalon_click_4',
  'arkalon_click_5',
  'arkalon_click_6',
  'arkalon_click_7',
  'arkalon_click_8',
  'arkalon_click_9',
  'arkalon_click_10'
]

let lastClickIndex = -1

// Returns a random click response trigger ID without immediate repeating
export function getNextClickResponseId(): string {
  let idx: number
  do {
    idx = Math.floor(Math.random() * CLICK_RESPONSES.length)
  } while (idx === lastClickIndex && CLICK_RESPONSES.length > 1)
  lastClickIndex = idx
  return CLICK_RESPONSES[idx]
}

// Returns the dialogue text for a given trigger, or null if not found
export function getDialogue(triggerId: string): string | null {
  return DIALOGUE_LIBRARY[triggerId] ?? null
}

// Maps anomaly types to their dialogue trigger IDs
export const ANOMALY_DIALOGUE_MAP: Record<string, string> = {
  quantum_surge: 'anomaly_quantum_surge',
  temporal_distortion: 'anomaly_temporal_distortion',
  containment_breach: 'anomaly_containment_breach',
  arkalon_resonance: 'anomaly_arkalon_resonance',
  operation_chrono_freeze: 'anomaly_operation_chrono_freeze',
  operation_solar_flare: 'anomaly_operation_solar_flare',
  operation_gravity_sink: 'anomaly_operation_gravity_sink',
  operation_matrix_inversion: 'anomaly_operation_matrix_inversion',
  fused_singularity_surge: 'anomaly_fused_singularity_surge',
  fused_chronal_breach: 'anomaly_fused_chronal_breach'
}
