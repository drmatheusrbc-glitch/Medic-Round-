export interface PatientVitals {
  fcMin: number | '';
  fcMax: number | '';
  frMin: number | '';
  frMax: number | '';
  pasMin: number | '';
  pasMax: number | '';
  padMin: number | '';
  padMax: number | '';
  tempMin: number | '';
  tempMax: number | '';
  satMin: number | '';
  satMax: number | '';
}

export interface PatientHydration {
  entries: number | '';
  diuresis: number | '';
  otherSaidas: number | '';
}

export interface PatientProphylaxis {
  tvp: boolean;
  ulcer: boolean;
  eyeDrop: boolean;
}

export type DietType = 'VO' | 'Enteral' | 'Parenteral' | 'Jejum';

export interface PatientRound {
  id: string;
  name: string;
  age: number | '';
  bed: string;
  vitals: PatientVitals;
  hydration: PatientHydration;
  dietType: DietType;
  dietObs: string;
  evacuated: boolean;
  prophylaxis: PatientProphylaxis;
  occurrences: string;
  createdAt: string;
}

export type VentMode = 'VCV' | 'PCV' | 'PSV';

export interface MechanicalVentState {
  id: string;
  patientName: string;
  gender: 'M' | 'F';
  weight: number | '';
  height: number | '';
  paO2: number | '';
  mode: VentMode;
  
  // VCV fields
  vcv_volume: number | '';
  vcv_flow: number | '';
  vcv_fr: number | '';
  vcv_ie: string;
  vcv_peep: number | '';
  vcv_fio2: number | '';
  vcv_pPeak: number | '';
  vcv_pPlateau: number | '';
  vcv_autoPeep: number | '';

  // PCV fields
  pcv_deltaP: number | '';
  pcv_fr: number | '';
  pcv_tInsp: number | '';
  pcv_ramp: number | '';
  pcv_fio2: number | '';
  pcv_peep: number | '';
  pcv_pPeak: number | '';
  pcv_pPlateau: number | '';
  pcv_autoPeep: number | '';

  // PSV fields
  psv_support: number | '';
  psv_ramp: number | '';
  psv_cycling: number | '';
  psv_fio2: number | '';
  psv_peep: number | '';
  psv_frTotal?: number | ''; // input for Tobin index calculation if needed
  psv_volumeExpired?: number | ''; // VTe for Tobin index calculation
}

// Medical Scores state types
export interface ScoreState {
  currentScore: string; // 'saps3' | 'sofa' | 'rass' | 'camicu' | 'gcs' | 'bps' | 'cpot' | 'berlin' | 'pesi' | 'spesi'
}
