import React, { useState } from 'react';
import { 
  Activity, 
  Brain, 
  Flame, 
  AlertOctagon, 
  Wind, 
  FileCheck, 
  Menu, 
  ChevronRight,
  ShieldAlert,
  Info,
  Sparkles,
  ClipboardList
} from 'lucide-react';

type ScoreType = 'saps3' | 'sofa' | 'rass' | 'camicu' | 'gcs' | 'bps' | 'cpot' | 'berlin' | 'pesi' | 'spesi';

export default function ScoresTab() {
  const [activeScore, setActiveScore] = useState<ScoreType>('gcs');

  // --- GLASGOW COMA SCALE STATE ---
  const [gcsEye, setGcsEye] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);
  const [gcsPupils, setGcsPupils] = useState(0); // pupils reactions: 0=normal, 1=one reactive, 2=none reactive

  // --- RASS STATE ---
  const [rassVal, setRassVal] = useState(0);

  // --- CAM-ICU STATE ---
  const [camStep1, setCamStep1] = useState<boolean>(false); // fluctuating course
  const [camStep2, setCamStep2] = useState<boolean>(false); // inattention
  const [camStep3, setCamStep3] = useState<boolean>(false); // disorganized thinking
  const [camStep4, setCamStep4] = useState<boolean>(false); // altered level of consciousness (RASS !== 0)

  // --- SOFA STATE ---
  const [sofaResp, setSofaResp] = useState(0);
  const [sofaCoag, setSofaCoag] = useState(0);
  const [sofaLiver, setSofaLiver] = useState(0);
  const [sofaCardio, setSofaCardio] = useState(0);
  const [sofaCns, setSofaCns] = useState(0);
  const [sofaRenal, setSofaRenal] = useState(0);

  // --- SAPS 3 STATES ---
  const [sapsAge, setSapsAge] = useState(0); // points
  const [sapsSex, setSapsSex] = useState(0);
  const [sapsComorb, setSapsComorb] = useState(0);
  const [sapsAdmission, setSapsAdmission] = useState(0);
  const [sapsOrigin, setSapsOrigin] = useState(0);
  const [sapsGcs, setSapsGcs] = useState(0);
  const [sapsBili, setSapsBili] = useState(0);
  const [sapsCreat, setSapsCreat] = useState(0);
  const [sapsPlat, setSapsPlat] = useState(0);
  const [sapspH, setSapspH] = useState(0);
  const [sapsHr, setSapsHr] = useState(0);

  // --- BPS STATE ---
  const [bpsFacial, setBpsFacial] = useState(1);
  const [bpsLimbs, setBpsLimbs] = useState(1);
  const [bpsVent, setBpsVent] = useState(1);

  // --- CPOT STATE ---
  const [cpotFacial, setCpotFacial] = useState(0);
  const [cpotMove, setCpotMove] = useState(0);
  const [cpotTension, setCpotTension] = useState(0);
  const [cpotVent, setCpotVent] = useState(0);

  // --- BERLIN CRITERIA SARA ---
  const [berlin1, setBerlin1] = useState(false); // Time (1 week)
  const [berlin2, setBerlin2] = useState(false); // Imaging (Bilateral opacities)
  const [berlin3, setBerlin3] = useState(false); // Edema origin (not fully explained)
  const [berlinPEEP, setBerlinPEEP] = useState(true); // PEEP >= 5
  const [berlinPF, setBerlinPF] = useState<number>(250); // P/F ratio

  // --- PESI & sPESI STATES ---
  const [pesiAgeVal, setPesiAgeVal] = useState<number>(65);
  const [pesiMale, setPesiMale] = useState<boolean>(true);
  const [pesiCancer, setPesiCancer] = useState<boolean>(false);
  const [pesiHeartFailure, setPesiHeartFailure] = useState<boolean>(false);
  const [pesiCardiopulmonary, setPesiCardiopulmonary] = useState<boolean>(false); // sPESI specific
  const [pesiCOPD, setPesiCOPD] = useState<boolean>(false);
  const [pesiHR, setPesiHR] = useState<boolean>(false); // HR >= 110
  const [pesiSystolic, setPesiSystolic] = useState<boolean>(false); // SBP < 100
  const [pesiRR, setPesiRR] = useState<boolean>(false); // RR >= 30
  const [pesiTemp, setPesiTemp] = useState<boolean>(false); // Temp < 36
  const [pesiMental, setPesiMental] = useState<boolean>(false); // Alt status
  const [pesiSat, setPesiSat] = useState<boolean>(false); // Sat < 90

  // -------------------------------------------------------------
  // --- SCORES COMPUTATIONS & RENDERING PATTERNS ---

  // 1. GLASGOW COMA SCALE & GCS-P
  const computedGCS = () => {
    const coreVal = gcsEye + gcsVerbal + gcsMotor;
    const gcsP = Math.max(1, coreVal - gcsPupils);
    
    let label = 'TCE Leve';
    let labelColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200';
    if (gcsP <= 8) {
      label = 'TCE Grave (Critério para Via Aérea Avançada)';
      labelColor = 'text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 font-semibold';
    } else if (gcsP <= 12) {
      label = 'TCE Moderado';
      labelColor = 'text-amber-550 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-250';
    }
    return { gcsCore: coreVal, score: gcsP, label, labelColor };
  };

  // 2. SOFA Score
  const computedSOFA = () => {
    const total = sofaResp + sofaCoag + sofaLiver + sofaCardio + sofaCns + sofaRenal;
    let mortality = 'Interpretação: Baixa probabilidade de disfunção multiorgânica crítica.';
    let color = 'text-emerald-650';
    if (total >= 10) {
      mortality = 'Risco crítico: Mortalidade estimada hospitalar excedendo de 40 a 50%. Reavaliar suporte vasopressor e alveolar.';
      color = 'text-rose-600 font-bold';
    } else if (total >= 4) {
      mortality = 'Risco moderado: Presença de disfunção orgânica instalada (> 15% probabilidade de óbito).';
      color = 'text-amber-500';
    }
    return { total, mortality, color };
  };

  // 3. SAPS 3 Score
  const computedSAPS3 = () => {
    const total = sapsAge + sapsSex + sapsComorb + sapsAdmission + sapsOrigin + sapsGcs + sapsBili + sapsCreat + sapsPlat + sapspH + sapsHr;
    
    // Simple estimated logistic mortality for SAPS 3 based on standard sigmoid curves
    // Logit equation simplified for immediate clinical estimation
    const logit = -3.5 + (0.075 * total);
    const estMort = (Math.exp(logit) / (1 + Math.exp(logit))) * 100;
    
    return { total, estMort: estMort.toFixed(1) };
  };

  // 4. BPS
  const computedBPS = () => {
    const total = bpsFacial + bpsLimbs + bpsVent;
    const isPain = total >= 6;
    return { total, isPain };
  };

  // 5. CPOT
  const computedCPOT = () => {
    const total = cpotFacial + cpotMove + cpotTension + cpotVent;
    const isPain = total >= 3;
    return { total, isPain };
  };

  // 6. CAM-ICU
  const computedCAM = () => {
    // Delirium is PRESENT if: feature 1 AND feature 2 AND (feature 3 OR feature 4)
    // Here step1, step2, step3, step4 represent these clinical features respectively
    const isDelirium = camStep1 && camStep2 && (camStep3 || camStep4);
    return { isDelirium };
  };

  // 7. BERLIN CRITERIA SARA
  const computedBerlin = () => {
    const meetsAllCriteria = berlin1 && berlin2 && berlin3 && berlinPEEP;
    let severity = 'Não Conforme: Critérios não preenchidos integralmente para SARA ou oxigenação adequada.';
    let sevColor = 'text-slate-500';

    if (meetsAllCriteria) {
      if (berlinPF < 100) {
        severity = 'SARA GRAVE (Severe ARDS). Mortalidade estimada de ~ 45%. Requer PEEP elevada e estratégias de ventilação extrema.';
        sevColor = 'text-rose-600 dark:text-rose-450 font-black';
      } else if (berlinPF <= 200) {
        severity = 'SARA MODERADA (Moderate ARDS). Mortalidade estimada de ~ 32%.';
        sevColor = 'text-orange-500 dark:text-orange-400 font-bold';
      } else if (berlinPF <= 300) {
        severity = 'SARA LEVE (Mild ARDS). Mortalidade estimada de ~ 27%.';
        sevColor = 'text-amber-500 dark:text-amber-400 font-semibold';
      } else {
        meetsAllCriteria === false; // P/F > 300 is not ARDS
      }
    }
    return { meetsAllCriteria: meetsAllCriteria && berlinPF <= 300, severity, sevColor };
  };

  // 8. PESI & sPESI
  const computedPESI = () => {
    // PESI Calculation
    let scoreVal = pesiAgeVal + (pesiMale ? 10 : 0) + (pesiCancer ? 30 : 0) + (pesiHeartFailure ? 10 : 0) + (pesiCOPD ? 10 : 0) + (pesiHR ? 20 : 0) + (pesiSystolic ? 30 : 0) + (pesiRR ? 20 : 0) + (pesiTemp ? 20 : 0) + (pesiMental ? 60 : 0) + (pesiSat ? 20 : 0);
    
    let classification = 'Classe I (Muito Baixo Risco - óbito < 1.6%)';
    let clColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
    if (scoreVal > 125) {
      classification = 'Classe V (Muito Alto Risco - óbito até 24.5% em 30d)';
      clColor = 'text-rose-650 bg-rose-50 dark:bg-rose-950/20 font-bold';
    } else if (scoreVal >= 106) {
      classification = 'Classe IV (Alto Risco - óbito até 11.4%)';
      clColor = 'text-rose-500 bg-rose-50/50 dark:bg-rose-950/15';
    } else if (scoreVal >= 86) {
      classification = 'Classe III (Risco Moderado - óbito até 7.1%)';
      clColor = 'text-amber-550 bg-amber-50 dark:bg-amber-950/20';
    } else if (scoreVal >= 66) {
      classification = 'Classe II (Baixo Risco - óbito até 3.5%)';
      clColor = 'text-sky-600 bg-sky-50 dark:bg-sky-950/20';
    }

    // sPESI Calculation (Simplified PESI)
    // 1 pt each for: Age >80, Cancer, Cardiopulmonary disease (heart failure or COPD), HR >= 110, SBP < 100, Sat <90%
    let sScore = 0;
    if (pesiAgeVal > 80) sScore += 1;
    if (pesiCancer) sScore += 1;
    if (pesiHeartFailure || pesiCOPD || pesiCardiopulmonary) sScore += 1;
    if (pesiHR) sScore += 1;
    if (pesiSystolic) sScore += 1;
    if (pesiSat) sScore += 1;

    const sPESIHigh = sScore >= 1;

    return { pesiVal: scoreVal, classification, clColor, sScore, sPESIHigh };
  };

  const scoresList = [
    { id: 'gcs', name: 'Escala de Glasgow (neurológico)', icon: Brain, category: 'Neurológicos' },
    { id: 'rass', name: 'RASS (Sedação & Agitação)', icon: Activity, category: 'Sedação' },
    { id: 'camicu', name: 'CAM-ICU (Delirium)', icon: AlertOctagon, category: 'Sedação' },
    { id: 'sofa', name: 'SOFA 2.0 (Disfunção Orgânica)', icon: ClipboardList, category: 'Intensiva' },
    { id: 'saps3', name: 'SAPS 3 (Mortalidade prognóstica)', icon: FileCheck, category: 'Intensiva' },
    { id: 'bps', name: 'BPS (Escala de Dor Conduta)', icon: Flame, category: 'Dor' },
    { id: 'cpot', name: 'CPOT (Pain Evaluation)', icon: Flame, category: 'Dor' },
    { id: 'berlin', name: 'Critérios de Berlim (SARA)', icon: Wind, category: 'Respiratório' },
    { id: 'pesi', name: 'PESI & sPESI (Trombofilia/TEP)', icon: ShieldAlert, category: 'Tromboembolismo' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Escores Clínicos de Alta Acuidade
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Acesse escores revalidados de UTI, neurologia, sedação e dor com estratificação instantânea de risco.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar for mobile/desktop selection */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-805 p-3 rounded-xl lg:sticky lg:top-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider select-none">Filtro de Escores</span>
          <div className="space-y-1 block max-h-[460px] overflow-y-auto pr-1">
            {scoresList.map((sc) => {
              const IconComp = sc.icon;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScore(sc.id as ScoreType)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                    activeScore === sc.id 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{sc.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected score interactive calculator screen */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl p-6 shadow-sm space-y-6">
          
          {/* 1. GCS INTERACTIVE SCREEN */}
          {activeScore === 'gcs' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Escala de Coma de Glasgow com Reatividade Pupilar (GCS-P)
                </h3>
                <p className="text-xs text-slate-400">Classificação objetiva do nível de consciência, readequado para trauma (TCE).</p>
              </div>

              <div className="space-y-4">
                {/* Visual Eye segment */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-500 uppercase">Abertura Ocular (AO)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {[['4', 'Espontânea', 4], ['3', 'Estímulo de Voz', 3], ['2', 'Estímulo de Pressão', 2], ['1', 'Sem Resposta', 1]].map(([num, lbl, val]) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGcsEye(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${gcsEye === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'}`}
                      >
                        <span className="block text-sm font-black">{num}</span>
                        <span className="text-[10px] leading-tight block">{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verbal segment */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-500 uppercase">Resposta Verbal (RV)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                    {[['5', 'Orientada', 5], ['4', 'Confusa', 4], ['3', 'Palavras Inaprop.', 3], ['2', 'Sons Incompreens.', 2], ['1', 'Sem Resposta', 1]].map(([num, lbl, val]) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGcsVerbal(val as number)}
                        className={`p-1.5 text-xs font-semibold rounded-md border text-center transition-all ${gcsVerbal === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'}`}
                      >
                        <span className="block text-sm font-black">{num}</span>
                        <span className="text-[9px] leading-none block line-clamp-2">{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motor segment */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-500 uppercase">Resposta Motora (RM)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-2">
                    {[['6', 'Obedece Ordem', 6], ['5', 'Localiza Dor', 5], ['4', 'Flexão Normal', 4], ['3', 'Decorticação', 3], ['2', 'Descerebração', 2], ['1', 'Sem Resposta', 1]].map(([num, lbl, val]) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGcsMotor(val as number)}
                        className={`p-1 text-xs font-semibold rounded-md border text-center transition-all ${gcsMotor === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'}`}
                      >
                        <span className="block text-xs font-black">{num}</span>
                        <span className="text-[8px] leading-none block line-clamp-2">{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pupil Reactivity segment */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150 dark:border-slate-800/60">
                  <span className="text-xs font-bold text-slate-500 uppercase">Reatividade Pupilar (Subtração GCS-P)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {[['0', 'Ambas as pupilas reagem à luz', 0], ['-1', 'Apenas uma pupila reage', 1], ['-2', 'Nenhuma pupila reage', 2]].map(([num, lbl, val]) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGcsPupils(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-left flex justify-between items-center transition-all ${gcsPupils === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'}`}
                      >
                        <span className="text-xs select-none">{lbl}</span>
                        <span className="text-xs font-black bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-white px-2 py-0.5 rounded-sm">{num}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GCS Output Block */}
              <div className="p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-center bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-indigo-600 tracking-wider">Escore Integrado GCS-P</span>
                  <h4 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 mt-1">
                    {computedGCS().score} <span className="text-base font-normal">pontos ({computedGCS().gcsCore} {gcsPupils > 0 ? `-${gcsPupils} pupila` : ''})</span>
                  </h4>
                </div>
                <div className="mt-3 sm:mt-0 text-center sm:text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${computedGCS().labelColor}`}>
                    {computedGCS().label}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">GCS-P inclui o subtrator de reação fotomotora.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. RASS INTERACTIVE SCREEN */}
          {activeScore === 'rass' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  Escala de Sedação-Agitação de Richmond (RASS)
                </h3>
                <p className="text-xs text-slate-400">Classifica desde sedações críticas até estados de agitação combativa na UTI.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rass Negative values */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest block border-b border-sky-100 dark:border-sky-950/30 pb-1">Sedação</span>
                  {[
                    [-1, 'Sonolento', 'Acorda à voz, contato visual mantido por mais de 10s'],
                    [-2, 'Sedação Leve', 'Contato visual breve mantido por menos de 10s'],
                    [-3, 'Sedação Moderada', 'Movimento ou abertura ocular à voz, sem contato visual'],
                    [-4, 'Sedação Profunda', 'Sem resposta à voz. Responde apenas à estimulação física'],
                    [-5, 'Sedação Muito Profunda', 'Sem resposta à voz, dor ou estimulação física']
                  ].map(([val, name, desc]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRassVal(val as number)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${rassVal === val ? 'bg-sky-600 border-sky-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 dark:bg-slate-900 border-slate-150 dark:border-slate-800'}`}
                    >
                      <span className="text-lg font-black select-none">{val}</span>
                      <div>
                        <p className={`text-xs font-bold ${rassVal === val ? 'text-white' : 'text-slate-800 dark:text-slate-205'}`}>{name}</p>
                        <p className={`text-[10px] leading-tight ${rassVal === val ? 'text-sky-100' : 'text-slate-400'}`}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Rass Neutral and Positive */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block border-b border-amber-100 dark:border-amber-950/30 pb-1">Alerta & Agitação</span>
                  {[
                    [0, 'Alerta e Calmo', 'Estado natural. Atento, interage sem agitação.'],
                    [1, 'Ansioso / Inquieto', 'Movimentos ansiosos sem agressividade ou combatividade.'],
                    [2, 'Agitado', 'Frequentes movimentos desordenados. Briga com respirador.'],
                    [3, 'Muito Agitado', 'Retira tubos ou cateteres de forma voluntária; agressivo.'],
                    [4, 'Combativo', 'Extremamente agressivo ou violento; risco para equipe.']
                  ].map(([val, name, desc]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRassVal(val as number)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${rassVal === val ? 'bg-amber-600 border-amber-600 text-white shadow-xs' : 'bg-white hover:bg-slate-100 dark:bg-slate-900 border-slate-150 dark:border-slate-800'}`}
                    >
                      <span className="text-lg font-black select-none">+{val}</span>
                      <div>
                        <p className={`text-xs font-bold ${rassVal === val ? 'text-white' : 'text-slate-700 dark:text-slate-205'}`}>{name}</p>
                        <p className={`text-[10px] leading-tight ${rassVal === val ? 'text-amber-100' : 'text-slate-400'}`}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* RASS Interpretation box */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${rassVal >= 1 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-250' : rassVal <= -3 ? 'bg-sky-55 dark:bg-sky-955/20 border-sky-250' : 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-250'}`}>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">RASS Avaliado</p>
                  <p className="text-xl font-bold mt-1 text-slate-850 dark:text-white">Alvo RASS: {rassVal > 0 ? `+${rassVal}` : rassVal}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-sm inline-block ${rassVal >= -2 && rassVal <= 0 ? 'bg-emerald-50 text-emerald-600' : rassVal > 1 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {rassVal >= -2 && rassVal <= 0 ? 'Sedação Metabólica Alvo (Adequado)' : rassVal < -2 ? 'Sedação Excessiva / Profunda' : 'Agitação Clínica Ativa'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. CAM-ICU INTERACTIVE SCREEN */}
          {activeScore === 'camicu' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-amber-500" />
                  CAM-ICU (Avaliação de Delirium em UTI)
                </h3>
                <p className="text-xs text-slate-450 mt-1">Delirium é um distúrbio subdiagnosticado. Requer preenchimento de critérios específicos.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 dark:border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350">1. Início Agudo ou Curso Flutuante?</p>
                    <p className="text-[10px] text-slate-400">Existe histórico de mudança aguda do estado mental ou flutuação nas últimas 24 horas?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={camStep1}
                    onChange={(e) => setCamStep1(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-350 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 dark:border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350">2. Desatenção (Inattention)?</p>
                    <p className="text-[10px] text-slate-400">Erro no teste das letras "SAVEAHAART" desatento (mais de 2 erros ao apertar ao ouvir letra A) ou comando clínico?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={camStep2}
                    onChange={(e) => setCamStep2(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-350 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 dark:border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350">3. Pensamento Desorganizado?</p>
                    <p className="text-[10px] text-slate-400">Pacientes realizam respostas incorretas a perguntas lógicas ou apresentam desorientação crítica?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={camStep3}
                    onChange={(e) => setCamStep3(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-350 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 dark:border-slate-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-350">4. Nível Alterado de Consciência (RASS diferente de 0)?</p>
                    <p className="text-[10px] text-slate-400">O escore RASS atual do paciente aponta valor diferente de zero (por exemplo, sedado ou agitado)?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={camStep4}
                    onChange={(e) => setCamStep4(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-350 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {/* CAM-ICU Result box */}
              <div className={`p-5 rounded-xl border flex justify-between items-center ${computedCAM().isDelirium ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 animate-pulse' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250'}`}>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block pb-1">Conclusão CAM-ICU</span>
                  <p className="text-base font-black text-slate-800 dark:text-white">
                    {computedCAM().isDelirium ? 'Delirium Detectado (CAM-ICU Positivo)' : 'Sem Delirium Detectado (CAM-ICU Negativo)'}
                  </p>
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${computedCAM().isDelirium ? 'text-amber-800 bg-amber-100' : 'text-emerald-800 bg-emerald-100'}`}>
                    {computedCAM().isDelirium ? 'Alto Risco de Evento Cognitivo' : 'Livre de Delirium Clínico'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. SOFA SCORE */}
          {activeScore === 'sofa' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" />
                  Escore SOFA 2.0 (Sequential Organ Failure Assessment)
                </h3>
                <p className="text-xs text-slate-400">Identifica e acompanha a disfunção orgânica de múltiplos sistemas na sepse e choque circulatório.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sistema Respiratorio */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. Respiração (Relação P/F)</label>
                  <select
                    value={sofaResp}
                    onChange={(e) => setSofaResp(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value={0}>P/F &gt; 400 (0 pontos)</option>
                    <option value={1}>P/F ≤ 400 (1 ponto)</option>
                    <option value={2}>P/F ≤ 300 (2 pontos)</option>
                    <option value={3}>P/F ≤ 200 + em Ventilação Mecânica (3 pontos)</option>
                    <option value={4}>P/F ≤ 100 + em Ventilação Mecânica (4 pontos)</option>
                  </select>
                </div>

                {/* Sistema Coagulacao */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. Coagulação (Plaquetas x10³/µL)</label>
                  <select
                    value={sofaCoag}
                    onChange={(e) => setSofaCoag(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value={0}>Plaquetas &gt; 150 (0 pontos)</option>
                    <option value={1}>Plaquetas ≤ 150 (1 ponto)</option>
                    <option value={2}>Plaquetas ≤ 100 (2 pontos)</option>
                    <option value={3}>Plaquetas ≤ 50 (3 pontos)</option>
                    <option value={4}>Plaquetas ≤ 20 (4 pontos)</option>
                  </select>
                </div>

                {/* Fígado */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">3. Fígado (Bilirrubina mg/dL)</label>
                  <select
                    value={sofaLiver}
                    onChange={(e) => setSofaLiver(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value={0}>Bilirrubina &lt; 1.2 (0 pontos)</option>
                    <option value={1}>Bilirrubina 1.2 – 1.9 (1 ponto)</option>
                    <option value={2}>Bilirrubina 2.0 – 5.9 (2 pontos)</option>
                    <option value={3}>Bilirrubina 6.0 – 11.9 (3 pontos)</option>
                    <option value={4}>Bilirrubina ≥ 12.0 (4 pontos)</option>
                  </select>
                </div>

                {/* Cardiovascular */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">4. Cardiovascular (PAM / Dorgas Vasoativas)</label>
                  <select
                    value={sofaCardio}
                    onChange={(e) => setSofaCardio(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value={0}>PAM ≥ 70 mmHg (0 pontos)</option>
                    <option value={1}>PAM &lt; 70 mmHg (1 ponto)</option>
                    <option value={2}>Dopamina ≤ 5 µg/kg/min ou dobutamina em qualquer dose (2 pontos)</option>
                    <option value={3}>Dopamina &gt; 5 ou Noradrenalina ≤ 0.1 µg/kg/min (3 pontos)</option>
                    <option value={4}>Dopamina &gt; 15 ou Noradrenalina &gt; 0.1 µg/kg/min (4 pontos)</option>
                  </select>
                </div>

                {/* Sistema Nervoso */}
                <div className="bg-slate-55 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">5. Sistema Nervoso (Glasgow clássico)</label>
                  <select
                    value={sofaCns}
                    onChange={(e) => setSofaCns(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value={0}>Escala de Glasgow 15 (0 pontos)</option>
                    <option value={1}>Escala de Glasgow 13 – 14 (1 ponto)</option>
                    <option value={2}>Escala de Glasgow 10 – 12 (2 pontos)</option>
                    <option value={3}>Escala de Glasgow 6 – 9 (3 pontos)</option>
                    <option value={4}>Escala de Glasgow &lt; 6 (4 pontos)</option>
                  </select>
                </div>

                {/* Renal */}
                <div className="bg-slate-55 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">6. Função Renal (Creatinina ou Diurese)</label>
                  <select
                    value={sofaRenal}
                    onChange={(e) => setSofaRenal(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-slate-800 dark:text-white"
                  >
                    <option value={0}>Creatinina &lt; 1.2 mg/dL (0 pontos)</option>
                    <option value={1}>Creatinina 1.2 – 1.9 mg/dL (1 ponto)</option>
                    <option value={2}>Creatinina 2.0 – 3.4 mg/dL (2 pontos)</option>
                    <option value={3}>Creatinina 3.5 – 4.9 mg/dL ou Diurese &lt; 500 mL/dia (3 pontos)</option>
                    <option value={4}>Creatinina ≥ 5.0 mg/dL ou Diurese &lt; 200 mL/dia (4 pontos)</option>
                  </select>
                </div>
              </div>

              {/* SOFA OUTPUT */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center bg-blue-50/40 dark:bg-blue-950/20 border-blue-250">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Soma Escore SOFA</span>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-450 mt-1">{computedSOFA().total} pontos</p>
                </div>
                <p className={`text-xs mt-2 sm:mt-0 max-w-sm text-right ${computedSOFA().color}`}>
                  {computedSOFA().mortality}
                </p>
              </div>
            </div>
          )}

          {/* 5. SAPS 3 SCORE */}
          {activeScore === 'saps3' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-500" />
                  SAPS 3 (Simplified Acute Physiology Score 3)
                </h3>
                <p className="text-xs text-slate-400">Modelo prognóstico para UTI estimando desfechos clínicos baseados nas primeiras 1h de admissão.</p>
              </div>

              <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Idade (Anos)</label>
                  <select value={sapsAge} onChange={(e) => setSapsAge(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white">
                    <option value={0}>&lt; 40 anos (0 pontos)</option>
                    <option value={3}>40 - 59 anos (3 pontos)</option>
                    <option value={6}>60 - 69 anos (6 pontos)</option>
                    <option value={9}>70 - 79 anos (9 pontos)</option>
                    <option value={12}>≥ 80 anos (12 pontos)</option>
                  </select>
                </div>

                {/* Comorbidities */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Comorbidades Graves</label>
                  <select value={sapsComorb} onChange={(e) => setSapsComorb(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white">
                    <option value={0}>Nenhuma (0 pontos)</option>
                    <option value={5}>Insuficiência Cardíaca CF IV NYHA (5 pontos)</option>
                    <option value={8}>Câncer Metastático (8 pontos)</option>
                    <option value={10}>Disfunção Hematológica Maligna (10 pontos)</option>
                    <option value={6}>Cirrose Hepática Child C (6 pontos)</option>
                    <option value={6}>Imunossupressão Crônica (6 pontos)</option>
                  </select>
                </div>

                {/* Circumstance of admission */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo de Admissão</label>
                  <select value={sapsAdmission} onChange={(e) => setSapsAdmission(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white">
                    <option value={0}>Eletiva Programada (0 pontos)</option>
                    <option value={5}>Cirurgia de Emergência / Urgência (5 pontos)</option>
                    <option value={9}>Clínica não programada / Emergência (9 pontos)</option>
                  </select>
                </div>

                {/* Origin */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Origem do Paciente</label>
                  <select value={sapsOrigin} onChange={(e) => setSapsOrigin(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white">
                    <option value={0}>Residência ou Pronto Atendimento (0 pontos)</option>
                    <option value={2}>Enfermarias / Quartos clínicos (2 pontos)</option>
                    <option value={5}>Urgências doutrinas ou outra UTI transferido (5 pontos)</option>
                  </select>
                </div>

                {/* Physiological - GCS */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 font-mono">Glasgow na Admissão</label>
                  <select value={sapsGcs} onChange={(e) => setSapsGcs(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white">
                    <option value={0}>GCS 15 (0 pontos)</option>
                    <option value={3}>GCS 13 - 14 (3 pontos)</option>
                    <option value={8}>GCS 3 - 12 (8 pontos)</option>
                  </select>
                </div>

                {/* Creatinine */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Creatinina (mg/dL)</label>
                  <select value={sapsCreat} onChange={(e) => setSapsCreat(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white">
                    <option value={0}>Creatinina &lt; 1.2 (0 pontos)</option>
                    <option value={4}>Creatinina 1.2 – 2.0 (4 pontos)</option>
                    <option value={6}>Creatinina 2.0 – 3.5 (6 pontos)</option>
                    <option value={8}>Creatinina &gt; 3.5 (8 pontos)</option>
                  </select>
                </div>

                {/* pH */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Acidose (pH Gaseo.)</label>
                  <select value={sapspH} onChange={(e) => setSapspH(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white block">
                    <option value={0}>pH ≥ 7.30 (0 pontos)</option>
                    <option value={6}>pH &lt; 7.30 (6 pontos)</option>
                  </select>
                </div>

                {/* Pulse/Heart rate */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Frequência Cardíaca (bpm)</label>
                  <select value={sapsHr} onChange={(e) => setSapsHr(Number(e.target.value))} className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-205 p-2 rounded-lg text-slate-800 dark:text-white block">
                    <option value={0}>FC &lt; 120 bpm (0 pontos)</option>
                    <option value={3}>FC ≥ 120 bpm (3 pontos)</option>
                  </select>
                </div>
              </div>

              {/* SAPS 3 Output */}
              <div className="p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-center bg-indigo-50/40 dark:bg-slate-950 border-indigo-250">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Soma de Escore SAPS 3</span>
                  <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{computedSAPS3().total} pontos</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold">Mortalidade Hospitalar Estimada (Global)</p>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">~ {computedSAPS3().estMort}%</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. BPS (PAIN SCALE) */}
          {activeScore === 'bps' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-indigo-600 animate-pulse" />
                  BPS (Behavioral Pain Scale - Avaliação de dor)
                </h3>
                <p className="text-xs text-slate-450">Indicado para pacientes mecanicamente ventilados sob sedação assistida.</p>
              </div>

              <div className="space-y-3.5">
                {/* Facial Expression */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expressão Facial</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[['Relaxada (1)', 1], ['Parcialmente Contraída (2)', 2], ['Totalmente Contraída (3)', 3], ['Mímica de Careta (4)', 4]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBpsFacial(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${bpsFacial === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-705 dark:text-slate-300'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limbs Movement */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Membros Superiores</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[['Sem movimento (1)', 1], ['Flexão Parcial (2)', 2], ['Flexão Completa com dedos (3)', 3], ['Retração Permanente (4)', 4]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBpsLimbs(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${bpsLimbs === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-705 dark:text-slate-300'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Respiratory Compliance */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-lg border border-slate-150">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Adaptação à Ventilação Mecânica</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[['Tolerando Movimento (1)', 1], ['Tosse eventual (2)', 2], ['Briga com respirador (3)', 3], ['Assoberbado total (4)', 4]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBpsVent(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${bpsVent === val ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-205 text-slate-705 dark:text-slate-300'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BPS Output */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${computedBPS().total >= 6 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 animate-pulse' : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-250'}`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Soma de Pontos BPS</span>
                  <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{computedBPS().total} / 12 pontos</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${computedBPS().total >= 6 ? 'bg-rose-100 text-rose-750' : 'bg-emerald-100 text-emerald-750'}`}>
                    {computedBPS().total >= 6 ? 'Dor Inaceitável / Severa (Medicamento indicado)' : 'Ausência / Baixa dor referida'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 7. CPOT (PAIN SCALE 2) */}
          {activeScore === 'cpot' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Escore CPOT (Critical-Care Pain Observation Tool)
                </h3>
                <p className="text-xs text-slate-400">Mensura sofrimento, tônus muscular e agitação beira-leito sem comunicação verbal necessária.</p>
              </div>

              <div className="space-y-4">
                {/* Facial Expression CPOT */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150">
                  <span className="text-xs font-bold text-slate-500 uppercase">1. Expressão Facial</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {[['Nenhuma alteração de tônus (0)', 0], ['Tensa (Sobrancelhas juntas) (1)', 1], ['Careta permanente / Olhos cerrados (2)', 2]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCpotFacial(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${cpotFacial === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-350'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Movements CPOT */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150">
                  <span className="text-xs font-bold text-slate-500 uppercase">2. Movimentos Corporais</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {[['Ausência de movimentos (Repouso) (0)', 0], ['Proteção lentificada / mexe as mãos (1)', 1], ['Agitação / tenta sentar ou puxar tubos (2)', 2]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCpotMove(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${cpotMove === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-350'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Muscle Tension CPOT */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150">
                  <span className="text-xs font-bold text-slate-500 uppercase">3. Tônus Muscular (Flexão passiva no exame)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {[['Flexão livre / Relaxado (0)', 0], ['Rigidez moderada à resistência (1)', 1], ['Altamente rígido / Força oclusiva (2)', 2]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCpotTension(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${cpotTension === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-350'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Respiratory CPOT */}
                <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150">
                  <span className="text-xs font-bold text-slate-500 uppercase">4. Sincronia com Respirador ou Vocalização</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {[['Alarme não toca / Silencioso (0)', 0], ['Tosse ou vocalização tolerável (1)', 1], ['Briga severamente / chora / luta (2)', 2]].map(([lbl, val]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCpotVent(val as number)}
                        className={`p-2 text-xs font-semibold rounded-md border text-center transition-all ${cpotVent === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-350'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CPOT Output */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${computedCPOT().total >= 3 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 animate-pulse' : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-250'}`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Soma de Escore CPOT</span>
                  <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">{computedCPOT().total} / 8 pontos</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${computedCPOT().total >= 3 ? 'bg-rose-100 text-rose-750' : 'bg-emerald-100 text-emerald-750'}`}>
                    {computedCPOT().total >= 3 ? 'Nível Significativo de Dor (CPOT ≥ 3)' : 'Sem Dor Evidente'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 8. BERLIN CRITERIA SARA */}
          {activeScore === 'berlin' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <Wind className="w-5 h-5 text-indigo-600" />
                  Critérios de Berlim para SARA (Síndrome de Desconforto Respiratório)
                </h3>
                <p className="text-xs text-slate-400">Ferramenta diagnóstica e de classificação de gravidade para preenchimento simultâneo das 4 frentes clínicas.</p>
              </div>

              <div className="space-y-3.5">
                {/* Criterion 1 */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">1. Início Agudo dentro de 1 Semana?</p>
                    <p className="text-[10px] text-slate-450">Sintomas iniciados dentro de 7 dias de uma agressão clínica conhecida ou piora respiratória recente.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={berlin1}
                    onChange={(e) => setBerlin1(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-355 focus:ring-indigo-500"
                  />
                </label>

                {/* Criterion 2 */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Imagem de Tórax Conforme (Infiltrados Bilaterais)?</p>
                    <p className="text-[10px] text-slate-450">Infiltrados alveolares bilaterais na radiografia ou tomografia, sem explicação por derrame, colapso lobar ou nódulos.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={berlin2}
                    onChange={(e) => setBerlin2(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-355 focus:ring-indigo-500"
                  />
                </label>

                {/* Criterion 3 */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">3. Origem Não Cardiogênica do Edema?</p>
                    <p className="text-[10px] text-slate-450">A causa de edema pulmonar/insuficiência cardíaca foi excluída (ex: ausência de congestão ou eco clinicamente negativo)?</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={berlin3}
                    onChange={(e) => setBerlin3(e.target.checked)}
                    className="w-5 h-5 rounded-sm text-indigo-600 border-slate-355 focus:ring-indigo-500"
                  />
                </label>

                {/* Criterion 4 */}
                <div className="p-3.5 bg-slate-55 dark:bg-slate-955 rounded-lg border border-slate-150 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-750 dark:text-slate-305">4. Fração/Pressão na Troca Gasosa</p>
                      <p className="text-[10px] text-slate-400">Requer PEEP ou CPAP ativa de pelo menos 5 cmH₂O para validade.</p>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                      <input
                        type="checkbox"
                        checked={berlinPEEP}
                        onChange={(e) => setBerlinPEEP(e.target.checked)}
                        className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-505"
                      />
                      PEEP/CPAP ≥ 5
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Relação P/F atual do paciente</label>
                    <input
                      type="number"
                      placeholder="Ex: 140"
                      value={berlinPF}
                      onChange={(e) => setBerlinPF(Number(e.target.value))}
                      className="w-full max-w-sm px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SARA Diagnostics Output */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center ${computedBerlin().meetsAllCriteria ? 'bg-amber-100 dark:bg-slate-900 border-amber-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200'}`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Classificação de SARA</span>
                  <p className="text-base font-black text-slate-850 dark:text-white mt-1">
                    {computedBerlin().meetsAllCriteria ? 'DIAGNÓSTICO SARA INTEGRAL CONFIRMADO' : 'Critérios Incompletos para SARA'}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 max-w-sm text-center sm:text-right">
                  <span className={`text-[11px] font-bold ${computedBerlin().sevColor}`}>
                    {computedBerlin().severity}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 9. PESI & sPESI INTERACTIVE SCREEN */}
          {activeScore === 'pesi' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  Escores PESI e sPESI (Pulmonary Embolism Severity Index)
                </h3>
                <p className="text-xs text-slate-400">Classifica o risco de mortalidade em 30 dias para pacientes recém diagnosticados com embolismo pulmonar (TEP).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Numeric age field */}
                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-lg border border-slate-150 col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Idade Base (Adiciona pontos proporcionais em anos)</label>
                  <input
                    type="number"
                    min="1"
                    max="115"
                    value={pesiAgeVal}
                    onChange={(e) => setPesiAgeVal(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>

                {/* Checklist variables */}
                {[
                  ['Sexo Biológico Masculino (+10)', pesiMale, setPesiMale, 'pesi-male'],
                  ['Histórico de Câncer / Metástase (+30 / sPESI 1)', pesiCancer, setPesiCancer, 'pesi-cancer'],
                  ['Insuficiência Cardíaca Congestiva (+10 / sPESI 1)', pesiHeartFailure, setPesiHeartFailure, 'pesi-chf'],
                  ['Doença Pulmonar Crônica / DPOC (+10)', pesiCOPD, setPesiCOPD, 'pesi-copd'],
                  ['Frequência Cardíaca ≥ 110 bpm (+20 / sPESI 1)', pesiHR, setPesiHR, 'pesi-hr'],
                  ['Pressão Arterial Sistólica < 100 mmHg (+30 / sPESI 1)', pesiSystolic, setPesiSystolic, 'pesi-sbp'],
                  ['Frequência Respiratória ≥ 30 irpm (+20)', pesiRR, setPesiRR, 'pesi-rr'],
                  ['Temperatura Axilar < 36.0 °C (+20)', pesiTemp, setPesiTemp, 'pesi-temp'],
                  ['Estado Mental Alterado / Confusão (+60)', pesiMental, setPesiMental, 'pesi-mental'],
                  ['Saturação de Oxigênio < 90% (+20 / sPESI 1)', pesiSat, setPesiSat, 'pesi-sat'],
                  ['Específico sPESI: Doença Cardiopulmonar Crônica concomitante', pesiCardiopulmonary, setPesiCardiopulmonary, 'pesi-cardiopulmonary']
                ].map(([lbl, val, setVal, keyId]) => (
                  <label key={keyId} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{lbl}</span>
                    <input
                      type="checkbox"
                      checked={val as boolean}
                      onChange={(e) => (setVal as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)}
                      className="w-5 h-5 rounded-sm text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                ))}
              </div>

              {/* Outputs Integration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PESI Classical output */}
                <div className="p-4 rounded-xl border bg-indigo-50/20 dark:bg-slate-950 border-indigo-250 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Escore PESI Tradicional</span>
                  <p className="text-xl font-black text-indigo-700 dark:text-indigo-400">{computedPESI().pesiVal} pontos</p>
                  <p className="text-xs font-bold leading-tight mt-1 text-slate-700 dark:text-slate-300">
                    Classificação: <span className="underline">{computedPESI().classification}</span>
                  </p>
                </div>

                {/* sPESI Simplified output */}
                <div className={`p-4 rounded-xl border ${computedPESI().sPESIHigh ? 'bg-orange-50 dark:bg-slate-950 border-orange-250' : 'bg-emerald-50 dark:bg-slate-950 border-emerald-250'} space-y-1`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Escore sPESI Simplificado</span>
                  <p className="text-xl font-black text-slate-850 dark:text-white">{computedPESI().sScore} pontos</p>
                  <span className={`text-[10.5px] font-bold block ${computedPESI().sPESIHigh ? 'text-orange-600' : 'text-emerald-600'}`}>
                    Risco sPESI: {computedPESI().sPESIHigh ? 'ALTO RISCO (Mortalidade em 30d ~ 10.9%)' : 'BAIXO RISCO (Excepcional; óbito 30d ~ 1.0%)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Standard medical warning footer across all score panels */}
          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-150/80 mt-6 text-[10.5px] text-slate-500 flex gap-2 items-start">
            <Info className="w-4.5 h-4.5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-extrabold text-slate-650 uppercase tracking-widest text-[9px]">Aviso Decisório Clínico</p>
              <p>
                Os escores são calculados mediante as opções marcadas e dados digitados pelo profissional assistente. O applet Medic Round Pro em nenhuma hipótese atua de forma prescritiva ou decide intervenções. Revise sempre em diretriz médica autorizada do hospital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
