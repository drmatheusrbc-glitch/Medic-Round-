import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Sparkles,
  Layers,
  Search,
  Scale,
  Thermometer,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Droplet
} from 'lucide-react';

interface Dilution {
  id: string;
  label: string;
  conc: number; // concentration in mg/mL or mcg/mL or U/mL
  unit: string;
}

interface Drug {
  id: string;
  name: string;
  classification: string;
  type: 'vasoativa' | 'sedacao' | 'neuromuscular';
  apresentacao: string;
  diluicoes: Dilution[];
  defaultDose: number;
  defaultFlow: number;
  doseUnit: 'mcg/kg/min' | 'U/min' | 'mg/kg/h' | 'mcg/kg/min-or-mcg/min' | 'mcg/min';
  therapeuticMin: number;
  therapeuticMax: number;
  guideText: string;
}

const DRUGS_DATA: Drug[] = [
  {
    id: 'noradrenalina',
    name: 'Noradrenalina',
    classification: 'Vasoativa / Vasopressor',
    type: 'vasoativa',
    apresentacao: 'Ampola 8mg/4mL (equivalente a 4mg/4mL de noradrenalina base)',
    diluicoes: [
      { id: 'nora-4', label: '4 Ampolas + 234mL SG 5% (Padrão Leve)', conc: 64, unit: 'mcg/mL' },
      { id: 'nora-8', label: '8 Ampolas + 234mL SG 5% (Concentrada)', conc: 128, unit: 'mcg/mL' }
    ],
    defaultDose: 0.1,
    defaultFlow: 6.6,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 0.05,
    therapeuticMax: 2.0,
    guideText: 'Dose usual: 0,05 a 2 mcg/kg/min. Não possui dose máxima absoluta, mas requer titulação atenta a sinais de hipoperfusão periférica.'
  },
  {
    id: 'vasopressina',
    name: 'Vasopressina',
    classification: 'Vasoativa / Vasopressor Hormonal',
    type: 'vasoativa',
    apresentacao: 'Ampola 20 U/mL',
    diluicoes: [
      { id: 'vaso-1', label: '1 mL (20U) + 99mL SF 0,9%', conc: 0.2, unit: 'U/mL' },
      { id: 'vaso-2', label: '2 mL (40U) + 98mL SF 0,9%', conc: 0.4, unit: 'U/mL' }
    ],
    defaultDose: 0.02,
    defaultFlow: 6.0,
    doseUnit: 'U/min',
    therapeuticMin: 0.01,
    therapeuticMax: 0.04,
    guideText: 'Dose fixa recomendada: 0,01 a 0,04 U/min. Utilizada como poupador de vasopressor no choque séptico refratário.'
  },
  {
    id: 'adrenalina',
    name: 'Adrenalina',
    classification: 'Vasoativa / Inotrópico & Vasopressor',
    type: 'vasoativa',
    apresentacao: 'Ampola 1 mg/mL',
    diluicoes: [
      { id: 'adre-12', label: '12 Ampolas (12mg) + 188mL SG 5%', conc: 60, unit: 'mcg/mL' }
    ],
    defaultDose: 0.1,
    defaultFlow: 7.0,
    doseUnit: 'mcg/kg/min-or-mcg/min', // Special case handled with internal state
    therapeuticMin: 0.01,
    therapeuticMax: 0.5,
    guideText: 'Dose para Choque: 0,01 a 0,5 mcg/kg/min. Dose para Bradicardia: 2 a 10 mcg/min (independente de peso).'
  },
  {
    id: 'dobutamina',
    name: 'Dobutamina',
    classification: 'Vasoativa / Inotrópico Cardíaco',
    type: 'vasoativa',
    apresentacao: 'Ampola 250mg / 20mL',
    diluicoes: [
      { id: 'dobuta-4', label: '4 Ampolas (1000mg) + 170mL SF 0,9%', conc: 4000, unit: 'mcg/mL' }
    ],
    defaultDose: 5.0,
    defaultFlow: 5.3,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 2.0,
    therapeuticMax: 20.0,
    guideText: 'Dose usual: 2 a 20 mcg/kg/min. Suporte inotrópico para disfunção miocárdica de baixo débito.'
  },
  {
    id: 'dopamina',
    name: 'Dopamina',
    classification: 'Vasoativa / Catecolamina Inotrópica',
    type: 'vasoativa',
    apresentacao: 'Ampola 5 mg/mL (10mL = 50mg)',
    diluicoes: [
      { id: 'dopa-5', label: '5 Ampolas (250mg) + 200mL SG 5%', conc: 1000, unit: 'mcg/mL' }
    ],
    defaultDose: 5.0,
    defaultFlow: 21.0,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 1.0,
    therapeuticMax: 20.0,
    guideText: 'Faixas: Dopaminérgica (1-5 mcg/kg/min), Inotrópica/Beta (5-10 mcg/kg/min), Vasopressora/Alfa (10-20 mcg/kg/min).'
  },
  {
    id: 'nitroprussiato',
    name: 'Nitroprussiato de Sódio (Nipride)',
    classification: 'Vasoativa / Vasodilatador Arterial Potente',
    type: 'vasoativa',
    apresentacao: 'Ampola 50mg / 2mL',
    diluicoes: [
      { id: 'nipride-1', label: '1 Ampola (50mg) + 248mL SG 5%', conc: 200, unit: 'mcg/mL' }
    ],
    defaultDose: 0.3,
    defaultFlow: 6.3,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 0.25,
    therapeuticMax: 10.0,
    guideText: 'Faixa usual: 0,25 a 0,5 mcg/kg/min. Dose limite de segurança para toxicidade por cianeto: 10 mcg/kg/min.'
  },
  {
    id: 'nitroglicerina',
    name: 'Nitroglicerina (Tridil)',
    classification: 'Vasoativa / Vasodilatador Venoso',
    type: 'vasoativa',
    apresentacao: 'Ampola 5 mg/mL (5mL ou 10mL)',
    diluicoes: [
      { id: 'tridil-1', label: '10 mL (50mg) + 240mL SG 5%', conc: 200, unit: 'mcg/mL' }
    ],
    defaultDose: 10.0,
    defaultFlow: 3.0,
    doseUnit: 'mcg/min',
    therapeuticMin: 5.0,
    therapeuticMax: 200.0,
    guideText: 'Dose usual: 5 a 10 mcg/min (faixa terapêutica estendida: 5 a 200 mcg/min). Não depende do peso corporal.'
  },
  {
    id: 'levosimendan',
    name: 'Levosimendan',
    classification: 'Vasoativa / Sensibilizador de Cálcio Inodilatador',
    type: 'vasoativa',
    apresentacao: 'Ampola 2.5 mg/mL (5mL = 12.5mg)',
    diluicoes: [
      { id: 'levo-1', label: '1 Ampola (12.5mg) + 495mL SG 5%', conc: 25, unit: 'mcg/mL' }
    ],
    defaultDose: 0.1,
    defaultFlow: 16.8,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 0.05,
    therapeuticMax: 0.2,
    guideText: 'Ataque: 6-12 mcg/kg/min por 10 minutos (opcional). Manutenção: 0,05 a 0,2 mcg/kg/min.'
  },
  {
    id: 'midazolam',
    name: 'Midazolam',
    classification: 'Sedativo / Benzodiazepínico',
    type: 'sedacao',
    apresentacao: 'Ampola 50mg/10mL ou ampolas menores',
    diluicoes: [
      { id: 'mida-4', label: '4 Ampolas of 10mL (200mg) + 210mL SF 0,9%', conc: 0.8, unit: 'mg/mL' },
      { id: 'mida-3', label: '3 Ampolas of 10mL (150mg) + 120mL SF 0,9%', conc: 1.0, unit: 'mg/mL' }
    ],
    defaultDose: 0.05,
    defaultFlow: 4.4,
    doseUnit: 'mg/kg/h',
    therapeuticMin: 0.01,
    therapeuticMax: 0.1,
    guideText: 'Infusão contínua regular: 0,01 a 0,1 mg/kg/h. Se Estado de Mal Epilético (Status): 1,5 a 3,0 mg/kg/h.'
  },
  {
    id: 'propofol',
    name: 'Propofol',
    classification: 'Sedativo Anestésico de Ação Ultrarápida',
    type: 'sedacao',
    apresentacao: 'Frasco 1% (10mg/mL) ou 2% (20mg/mL)',
    diluicoes: [
      { id: 'prop-1', label: 'Pura 1% (Equivalente a 10000 mcg/mL)', conc: 10000, unit: 'mcg/mL' },
      { id: 'prop-2', label: 'Pura 2% (Equivalente a 20000 mcg/mL)', conc: 20000, unit: 'mcg/mL' }
    ],
    defaultDose: 20.0,
    defaultFlow: 8.4,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 5.0,
    therapeuticMax: 50.0,
    guideText: 'Dose recomendada: 5 a 50 mcg/kg/min. Cuidado com síndrome de infusão de propofol (PRIS) em doses > 50-80 mcg/kg/min.'
  },
  {
    id: 'precedex',
    name: 'Precedex (Dexmedetomidina)',
    classification: 'Sedativo / Agonista Alfa-2 Adrenérgico Seletivo',
    type: 'sedacao',
    apresentacao: 'Ampola 100 mcg/mL (2mL = 200mcg)',
    diluicoes: [
      { id: 'prec-2', label: '2 Ampolas (400mcg) + 96mL SF 0,9%', conc: 4, unit: 'mcg/mL' }
    ],
    defaultDose: 0.5,
    defaultFlow: 5.2,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 0.2,
    therapeuticMax: 1.5,
    guideText: 'Dose usual: 0,2 a 1,5 mcg/kg/min. Evita depressão respiratória importante, facilita o desmame de ventilação mecânica.'
  },
  {
    id: 'quetamina',
    name: 'Quetamina',
    classification: 'Sedativo Dissociativo & Analgésico Adjuvante',
    type: 'sedacao',
    apresentacao: 'Frasco de 50mg/mL (10mL = 500mg)',
    diluicoes: [
      { id: 'quet-1', label: '1 Ampola (10mL) + 240mL SF 0,9%', conc: 2, unit: 'mg/mL' }
    ],
    defaultDose: 0.5,
    defaultFlow: 17.5,
    doseUnit: 'mg/kg/h',
    therapeuticMin: 0.5,
    therapeuticMax: 1.2,
    guideText: 'Dose usual: 0,5 a 1,2 mg/kg/h. Em caso de Broncoespasmo refratário extremo: 2,5 a 3,0 mg/kg/h.'
  },
  {
    id: 'rocuronio',
    name: 'Rocurônio',
    classification: 'Bloqueador Neuromuscular não-despolarizante',
    type: 'neuromuscular',
    apresentacao: 'Ampola 10mg/mL (5mL = 50mg)',
    diluicoes: [
      { id: 'rocur-5', label: '5 Ampolas (250mg) + 225mL SF 0,9%', conc: 1000, unit: 'mcg/mL' }
    ],
    defaultDose: 5.0,
    defaultFlow: 21.0,
    doseUnit: 'mcg/kg/min',
    therapeuticMin: 3.0,
    therapeuticMax: 8.0,
    guideText: 'Dose usual recomendada: 3 a 8 mcg/kg/min. Indicado sob ventilação mecânica para combater dessincronia profunda.'
  }
];

export default function CalculatorTab() {
  const [patientWeightInput, setPatientWeightInput] = useState<string>('70');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'vasoativa' | 'sedacao' | 'neuromuscular'>('all');

  // Interactive drug states for two-way calculations
  const [inputs, setInputs] = useState<Record<string, {
    selectedDilutionId: string;
    targetDose: string; // From Dose to ml/h
    targetFlow: string; // From ml/h to Dose
    adrenMode: 'choque' | 'bradicardia'; // Special case for Adrenalina card
  }>>({});

  // Initialize input values for each drug
  useEffect(() => {
    const initialInputs: Record<string, any> = {};
    DRUGS_DATA.forEach(drug => {
      initialInputs[drug.id] = {
        selectedDilutionId: drug.diluicoes[0].id,
        targetDose: drug.defaultDose.toString(),
        targetFlow: drug.defaultFlow.toString(),
        adrenMode: 'choque'
      };
    });
    setInputs(initialInputs);
  }, []);

  // Celsius - Fahrenheit Converter state
  const [celsius, setCelsius] = useState<string>('');
  const [fahrenheit, setFahrenheit] = useState<string>('');

  const handleCelsiusChange = (val: string) => {
    setCelsius(val);
    if (val === '') {
      setFahrenheit('');
    } else {
      const converted = (Number(val) * 9) / 5 + 32;
      setFahrenheit(converted.toFixed(1));
    }
  };

  const handleFahrenheitChange = (val: string) => {
    setFahrenheit(val);
    if (val === '') {
      setCelsius('');
    } else {
      const converted = ((Number(val) - 32) * 5) / 9;
      setCelsius(converted.toFixed(1));
    }
  };

  // Safe parsing
  const weight = parseFloat(patientWeightInput) || 0;

  // Handle updates in a drug's inputs
  const updateDrugInput = (drugId: string, fields: Partial<typeof inputs[string]>) => {
    setInputs(prev => ({
      ...prev,
      [drugId]: {
        ...prev[drugId],
        ...fields
      }
    }));
  };

  // Calculate results on the fly
  const calculateFlow = (drug: Drug, drugState: typeof inputs[string] | undefined) => {
    if (!drugState || weight <= 0) return { flow: 0, text: 'Massa/Peso inválido' };

    const dil = drug.diluicoes.find(d => d.id === drugState.selectedDilutionId) || drug.diluicoes[0];
    const dose = parseFloat(drugState.targetDose) || 0;
    const conc = dil.conc;

    // Determine target unit
    let unit = drug.doseUnit;
    if (drug.id === 'adrenalina') {
      unit = drugState.adrenMode === 'choque' ? 'mcg/kg/min' : 'mcg/min';
    }

    if (unit === 'mcg/kg/min') {
      // mL/h = (Dose * weight * 60) / conc
      const flow = (dose * weight * 60) / conc;
      return { flow, formatted: flow.toFixed(1) + ' mL/h' };
    } else if (unit === 'mcg/min') {
      // mL/h = (Dose * 60) / conc
      const flow = (dose * 60) / conc;
      return { flow, formatted: flow.toFixed(1) + ' mL/h' };
    } else if (unit === 'U/min') {
      // mL/h = (Dose * 60) / conc
      const flow = (dose * 60) / conc;
      return { flow, formatted: flow.toFixed(1) + ' mL/h' };
    } else if (unit === 'mg/kg/h') {
      // mL/h = (Dose * weight) / conc
      const flow = (dose * weight) / conc;
      return { flow, formatted: flow.toFixed(1) + ' mL/h' };
    }

    return { flow: 0, formatted: '0.0 mL/h' };
  };

  const calculateDose = (drug: Drug, drugState: typeof inputs[string] | undefined) => {
    if (!drugState || weight <= 0) return { dose: 0, formatted: '-', label: 'Dose do Paciente', status: 'normal' };

    const dil = drug.diluicoes.find(d => d.id === drugState.selectedDilutionId) || drug.diluicoes[0];
    const flow = parseFloat(drugState.targetFlow) || 0;
    const conc = dil.conc;

    // Determine target unit
    let unit = drug.doseUnit;
    let categoryMaxStr = '';
    if (drug.id === 'adrenalina') {
      unit = drugState.adrenMode === 'choque' ? 'mcg/kg/min' : 'mcg/min';
    }

    let dose = 0;
    let formatted = '';

    if (unit === 'mcg/kg/min') {
      // Dose = (mL/h * conc) / (weight * 60)
      dose = (flow * conc) / (weight * 60);
      formatted = `${dose.toFixed(3)} mcg/kg/min`;
    } else if (unit === 'mcg/min') {
      // Dose = (mL/h * conc) / 60
      dose = (flow * conc) / 60;
      formatted = `${dose.toFixed(1)} mcg/min`;
    } else if (unit === 'U/min') {
      // Dose = (mL/h * conc) / 60
      dose = (flow * conc) / 60;
      formatted = `${dose.toFixed(3)} U/min`;
    } else if (unit === 'mg/kg/h') {
      // Dose = (mL/h * conc) / weight
      dose = (flow * conc) / weight;
      formatted = `${dose.toFixed(3)} mg/kg/h`;
    }

    // Evaluate therapeutic safety
    let status: 'low' | 'normal' | 'high' = 'normal';
    let minLimit = drug.therapeuticMin;
    let maxLimit = drug.therapeuticMax;

    if (drug.id === 'adrenalina') {
      if (drugState.adrenMode === 'choque') {
        minLimit = 0.01;
        maxLimit = 0.5;
      } else {
        minLimit = 2;
        maxLimit = 10;
      }
    }

    if (dose < minLimit && flow > 0) {
      status = 'low';
    } else if (dose > maxLimit) {
      status = 'high';
    }

    const labels: Record<string, string> = {
      noradrenalina: `Dose usual: ${minLimit}-${maxLimit} mcg/kg/min`,
      vasopressina: `Dose recomendada: ${minLimit}-${maxLimit} U/min`,
      adrenalina: drugState.adrenMode === 'choque' ? 'Dose choque: 0.01-0.5 mcg/kg/min' : 'Dose bradi: 2-10 mcg/min',
      dobutamina: `Dose usual: ${minLimit}-${maxLimit} mcg/kg/min`,
      dopamina: `Dose total: 1-20 mcg/kg/min`,
      nitroprussiato: `Dose recomendada: 0.25-0.5. Alerta: Max 10 mcg/kg/min`,
      nitroglicerina: `Faixa: 5-200 mcg/min`,
      levosimendan: `Manutenção: 0.05-0.2 mcg/kg/min`,
      midazolam: drugState.adrenMode === 'choque' ? 'Status: 1.5-3.0 mg/kg/h' : 'Usual: 0.01-0.1 mg/kg/h',
      propofol: `Dose recomendada: 5-50 mcg/kg/min`,
      precedex: `Dose usual: 0.2-1.5 mcg/kg/min`,
      quetamina: `Dose usual: 0.5-1.2 mg/kg/h`,
      rocuronio: `Dose usual: 3-8 mcg/kg/min`
    };

    if (drug.id === 'midazolam') {
      // handle specific midazolam criteria
      if (dose >= 0.01 && dose <= 0.1) status = 'normal';
      else if (dose > 0.1 && dose < 1.5) status = 'high'; // high for normal use but still below epilepsy
      else if (dose >= 1.5 && dose <= 3.0) status = 'normal'; // labeled acceptable as special clinical status
      else if (dose > 3.0) status = 'high';
    }

    return {
      dose,
      formatted,
      label: labels[drug.id] || `Faixa recomendada: ${minLimit} - ${maxLimit}`,
      status
    };
  };

  // Filtered drug listing
  const filteredDrugs = DRUGS_DATA.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          drug.classification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || drug.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Patient Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-slate-905 dark:to-indigo-950 p-6 rounded-2xl border border-blue-600 dark:border-slate-800 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 dark:bg-slate-800 rounded-xl">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Calculadora de Infusão Contínua (BICs)</h2>
                <p className="text-xs text-blue-100 dark:text-slate-400">Dimensione e converta doses e vazões de drogas vasoativas e sedativas beira-leito.</p>
              </div>
            </div>
          </div>

          {/* Patient Weight Input */}
          <div className="bg-white/10 dark:bg-slate-900/60 p-4 rounded-xl border border-white/15 dark:border-slate-800 flex items-center gap-4.5 max-w-sm self-start md:self-auto min-w-[260px]">
            <div className="p-2 bg-white/10 dark:bg-slate-800 rounded-lg text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="patient-weight" className="block text-[10px] font-bold text-blue-200 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                Peso do Paciente (Referência)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="patient-weight"
                  type="number"
                  step="0.5"
                  min="2"
                  max="300"
                  placeholder="Ex: 70"
                  value={patientWeightInput}
                  onChange={(e) => setPatientWeightInput(e.target.value)}
                  className="w-full bg-slate-900/80 text-white rounded-md border border-slate-700 px-2 py-1 text-base font-bold text-center focus:outline-hidden focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
                <span className="text-sm font-bold text-white">kg</span>
              </div>
            </div>
          </div>
        </div>

        {weight <= 0 && (
          <div className="mt-4 bg-amber-500/20 border border-amber-500/40 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Atenção: Insira um peso válido maior que zero para carregar as contas dependentes de peso corporal.</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        
        {/* Filters & Tabs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Filtrar por nome ou classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium transition-all"
            />
          </div>

          {/* Navigation Category Pill Selector */}
          <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', title: 'Todas' },
              { id: 'vasoativa', title: 'Vasoativas' },
              { id: 'sedacao', title: 'Sedação & Analgesia' },
              { id: 'neuromuscular', title: 'Bloqueadores' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
                    : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

        </div>

        {/* Drugs Calculators grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrugs.map(drug => {
            const drugState = inputs[drug.id];
            const flowCalc = calculateFlow(drug, drugState);
            const doseCalc = calculateDose(drug, drugState);
            const selectedDilution = drug.diluicoes.find(d => d.id === drugState?.selectedDilutionId) || drug.diluicoes[0];

            let currentUnit = drug.doseUnit;
            if (drug.id === 'adrenalina' && drugState) {
              currentUnit = drugState.adrenMode === 'choque' ? 'mcg/kg/min' : 'mcg/min';
            }

            return (
              <div key={drug.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs flex flex-col justify-between overflow-hidden">
                
                {/* Card Header */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-150 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          drug.type === 'vasoativa' ? 'bg-red-500' :
                          drug.type === 'sedacao' ? 'bg-emerald-500' : 'bg-cyan-500'
                        }`} />
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{drug.name}</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-semibold">{drug.classification}</p>
                    </div>
                    
                    {/* Badge class */}
                    <span className="text-[9px] bg-slate-200/80 dark:bg-slate-850 text-slate-650 dark:text-slate-300 font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                      {drug.type}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-1.5 rounded-md italic">
                    <strong className="text-slate-700 dark:text-slate-300">Apres:</strong> {drug.apresentacao}
                  </p>
                </div>

                {/* Calculator Body */}
                <div className="p-4 space-y-4 flex-1">
                  
                  {/* Dilution Choice */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                      Solução / Diluição Ativa:
                    </label>
                    <div className="space-y-1">
                      {drug.diluicoes.map(d => (
                        <label key={d.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-150 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors">
                          <input
                            type="radio"
                            name={`dilution-${drug.id}`}
                            checked={drugState?.selectedDilutionId === d.id}
                            onChange={() => updateDrugInput(drug.id, { selectedDilutionId: d.id })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 flex justify-between items-center text-[11px]">
                            <span className="font-medium">{d.label}</span>
                            <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">{d.conc} {d.unit}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Special Adrenalina Mode Toggle */}
                  {drug.id === 'adrenalina' && drugState && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-550 dark:text-slate-350 ml-1">Modo Clínico:</span>
                      <button
                        onClick={() => updateDrugInput(drug.id, { adrenMode: 'choque', targetDose: '0.1' })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                          drugState?.adrenMode === 'choque'
                            ? 'bg-blue-600 text-white font-extrabold'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        Choque (mcg/kg/min)
                      </button>
                      <button
                        onClick={() => updateDrugInput(drug.id, { adrenMode: 'bradicardia', targetDose: '5' })}
                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                          drugState?.adrenMode === 'bradicardia'
                            ? 'bg-blue-600 text-white font-extrabold'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        Bradi (mcg/min)
                      </button>
                    </div>
                  )}

                  {/* Two-Way Formulas Layout */}
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 space-y-4">
                    
                    {/* Converting Dose -> ml/h */}
                    <div className="bg-blue-500/5 dark:bg-blue-500/2 border border-blue-150 dark:border-blue-900/30 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider">
                        <span>1. Dose Pretendida ➔ Calcular ml/h</span>
                        <span className="bg-blue-100 dark:bg-blue-950/60 px-1 py-0.5 rounded-sm">Vazão (BIC)</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-400 mb-0.5 font-bold">DIGITE A DOSE:</label>
                          <div className="relative">
                            <input
                              type="number"
                              step={currentUnit.includes('mg') || drug.id === 'vasopressina' ? '0.01' : '0.1'}
                              min="0"
                              placeholder="0.0"
                              value={drugState?.targetDose || ''}
                              onChange={(e) => updateDrugInput(drug.id, { targetDose: e.target.value })}
                              className="w-full pl-2 pr-32 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs font-bold text-slate-800 dark:text-white"
                            />
                            <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-bold">{currentUnit}</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-center flex flex-col justify-center px-1">
                          <span className="text-slate-400 font-bold">➔</span>
                        </div>

                        <div className="w-[120px] bg-slate-900 dark:bg-slate-950 px-3 py-2.5 rounded-lg text-center flex flex-col justify-center border border-slate-705">
                          <span className="text-[9px] text-slate-400 font-bold select-none leading-none">VAZÃO ALVO</span>
                          <span className="text-sm font-black text-white mt-0.5 leading-none font-sans">
                            {flowCalc.formatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Converting ml/h -> Dose */}
                    <div className="bg-slate-500/5 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <span>2. Vazão Atual (ml/h) ➔ Calcular Dose</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded-sm">Dosagem do Paciente</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-400 mb-0.5 font-bold">BOMBA EM (ML/H):</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="Ex: 10"
                              value={drugState?.targetFlow || ''}
                              onChange={(e) => updateDrugInput(drug.id, { targetFlow: e.target.value })}
                              className="w-full pl-2 pr-12 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs font-bold text-slate-800 dark:text-white"
                            />
                            <span className="absolute right-2 top-1.5 text-[9px] text-slate-500 font-bold">mL/h</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-center flex flex-col justify-center px-1">
                          <span className="text-slate-400 font-bold">➔</span>
                        </div>

                        <div className={`w-[120px] px-3 py-2 rounded-lg text-center flex flex-col justify-center border ${
                          doseCalc.status === 'high' 
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-300' 
                            : doseCalc.status === 'low'
                            ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-350 font-black'
                        }`}>
                          <span className="text-[9px] font-bold select-none leading-none">DOSE RECEBIDA</span>
                          <span className="text-[11px] font-extrabold mt-0.5 break-all select-all font-sans">
                            {doseCalc.formatted}
                          </span>
                        </div>
                      </div>

                      {/* Safety Range indicator */}
                      <div className="flex items-center gap-1.5 pt-1.5 text-[10px] border-t border-slate-100 dark:border-slate-850">
                        {doseCalc.status === 'high' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : doseCalc.status === 'low' ? (
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className={`font-semibold ${
                          doseCalc.status === 'high' ? 'text-amber-700 dark:text-amber-450' :
                          doseCalc.status === 'low' ? 'text-slate-500' : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {doseCalc.label}
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Card Clinical Guide Footer */}
                <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border-t border-slate-150 dark:border-slate-800 text-[10px] text-slate-500 leading-relaxed shrink-0">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Guia de Conduta: </span>
                  {drug.guideText}
                </div>

              </div>
            );
          })}
        </div>

        {filteredDrugs.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-12 rounded-xl text-center">
            <p className="text-sm font-semibold text-slate-400">Nenhuma droga correspondente encontrada para os filtros aplicados.</p>
          </div>
        )}

      </div>

    </div>
  );
}
