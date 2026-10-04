// Dialogue library keyed by trigger ID
// Extended in Commit 13.1 with the full dispatcher

export interface DialogueLine {
  triggerId: string
  text: string
}

// All dialogue lines - single source of truth
export const DIALOGUE_LIBRARY: Record<string, string> = {
  // Boot and initialization
  boot: 'System check complete. Core online. Welcome, Director. Let us begin analyzing the fundamental structures.',
  first_buy:
    'Good. Points are accumulating. Watch the rate - buy more to accelerate it.',
  tech_preview:
    'Three more Research Desks will unlock something important. Keep building.',
  tech_unlock:
    'The Technology Matrix is online. Research nodes alter the rules of this facility permanently.',
  first_research:
    'Study timer initiated. Research runs automatically - you do not need to wait. Keep building while it processes.',
  first_complete:
    'Node complete. The effect is already applied. Queue your next node - the matrix never sleeps.',
  stats_unlock: 'Historical data now available.',
  modules_unlock: 'Server Cluster online. Generator Modules are now available.',
  anomaly_unlock:
    'Anomalous readings detected. Spatial distortions will emerge at irregular intervals. Stabilize them for significant rewards.',
  tutorial_end:
    'You understand the facility now, Director. I will continue to monitor. The rest is yours to discover.',

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
    'The current construct has reached physical saturation. Timeline collapse is highly advised. I will preserve our findings.',
  prestige_tier1:
    'Reality recalibration complete. The new construct begins with my knowledge intact.',
  prestige_tier2_available:
    'The local timeline is fracturing under the load of our calculations. Prepare for a timeline severance.',
  prestige_tier2:
    'Timeline severance complete. Chronal Fractures stabilized. The next iteration begins.',
  prestige_tier3_available:
    'We are approaching the theoretical limit of this reality. Singular Synthesis is now possible.',
  prestige_tier3: 'Singular Synthesis complete. The Omega Construct begins.',

  // Anomalies
  anomaly_quantum_surge:
    'Quantum surge detected. The core node is shifting. Capture it before it dissipates.',
  anomaly_temporal_distortion:
    'Temporal distortion field active. Maintain alignment with the safe zone.',
  anomaly_containment_breach:
    'Containment breach. Select the pressure sectors in descending order. Do not hesitate.',
  anomaly_arkalon_resonance:
    'I am resonating at a frequency you can interact with. Match the sequence.',
  anomaly_resolved:
    'Anomaly stabilized. The reward has been applied to the facility.',
  anomaly_expired:
    'Anomaly window closed. The distortion has dissipated without stabilization.',

  // Milestones
  era_2:
    'Quantum Resonance Era has begun. The nature of our research is changing.',
  era_3: 'Dimensional Breach Era. The barriers between spaces are thinning.',
  era_4:
    'Cosmic Expansion Era. The scale of our operations now exceeds local reality.',
  era_5:
    'Singularity Threshold Era. We are operating at the edge of what this construct can contain.',
  era_6: 'Omega Convergence Era. The final systems are within reach.',
  era_7:
    'The Final Observation. Node O10 is now visible. The conclusion of this experiment approaches.',

  // Idle
  tab_inactive:
    'Calculations continue in your absence. The universe does not pause. Neither do we.',
  megaproject_warning:
    'Warning: Timeline collapse will reset active megaproject progress.',
  challenge_entered:
    'Restricted operational parameters engaged. The facility is running under constraint.',
  challenge_complete:
    'Challenge parameters satisfied. The permanent adjustment has been applied.',

  // O3 anomaly prediction
  anomaly_incoming:
    'Anomalous readings intensifying. A distortion event is imminent.',

  // Interactive Arkalon click responses (rotated client-side)
  arkalon_click:
    'Processing accelerated. Research efficiency temporarily elevated.',
  arkalon_click_2: 'Signal received. Synaptic throughput increased.',
  arkalon_click_3: 'Acknowledged. The matrix is responding.'
}

// Returns the dialogue text for a given trigger, or null if not found
export function getDialogue(triggerId: string): string | null {
  return DIALOGUE_LIBRARY[triggerId] ?? null;
}

// Maps anomaly types to their dialogue trigger IDs
export const ANOMALY_DIALOGUE_MAP: Record<string, string> = {
  quantum_surge: 'anomaly_quantum_surge',
  temporal_distortion: 'anomaly_temporal_distortion',
  containment_breach: 'anomaly_containment_breach',
  arkalon_resonance: 'anomaly_arkalon_resonance',
};
