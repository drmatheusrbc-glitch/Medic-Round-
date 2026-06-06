import React, { useState, useEffect } from 'react';
import { MechanicalVentState, VentMode } from '../types';
import { 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  TrendingUp, 
  Calculator, 
  UserPlus, 
  FileCheck,
  AlertTriangle,
  Info,
  Copy,
  Check
} from 'lucide-react';

export default function VentilationTab() {
  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [weight, setWeight] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [paO2, setPaO2] = useState<number | ''>('');
  const [mode, setMode] = useState<VentMode>('VCV');

  // mode states
  const [volume, setVolume] = useState<number | ''>(500);
  const [flow, setFlow] = useState<number | ''>(60);
  const [fr, setFr] = useState<number | ''>(14);
  const [ie, setIe] = useState('1:2');
  const [peep, setPeep] = useState<number | ''>(5);
  const [fio2, setFio2] = useState<number | ''>(40);
  const [pPeak, setPPeak] = useState<number | ''>(22);
  const [pPlateau, setPPlateau] = useState<number | ''>(18);
  const [autoPeep, setAutoPeep] = useState<number | ''>(0);

  // PCV specific
  const [deltaP, setDeltaP] = useState<number | ''>(12);
  const [tInsp, setTInsp] = useState<number | ''>(1.0);
  const [ramp, setRamp] = useState<number | ''>(4);

  // PSV specific
  const [psvSupport, setPsvSupport] = useState<number | ''>(10);
  const [psvCycling, setPsvCycling] = useState<number | ''>(25);
  const [psvFrSpont, setPsvFrSpont] = useState<number | ''>(18);
  const [psvVcSpont, setPsvVcSpont] = useState<number | ''>(420); // ml

  const [copied, setCopied] = useState(false);

  // --- IBW CALCULATOR ---
  const calculatedIBW = React.useMemo(() => {
    if (!height || Number(height) <= 0) return 0;
    const h = Number(height);
    if (gender === 'M') {
      return 50 + 0.91 * (h - 152.4);
    } else {
      return 45.5 + 0.91 * (h - 152.4);
    }
  }, [height, gender]);

  // --- AUTOMATIC CALCULATIONS ---

  // 1. Volume Corrente por Peso Ideal
  const currentVolume = React.useMemo(() => {
    if (mode === 'VCV') return Number(volume) || 0;
    if (mode === 'PCV') {
      // VC is variable in PCV, but let's allow a "measured VC" input or calculate via approximate compliancetest / require an average measured Volume:
      // Let's use the VCV 'volume' input or general average measured volume to carry out the ml/kg weight calculation for PCV/PSV as well!
      // To satisfy all modes, let's provide a "Volume Corrente Medido (ml)" input if we are in PCV/PSV, or just default to 'volume' as the representative VC.
      return Number(volume) || 0;
    }
    return Number(psvVcSpont) || 0;
  }, [mode, volume, psvVcSpont]);

  const vcPerKg = React.useMemo(() => {
    if (!calculatedIBW || calculatedIBW <= 0 || !currentVolume) return 0;
    return currentVolume / calculatedIBW;
  }, [calculatedIBW, currentVolume]);

  const vcInterpretation = React.useMemo(() => {
    if (vcPerKg === 0) return null;
    if (vcPerKg <= 8.0) return { label: 'Ideal (Proteção Alveolar)', text: '6-8 ml/kg', color: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-250', status: 'safe' };
    if (vcPerKg <= 10.0) return { label: 'Atenção (Risco Volutrauma)', text: '8-10 ml/kg', color: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 border border-amber-250', status: 'warning' };
    return { label: 'Elevado (Lesão Induzida pela VM - VILI)', text: '>10 ml/kg', color: 'text-rose-600 dark:text-rose-450', badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-250', status: 'danger' };
  }, [vcPerKg]);

  // 2. PEEP Total
  const totalPeep = React.useMemo(() => {
    const activePeep = mode === 'PSV' ? (Number(peep) || 0) : (Number(peep) || 0);
    const activeAutoPeep = mode === 'PSV' ? 0 : (Number(autoPeep) || 0);
    return activePeep + activeAutoPeep;
  }, [mode, peep, autoPeep]);

  // 3. Driving Pressure
  const drivingPressure = React.useMemo(() => {
    if (mode === 'PSV') return 0; // Does not apply directly for spontaneous modes
    const plat = Number(pPlateau) || 0;
    if (!plat) return 0;
    return plat - totalPeep;
  }, [mode, pPlateau, totalPeep]);

  // 4. Complacência Estática (Crs)
  const complacenciaEstatica = React.useMemo(() => {
    if (mode === 'PSV') return 0;
    const plat = Number(pPlateau) || 0;
    const vc = Number(volume) || 0;
    const pressureDelta = plat - totalPeep;
    if (pressureDelta <= 0 || !vc) return 0;
    return vc / pressureDelta;
  }, [mode, volume, pPlateau, totalPeep]);

  // 5. Resistência das Vias Aéreas (Rrs)
  // Rrs = (Ppico - Pplatô) ÷ (Fluxo/60)
  const resistenciaViasAereas = React.useMemo(() => {
    if (mode !== 'VCV') return 0; // Flow is standard constant in VCV
    const peak = Number(pPeak) || 0;
    const plat = Number(pPlateau) || 0;
    const activeFlow = Number(flow) || 0;
    if (activeFlow <= 0 || peak <= plat) return 0;
    const flowLPerSec = activeFlow / 60;
    return (peak - plat) / flowLPerSec;
  }, [mode, pPeak, pPlateau, flow]);

  // 6. Constante de Tempo (Tau)
  // Tau = Rrs × Crs ÷ 1000
  const tau = React.useMemo(() => {
    if (resistenciaViasAereas <= 0 || complacenciaEstatica <= 0) return 0;
    return (resistenciaViasAereas * complacenciaEstatica) / 1000;
  }, [resistenciaViasAereas, complacenciaEstatica]);

  // 7. Índice de Tobin (RSBI)
  // RSBI = FR ÷ VC (em litros)
  const tobinIndex = React.useMemo(() => {
    let activeFr = 0;
    let activeVcInL = 0;
    if (mode === 'PSV') {
      activeFr = Number(psvFrSpont) || 0;
      activeVcInL = (Number(psvVcSpont) || 0) / 1000;
    } else {
      activeFr = Number(fr) || 0;
      activeVcInL = (Number(volume) || 0) / 1000;
    }
    if (activeFr <= 0 || activeVcInL <= 0) return 0;
    return activeFr / activeVcInL;
  }, [mode, psvFrSpont, psvVcSpont, fr, volume]);

  const tobinInterpretation = React.useMemo(() => {
    if (tobinIndex === 0) return null;
    if (tobinIndex < 80) return { label: 'Alta Probabilidade de Sucesso no Desmame', color: 'text-emerald-600 dark:text-emerald-400', level: 'safe' };
    if (tobinIndex <= 105) return { label: 'Sucesso Moderado / Limítrofe', color: 'text-amber-自动 text-amber-500 dark:text-amber-400', level: 'warning' };
    return { label: 'Baixa Probabilidade de Desmame. Alto risco de fadiga.', color: 'text-rose-600 dark:text-rose-400', level: 'danger' };
  }, [tobinIndex]);

  // 8. Relação P/F
  // P/F = PaO₂ ÷ FiO₂ (as a decimal fraction e.g. 0.40)
  const pfRatio = React.useMemo(() => {
    const activeFio2 = Number(fio2) || 0;
    const activePaO2 = Number(paO2) || 0;
    if (activeFio2 <= 0 || activePaO2 <= 0) return 0;
    const fio2Fraction = activeFio2 / 100;
    return activePaO2 / fio2Fraction;
  }, [fio2, paO2]);

  const pfInterpretation = React.useMemo(() => {
    if (pfRatio === 0) return null;
    if (pfRatio > 300) return { label: 'Normal / Sem SARA', desc: '> 300', color: 'text-emerald-600 dark:text-emerald-400' };
    if (pfRatio >= 200) return { label: 'SARA Leve', desc: '200 - 300 (Síndrome do Desconforto Respiratório Agudo)', color: 'text-amber-600 dark:text-amber-400' };
    if (pfRatio >= 100) return { label: 'SARA Moderada', desc: '100 - 200 (Comprometimento de trocas gasosas severo)', color: 'text-orange-500 dark:text-orange-400' };
    return { label: 'SARA Grave', desc: '< 100 (Risco crítico de hipoxemia refractária)', color: 'text-rose-600 dark:text-rose-450 font-bold' };
  }, [pfRatio]);

  // 9. AUTOMATIC ALERTS
  const activeAlerts = React.useMemo(() => {
    const list: string[] = [];
    if (mode !== 'PSV' && drivingPressure > 15) {
      list.push(`DRIVING PRESSURE ELEVADA (${drivingPressure.toFixed(0)} cmH₂O): Maior estresse alveolar. Alvo sugerido < 15 cmH₂O.`);
    }
    if (vcPerKg > 8.0) {
      list.push(`VALOR DE VOLUME CORRENTE ELEVADO (${vcPerKg.toFixed(1)} ml/kg): Risco iminente de volutrauma. Reavaliar volume corrente para proteção pulmonar.`);
    }
    if (pfRatio > 0 && pfRatio < 150) {
      list.push(`RELAÇÃO P/F MUITO BAIXA (${pfRatio.toFixed(0)}): Grave comprometimento alveolar. Considere PEEP otimizada, ventilação em prona ou manobras de recrutamento.`);
    }
    if (mode !== 'PSV' && Number(autoPeep) > 2) {
      list.push(`AUTO-PEEP DETECTADA (${autoPeep} cmH₂O): Risco de hiperinsuflação dinâmica, auto-triggering dificultado e barotrauma. Considere reduzir FR ou prolongar expiração.`);
    }
    if (mode !== 'PSV' && complacenciaEstatica > 0 && complacenciaEstatica < 30) {
      list.push(`COMPLACÊNCIA ESTÁTICA COM REDUÇÃO CRÍTICA (${complacenciaEstatica.toFixed(1)} ml/cmH₂O): Pulmão rígido ("baby lung" ou consolidações). Estresse mecânico elevado.`);
    }
    return list;
  }, [mode, drivingPressure, vcPerKg, pfRatio, autoPeep, complacenciaEstatica]);

  // Generate copyable clinical clipboard text
  const handleCopyClipboard = () => {
    const textOutputs = `
=========================================
CHECKLIST VENTILATÓRIO - MEDIC ROUND PRO
=========================================
Paciente: ${patientName || 'Não Identificado'}
Sexo: ${gender === 'M' ? 'Masculino' : 'Feminino'} | Altura: ${height || '--'} cm
Peso Ideal Calculado: ${calculatedIBW ? calculatedIBW.toFixed(1) + ' kg' : '--'}
PaO2: ${paO2 || '--'} mmHg

[MODO VENTILATÓRIO]: ${mode}
${mode === 'VCV' ? `
- Volume Corrente: ${volume} ml (${vcPerKg ? vcPerKg.toFixed(1) + ' ml/kg IBW' : '-'})
- Frequência Respiratória: ${fr} ipm
- Fluxo Inspiratório: ${flow} L/min
- Relação I:E: ${ie}
- PEEP: ${peep} cmH2O (Auto-PEEP: ${autoPeep} cmH2O)
- FiO2: ${fio2}%
- Pressão de Pico: ${pPeak} cmH2O
- Pressão de Platô: ${pPlateau} cmH2O
` : ''}
${mode === 'PCV' ? `
- Delta de Pressão: ${deltaP} cmH2O
- Frequência Respiratória: ${fr} ipm
- Tempo Inspiratório: ${tInsp} s
- Rampa: ${ramp}
- PEEP: ${peep} cmH2O (Auto-PEEP: ${autoPeep} cmH2O)
- FiO2: ${fio2}%
- Pressão de Pico: ${pPeak} cmH2O
- Pressão de Platô: ${pPlateau} cmH2O
- Volume Corrente Medido: ${volume} ml (${vcPerKg ? vcPerKg.toFixed(1) + ' ml/kg IBW' : '-'})
` : ''}
${mode === 'PSV' ? `
- Pressão de Suporte: ${psvSupport} cmH2O
- Rampa: ${ramp}
- Ciclagem: ${psvCycling}%
- PEEP: ${peep} cmH2O
- FiO2: ${fio2}%
- FR Espontânea observada: ${psvFrSpont} ipm
- Volume Corrente Espontâneo: ${psvVcSpont} ml (${vcPerKg ? vcPerKg.toFixed(1) + ' ml/kg IBW' : '-'})
` : ''}

[RESULTADOS DE MECÂNICA RESPIRATÓRIA]:
${mode !== 'PSV' ? `
- PEEP Total: ${totalPeep} cmH2O
- Driving Pressure (Pplatô - PEEPtot): ${drivingPressure ? drivingPressure.toFixed(0) + ' cmH2O' : '--'} (Ideal <15)
- Complacência Estática (Crs): ${complacenciaEstatica ? complacenciaEstatica.toFixed(1) + ' ml/cmH2O' : '--'} (Normal 50-80)
${mode === 'VCV' ? `- Resistência das Vias Aéreas (Rrs): ${resistenciaViasAereas ? resistenciaViasAereas.toFixed(1) + ' cmH2O/L/s' : '--'} (Normal <10)` : ''}
${tau > 0 ? `- Constante de Tempo (Tau): ${tau.toFixed(2)} s (Tempo exp mínimo sugerido: ${(tau*3).toFixed(2)} s)` : ''}
` : ''}
- Relação P/F (PaO2/FiO2): ${pfRatio ? pfRatio.toFixed(0) : '--'} [${pfInterpretation ? pfInterpretation.label : 'Não avaliada'}]
- Índice de Tobin (RSBI): ${tobinIndex ? tobinIndex.toFixed(0) : '--'} [${tobinInterpretation ? tobinInterpretation.label : 'Não avaliada'}]

[ALERTAS ATIVOS]:
${activeAlerts.length > 0 ? activeAlerts.map(a => `• ${a}`).join('\n') : 'Nenhum alerta de mecânica crítica detectado.'}

-----------------------------------------
Gerado automaticamente pelo Medic Round Pro. Uso exclusivo para profissionais de saúde.
    `.trim();

    navigator.clipboard.writeText(textOutputs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2050);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Checklist de Ventilação Mecânica (VM)
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Calcule parâmetros de proteção alveolar, complacência pulmonar, constante de tempo e alertas de estresse pulmonar.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Identification & Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section: Identificação */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <UserPlus className="w-4 h-4 text-blue-500" />
              1. Dados do Paciente e Referências
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome ou Identificação</label>
                <input
                  type="text"
                  placeholder="Ex: Leito 05 ou J.S.M"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sexo Biológico</label>
                  <div className="flex bg-slate-55 dark:bg-slate-950 p-1 rounded-lg border border-slate-205 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setGender('M')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${gender === 'M' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-400'}`}
                    >
                      Masc
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('F')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${gender === 'F' ? 'bg-rose-600 text-white' : 'text-slate-700 dark:text-slate-400'}`}
                    >
                      Fem
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    placeholder="Ex: 175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white text-center"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pressão de Oxigênio (PaO₂ - mmHg)</label>
                <input
                  type="number"
                  placeholder="Ex: 84"
                  value={paO2}
                  onChange={(e) => setPaO2(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                />
              </div>

              {/* Real-time IBW block */}
              <div className="bg-blue-50/50 dark:bg-blue-950/15 border border-blue-200/40 dark:border-blue-900/30 p-2.5 rounded-lg flex flex-col justify-center">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">Peso Ideal Calculado (IBW)</p>
                <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
                  {calculatedIBW > 0 ? `${calculatedIBW.toFixed(1)} kg` : '-- kg'}
                </p>
                <p className="text-[9px] text-slate-400">Fórmula de Devine baseada na altura.</p>
              </div>
            </div>
          </div>

          {/* Section: Mode selection & fields */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl p-5 space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-850 pb-3 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                2. Ajustes e Medidas do Respirador
              </h3>
              
              {/* Select mode */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {(['VCV', 'PCV', 'PSV'] as VentMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      mode === m 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* VCV Mode inputs */}
            {mode === 'VCV' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume Corrente (ml)</label>
                  <input
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Fluxo Inspiratório (L/min)</label>
                  <input
                    type="number"
                    value={flow}
                    onChange={(e) => setFlow(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Frequência Resp (FR)</label>
                  <input
                    type="number"
                    value={fr}
                    onChange={(e) => setFr(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Relação I:E (Ex: 1:2)</label>
                  <input
                    type="text"
                    value={ie}
                    onChange={(e) => setIe(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">PEEP Ajustada (cmH₂O)</label>
                  <input
                    type="number"
                    value={peep}
                    onChange={(e) => setPeep(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">FiO₂ Ajustada (%)</label>
                  <input
                    type="number"
                    value={fio2}
                    onChange={(e) => setFio2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pressão de Pico (Ppico)</label>
                  <input
                    type="number"
                    value={pPeak}
                    onChange={(e) => setPPeak(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pressão de Platô (Pplatô)</label>
                  <input
                    type="number"
                    value={pPlateau}
                    onChange={(e) => setPPlateau(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Auto-PEEP Medida (cmH₂O)</label>
                  <input
                    type="number"
                    value={autoPeep}
                    onChange={(e) => setAutoPeep(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* PCV Mode inputs */}
            {mode === 'PCV' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Delta de Pressão (cmH₂O)</label>
                  <input
                    type="number"
                    value={deltaP}
                    onChange={(e) => setDeltaP(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Frequência Resp (FR)</label>
                  <input
                    type="number"
                    value={fr}
                    onChange={(e) => setFr(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tempo Inspiratório (s)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tInsp}
                    onChange={(e) => setTInsp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Rampa/Inflexão (s/escala)</label>
                  <input
                    type="number"
                    value={ramp}
                    onChange={(e) => setRamp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">PEEP Ajustada (cmH₂O)</label>
                  <input
                    type="number"
                    value={peep}
                    onChange={(e) => setPeep(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">FiO₂ Ajustada (%)</label>
                  <input
                    type="number"
                    value={fio2}
                    onChange={(e) => setFio2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pressão de Pico (Ppico)</label>
                  <input
                    type="number"
                    value={pPeak}
                    onChange={(e) => setPPeak(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pressão de Platô (Pplatô)</label>
                  <input
                    type="number"
                    value={pPlateau}
                    onChange={(e) => setPPlateau(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Auto-PEEP Medida (cmH₂O)</label>
                  <input
                    type="number"
                    value={autoPeep}
                    onChange={(e) => setAutoPeep(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1">Volume Corrente Expirado Medido (ml) *</label>
                  <input
                    type="number"
                    placeholder="Volume expirado pelo paciente em PCV"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-blue-50/50 dark:bg-slate-950 border border-blue-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white font-semibold"
                  />
                </div>
              </div>
            )}

            {/* PSV Mode inputs */}
            {mode === 'PSV' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Pressão de Suporte (cmH₂O)</label>
                  <input
                    type="number"
                    value={psvSupport}
                    onChange={(e) => setPsvSupport(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Rampa (Ramp / s)</label>
                  <input
                    type="number"
                    value={ramp}
                    onChange={(e) => setRamp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Ciclagem (%)</label>
                  <input
                    type="number"
                    value={psvCycling}
                    onChange={(e) => setPsvCycling(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">FiO₂ Ajustada (%)</label>
                  <input
                    type="number"
                    value={fio2}
                    onChange={(e) => setFio2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">PEEP Ajustada (cmH₂O)</label>
                  <input
                    type="number"
                    value={peep}
                    onChange={(e) => setPeep(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 p-2.5 rounded-lg col-span-2 md:col-span-3 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-blue-600 dark:text-blue-400 mb-1">FR Espontânea Registrada (ipm)</label>
                    <input
                      type="number"
                      placeholder="Ex: 18"
                      value={psvFrSpont}
                      onChange={(e) => setPsvFrSpont(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-blue-50/20 dark:bg-slate-950 border border-blue-200/50 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-blue-600 dark:text-blue-400 mb-1">VC Espontâneo Medido (ml)</label>
                    <input
                      type="number"
                      placeholder="Ex: 420"
                      value={psvVcSpont}
                      onChange={(e) => setPsvVcSpont(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-blue-50/20 dark:bg-slate-950 border border-blue-200/50 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column representation - Calculations & Warnings */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section: Calculations Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Mecânica Respiratória Gerada
              </h3>
              
              <button
                onClick={handleCopyClipboard}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-semibold select-none transition-all ${
                  copied 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-600 dark:text-emerald-450' 
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-bounce" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Dados
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {/* VC / Peso Ideal */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">VC por Peso Ideal</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: VC ({currentVolume} ml) / IBW ({calculatedIBW > 0 ? calculatedIBW.toFixed(1) : '--'} kg)</p>
                  <p className="text-[10px] text-slate-400 select-none">Volume corrente gerido por quilo ideal de peso.</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {vcPerKg > 0 ? `${vcPerKg.toFixed(1)} ml/kg` : '-- ml/kg'}
                  </p>
                  {vcInterpretation && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block mt-0.5 ${vcInterpretation.badge}`}>
                      {vcInterpretation.label} ({vcPerKg.toFixed(1)} ml/kg)
                    </span>
                  )}
                </div>
              </div>

              {/* Driving pressure & PEEP Total */}
              {mode !== 'PSV' && (
                <>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Driving Pressure (ΔP alveolar)</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: Pplatô ({pPlateau || 0}) - PEEPtot ({totalPeep})</p>
                      <p className="text-[10px] text-slate-400 select-none">Pplatô - PEEP Total. Alvo ideal inferior a 15.</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${drivingPressure > 15 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {drivingPressure > 0 ? `${drivingPressure.toFixed(0)} cmH₂O` : '-- cmH₂O'}
                      </p>
                      {drivingPressure > 0 && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm inline-block mt-0.5 ${drivingPressure <= 15 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'}`}>
                          {drivingPressure <= 15 ? `ΔP Adequada (${drivingPressure.toFixed(0)} cmH₂O)` : `ΔP Elevada (${drivingPressure.toFixed(0)} cmH₂O)`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">PEEP Total / Pressão de Fim de Expiração</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: PEEP ({peep || 0}) + Auto-PEEP ({autoPeep || 0})</p>
                      <p className="text-[10px] text-slate-400">PEEP Ajustada + Auto-PEEP registrada.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {totalPeep} cmH₂O
                      </p>
                    </div>
                  </div>

                  {/* Complacência Estática */}
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Complacência Estática (Crs)</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: VC ({volume || 0} mL) / ΔP ({pPlateau && totalPeep ? (Number(pPlateau) - totalPeep).toFixed(0) : '0'} cmH₂O)</p>
                      <p className="text-[10px] text-slate-400">VC / (Pplatô - PEEPtot). Normal: 50-80 ml/cmH₂O.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {complacenciaEstatica > 0 ? `${complacenciaEstatica.toFixed(1)} ml/cmH₂O` : '-- ml/cmH₂O'}
                      </p>
                      {complacenciaEstatica > 0 && (
                        <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-sm ${complacenciaEstatica >= 30 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950 text-rose-500'}`}>
                          {complacenciaEstatica < 30 ? `Crs Baixa / Rígido (${complacenciaEstatica.toFixed(1)} ml/cmH₂O)` : `Crs Adequado (${complacenciaEstatica.toFixed(1)} ml/cmH₂O)`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resistência (only for VCV where airflow is constant) */}
                  {mode === 'VCV' && (
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Resistência Vias Aéreas (Rrs)</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: (Ppico ({pPeak}) - Pplatô ({pPlateau})) / (Flow ({flow}) / 60)</p>
                        <p className="text-[10px] text-slate-400">(Ppico - Pplatô) / (Fluxo em L/s). Normal &lt;10.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {resistenciaViasAereas > 0 ? `${resistenciaViasAereas.toFixed(1)} cmH₂O/L/s` : '-- cmH₂O/L/s'}
                        </p>
                        {resistenciaViasAereas > 0 && (
                          <span className={`text-[9px] font-semibold px-1 py-0.5 rounded-sm ${resistenciaViasAereas < 10 ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950 text-amber-500'}`}>
                            {resistenciaViasAereas < 10 ? `Rrs Normal (${resistenciaViasAereas.toFixed(1)})` : `Rrs Aumentada (${resistenciaViasAereas.toFixed(1)})`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Constante de tempo Tau */}
                  {tau > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Constante de Tempo (Tau)</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: Rrs ({resistenciaViasAereas.toFixed(1)} cmH₂O/L/s) * Crs ({complacenciaEstatica.toFixed(1)} ml/cmH₂O) / 1000</p>
                          <p className="text-[10px] text-slate-400">Tempo de esvaziamento pulmonar passivo.</p>
                        </div>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {tau.toFixed(2)} segundos
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-md text-[9px] text-slate-500">
                        <div>
                          <p className="font-semibold">1 Const</p>
                          <p className="text-slate-705 dark:text-slate-300">{tau.toFixed(2)}s</p>
                        </div>
                        <div>
                          <p className="font-semibold">2 Const</p>
                          <p className="text-slate-705 dark:text-slate-300">{(tau*2).toFixed(2)}s</p>
                        </div>
                        <div>
                          <p className="font-semibold">3 Const</p>
                          <p className="text-slate-705 dark:text-slate-300 text-blue-600 dark:text-blue-400 font-bold">{(tau*3).toFixed(2)}s</p>
                        </div>
                        <div>
                          <p className="font-semibold">5 Const</p>
                          <p className="text-slate-705 dark:text-slate-300">{(tau*5).toFixed(2)}s</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 p-2 bg-blue-50/40 dark:bg-blue-950/25 border border-blue-200/30 dark:border-blue-900/40 rounded-lg text-blue-800 dark:text-blue-450 text-[10px] font-semibold items-start leading-tight">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Tempo expiratório mínimo recomendado = 3 constantes de tempo ({ (tau*3).toFixed(2) }s)</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Relação P/F (PaO2/FiO2) */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Relação P/F (PaO₂ / FiO₂)</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: PaO₂ ({paO2 || 0} mmHg) / (FiO₂ ({fio2 || 0}%) / 100)</p>
                  <p className="text-[10px] text-slate-400">Classificação SARA (Berlim). FiO₂ como fração.</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {pfRatio > 0 ? `${pfRatio.toFixed(0)}` : '--'}
                  </p>
                  {pfInterpretation && (
                    <span className={`text-[10px] font-bold block mt-0.5 ${pfInterpretation.color}`}>
                      {pfInterpretation.label} ({pfRatio.toFixed(0)})
                    </span>
                  )}
                </div>
              </div>

              {/* Tobin Index RSBI */}
              <div className="flex justify-between items-center bg-slate-55 dark:bg-slate-955 p-3 rounded-lg border border-slate-100 dark:border-slate-850/50">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Índice de Tobin (RSBI)</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Fórmula: FR ({mode === 'PSV' ? (psvFrSpont || 0) : (fr || 0)} ipm) / VC ({(mode === 'PSV' ? (Number(psvVcSpont) || 0) : (Number(volume) || 0)) / 100} L)</p>
                  <p className="text-[10px] text-slate-400">FR / Volume Corrente (litros). Preditor de desmame.</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {tobinIndex > 0 ? `${tobinIndex.toFixed(0)}` : '--'}
                  </p>
                  {tobinInterpretation && (
                    <span className={`text-[10px] font-bold block mt-0.5 ${tobinInterpretation.color}`}>
                      {tobinInterpretation.label === 'Alta Probabilidade de Sucesso no Desmame' 
                        ? `Favorável / Baixo Risco (${tobinIndex.toFixed(0)})` 
                        : tobinInterpretation.label === 'Sucesso Moderado / Limítrofe' 
                        ? `Limítrofe (${tobinIndex.toFixed(0)})` 
                        : `Alto Risco / Fadiga (${tobinIndex.toFixed(0)})`
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Alerts & Mechanical Safety */}
          {activeAlerts.length > 0 ? (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/45 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-rose-800 dark:text-rose-450 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400-automatic" />
                Alertas Críticos de Ventilação
              </h4>
              <ul className="space-y-2 text-rose-700 dark:text-rose-400 text-xs font-semibold leading-relaxed">
                {activeAlerts.map((al, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-rose-500 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-450 leading-none p-0.5 rounded-full mt-0.5 shrink-0">
                      ⚠️
                    </span>
                    <span>{al}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-slate-500 italic mt-2">
                Os alertas acima sugerem riscos de estresse ventilatório severo. Ajuste e discuta à beira-leito.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/35 p-5 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                Parâmetros Mecânicos Seguros
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-450">
                Atualmente, nenhuma métrica respiratória ultrapassou os limiares críticos de estresse pulmonar alveolar. O paciente segue em faixa de proteção recomendada.
              </p>
            </div>
          )}

          {/* Clinical Responsability Disclaimer */}
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 space-y-1">
            <p className="font-extrabold flex items-center gap-1 text-slate-600 dark:text-slate-400 uppercase tracking-widest text-[9px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              IMPORTANTE — Isenção de Responsabilidade
            </p>
            <p>
              Este guia ventilatório constitui uma calculadora de suporte rápido para mecânica respiratória. Os dados e referências em hipótese alguma devem prevalecer ou substituir a avaliação presencial soberana do médico assistente no manejo ventilatório beira-leito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
