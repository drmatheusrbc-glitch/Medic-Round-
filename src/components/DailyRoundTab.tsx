import React, { useState, useMemo } from 'react';
import { 
  PatientRound, 
  DietType, 
  PatientVitals, 
  PatientHydration, 
  PatientProphylaxis 
} from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  FileText, 
  Check, 
  AlertCircle, 
  Clock, 
  User, 
  Droplets, 
  ClipboardList, 
  Activity, 
  Share2, 
  ChevronRight, 
  Sparkles,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyRoundTabProps {
  patients: PatientRound[];
  onSavePatient: (patient: PatientRound) => void;
  onDeletePatient: (id: string) => void;
}

const defaultVitals = (): PatientVitals => ({
  fcMin: '', fcMax: '',
  frMin: '', frMax: '',
  pasMin: '', pasMax: '',
  padMin: '', padMax: '',
  tempMin: '', tempMax: '',
  satMin: '', satMax: ''
});

const defaultHydration = (): PatientHydration => ({
  entries: '',
  diuresis: '',
  otherSaidas: ''
});

const defaultProphylaxis = (): PatientProphylaxis => ({
  tvp: false,
  ulcer: false,
  eyeDrop: false
});

// Function to safely extract/parse a bed string into a sortable number
function getBedSortValue(bedStr: string): number {
  if (!bedStr) return 999;
  const match = bedStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 900 + bedStr.charCodeAt(0);
}

export default function DailyRoundTab({ patients, onSavePatient, onDeletePatient }: DailyRoundTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Form states matching his specific list format exactly
  const [formBed, setFormBed] = useState('');
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState<number | ''>('');
  
  // Custom bedside queue fields
  const [formFC, setFormFC] = useState<string>('');
  const [formFR, setFormFR] = useState<string>('');
  const [formPAS, setFormPAS] = useState<string>('');
  const [formPAD, setFormPAD] = useState<string>('');
  const [formSAT, setFormSAT] = useState<string>('');
  const [formTX, setFormTX] = useState<string>('');
  const [formDX, setFormDX] = useState<string>('');
  const [formE, setFormE] = useState<string>('');
  const [formS, setFormS] = useState<string>('');
  const [formBH, setFormBH] = useState<string>('');
  const [formDefecou, setFormDefecou] = useState<string>('');
  const [formExames, setFormExames] = useState<string>('');
  const [formCulturas, setFormCulturas] = useState<string>('');
  const [formProfilaxias, setFormProfilaxias] = useState<string>('');

  // Auto calculation of BH: Entradas (E) - Saídas (S)
  const calculateBH = (ent: string, sai: string) => {
    const eNum = parseFloat(ent);
    const sNum = parseFloat(sai);
    if (!isNaN(eNum) && !isNaN(sNum)) {
      const diff = eNum - sNum;
      return diff > 0 ? `+${diff}` : `${diff}`;
    }
    return '';
  };

  // Build local text block for a patient matching the exact specified layout
  const generateBedsideText = (p: PatientRound) => {
    const fcVal = p.fcTxt !== undefined ? p.fcTxt : (p.vitals.fcMax || p.vitals.fcMin || '');
    const frVal = p.frTxt !== undefined ? p.frTxt : (p.vitals.frMax || p.vitals.frMin || '');
    const pasVal = p.pasTxt !== undefined ? p.pasTxt : (p.vitals.pasMax || p.vitals.pasMin || '');
    const padVal = p.padTxt !== undefined ? p.padTxt : (p.vitals.padMax || p.vitals.padMin || '');
    const satVal = p.satTxt !== undefined ? p.satTxt : (p.vitals.satMax || p.vitals.satMin || '');

    return `LEITO ${p.bed}
NOME E IDADE: ${p.name || 'Não informado'}${p.age ? `, ${p.age} anos` : ''}

FC: ${fcVal}
FR: ${frVal}
PAS: ${pasVal}
PAD: ${padVal}
SAT: ${satVal}
TX: ${p.tx || ''}
DX: ${p.dx || ''}

E: ${p.hydration.entries !== '' ? `${p.hydration.entries} ml` : ''}
S: ${p.hydration.diuresis !== '' ? `${p.hydration.diuresis} ml` : ''}
BH: ${p.hydration.otherSaidas !== '' ? `${p.hydration.otherSaidas} ml` : ''}

DEFECOU: ${p.defecouTxt || ''}

EXAMES: ${p.exames || ''}

CULTURAS: ${p.culturas || ''}

PROFILAXIAS: ${p.profilaxiasText || ''}`;
  };

  const handleCopySingle = (p: PatientRound) => {
    const text = generateBedsideText(p);
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compile all beds sorted numerically/alphabetically into a clean passoff stream
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => getBedSortValue(a.bed) - getBedSortValue(b.bed));
  }, [patients]);

  const handleCopyAll = () => {
    if (sortedPatients.length === 0) return;
    const text = sortedPatients.map(p => generateBedsideText(p)).join('\n\n===================================\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleEdit = (p: PatientRound) => {
    setSelectedPatientId(p.id);
    setFormBed(p.bed);
    setFormName(p.name);
    setFormAge(p.age);
    
    // Core parameters mapping
    setFormFC(p.fcTxt !== undefined ? p.fcTxt : String(p.vitals.fcMax || p.vitals.fcMin || ''));
    setFormFR(p.frTxt !== undefined ? p.frTxt : String(p.vitals.frMax || p.vitals.frMin || ''));
    setFormPAS(p.pasTxt !== undefined ? p.pasTxt : String(p.vitals.pasMax || p.vitals.pasMin || ''));
    setFormPAD(p.padTxt !== undefined ? p.padTxt : String(p.vitals.padMax || p.vitals.padMin || ''));
    setFormSAT(p.satTxt !== undefined ? p.satTxt : String(p.vitals.satMax || p.vitals.satMin || ''));
    
    setFormTX(p.tx || '');
    setFormDX(p.dx || '');
    setFormE(String(p.hydration.entries || ''));
    setFormS(String(p.hydration.diuresis || ''));
    setFormBH(String(p.hydration.otherSaidas || ''));
    setFormDefecou(p.defecouTxt || '');
    setFormExames(p.exames || '');
    setFormCulturas(p.culturas || '');
    setFormProfilaxias(p.profilaxiasText || '');
    
    setIsEditing(true);
  };

  const handleNewPatientForm = () => {
    setSelectedPatientId(null);
    setFormBed(`LEITO ${patients.length + 1}`);
    setFormName('');
    setFormAge('');
    
    setFormFC('');
    setFormFR('');
    setFormPAS('');
    setFormPAD('');
    setFormSAT('');
    setFormTX('');
    setFormDX('');
    setFormE('');
    setFormS('');
    setFormBH('');
    setFormDefecou('');
    setFormExames('');
    setFormCulturas('');
    setFormProfilaxias('');
    
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBed) return;

    // Convert inputs safely to integers/decimals if they correspond to vitals or hydration model properties to keep system functional
    const fcVal = formFC ? parseInt(formFC, 10) : '';
    const frVal = formFR ? parseInt(formFR, 10) : '';
    const pasVal = formPAS ? parseInt(formPAS, 10) : '';
    const padVal = formPAD ? parseInt(formPAD, 10) : '';
    const satVal = formSAT ? parseInt(formSAT, 10) : '';

    const saved: PatientRound = {
      id: selectedPatientId || crypto.randomUUID(),
      name: formName || 'Não Informado',
      age: formAge !== '' ? Number(formAge) : '',
      bed: formBed.toUpperCase().replace('LEITO', '').trim(), // Clean and unified ID
      vitals: {
        fcMin: fcVal,
        fcMax: fcVal,
        frMin: frVal,
        frMax: frVal,
        pasMin: pasVal,
        pasMax: pasVal,
        padMin: padVal,
        padMax: padVal,
        tempMin: formTX ? parseFloat(formTX) : '',
        tempMax: formTX ? parseFloat(formTX) : '',
        satMin: satVal,
        satMax: satVal
      },
      hydration: {
        entries: formE !== '' ? Number(formE) : '',
        diuresis: formS !== '' ? Number(formS) : '',
        otherSaidas: formBH // Storing directly into otherSaidas for backwards compatible custom value representation
      },
      dietType: 'VO',
      dietObs: '',
      evacuated: formDefecou.toLowerCase().includes('sim'),
      prophylaxis: defaultProphylaxis(),
      occurrences: formExames || '',
      createdAt: new Date().toISOString(),
      tx: formTX,
      dx: formDX,
      defecouTxt: formDefecou,
      exames: formExames,
      culturas: formCulturas,
      profilaxiasText: formProfilaxias,
      fcTxt: formFC,
      frTxt: formFR,
      pasTxt: formPAS,
      padTxt: formPAD,
      satTxt: formSAT
    };

    onSavePatient(saved);
    setIsEditing(false);
  };

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return sortedPatients;
    return sortedPatients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bed.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedPatients, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Dynamic Header Workspace */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 id="round-title" className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-tight">Fila de Leitos / Round Diário</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Preencha e organize de forma rápida o passof diário por leito em formato de fila unificada.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {patients.length > 0 && (
            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl border transition-all ${
                copiedAll 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 border-slate-200 dark:border-slate-705'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-sky-500" />}
              Copiar Fila Completa
            </button>
          )}
          <button
            id="btn-add-patient"
            onClick={handleNewPatientForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Adicionar Novo Leito
          </button>
        </div>
      </div>

      {/* Main Switch: Queue List vs Patient Bed Editor Form */}
      {!isEditing ? (
        <div className="space-y-5 animate-fade-in">
          {/* Quick Filter Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-patients"
              type="text"
              placeholder="Pesquisar por leito ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-850 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
            />
          </div>

          {filteredPatients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-slate-755 dark:text-slate-350 text-sm">Fila de Leitos Vazia</p>
              <p className="text-xs text-slate-450 mt-1.5 max-w-sm mx-auto leading-relaxed">Não há leitos cadastrados neste round de visita. Toque em 'Adicionar Novo Leito' acima para registrar seu primeiro leito.</p>
              <button
                onClick={handleNewPatientForm}
                className="mt-4 inline-flex items-center gap-1.5 bg-blue-550 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Leito
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredPatients.map((p) => {
                  const hasValues = p.name || p.vitals.fcMax || p.tx || p.dx || p.exames;
                  return (
                    <motion.div
                      key={p.id}
                      layoutId={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850/60 shadow-xs hover:shadow-md hover:border-slate-250 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Bed Header Indicator */}
                      <div className="bg-slate-50/70 dark:bg-slate-950/30 px-4 py-3 border-b border-slate-100 dark:border-slate-850/50 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[11px]">
                            L
                          </span>
                          <span className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                            LEITO {p.bed}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            title="Editar Dados do Leito"
                            className="p-1 px-1.5 text-[10px] font-bold hover:bg-slate-200/60 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3 h-3 inline mr-1" />
                            Editar
                          </button>
                          <button
                            onClick={() => onDeletePatient(p.id)}
                            title="Remover"
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Clinical Content exactly mirroring the requested format fields */}
                      <div className="p-4 flex-1 space-y-4">
                        <div className="bg-slate-50/40 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-850/30">
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Nome e Idade:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block mt-0.5">
                            {p.name || 'Não informado'}{p.age ? `, ${p.age} anos` : ''}
                          </span>
                        </div>

                        {/* Vitals Column Grid */}
                        <div className="grid grid-cols-2 gap-3.5 text-xs">
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-400">FC:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-250">{p.fcTxt || p.vitals.fcMax || '--'} <span className="text-[8px] font-normal text-slate-400">bpm</span></span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-400">FR:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-250">{p.frTxt || p.vitals.frMax || '--'} <span className="text-[8px] font-normal text-slate-400">irpm</span></span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-400">PA:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-250">
                                {p.pasTxt && p.padTxt ? `${p.pasTxt}/${p.padTxt}` : (p.pasTxt || p.padTxt || p.vitals.pasMax ? `${p.vitals.pasMax || '--'}/${p.vitals.padMax || '--'}` : '--')}{' '}
                                <span className="text-[8px] font-normal text-slate-400">mmHg</span>
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-400">SAT:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-250">
                                {p.satTxt !== undefined ? p.satTxt : (p.vitals.satMax ? `${p.vitals.satMax}%` : '--')}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 border-l border-slate-100 dark:border-slate-850 pl-3.5">
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-400">TX:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-250">{p.tx ? `${p.tx} ºC` : '--'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-400">DX:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-250">{p.dx ? `${p.dx} mg/dL` : '--'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-505">E / S:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {p.hydration.entries !== '' ? `${p.hydration.entries}` : '--'}/{p.hydration.diuresis !== '' ? `${p.hydration.diuresis}` : '--'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 dark:border-slate-900 pb-1">
                              <span className="text-[10px] font-extrabold text-slate-450">BH:</span>
                              <span className={`font-black ${
                                String(p.hydration.otherSaidas).startsWith('+') 
                                  ? 'text-sky-600 dark:text-sky-400' 
                                  : String(p.hydration.otherSaidas).startsWith('-')
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-800 dark:text-slate-250'
                              }`}>{p.hydration.otherSaidas || '--'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Defecou indicator */}
                        <div className="text-xs flex items-center gap-2 border-t border-slate-100 dark:border-slate-850/60 pt-2 pb-0.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">DEFECOU:</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            p.defecouTxt && p.defecouTxt.toLowerCase().includes('sim')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/10'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-transparent'
                          }`}>
                            {p.defecouTxt || 'Não informado'}
                          </span>
                        </div>

                        {/* Text fields snippets */}
                        <div className="text-xs space-y-2 border-t border-slate-100 dark:border-slate-850/60 pt-3">
                          {p.exames && (
                            <div className="line-clamp-2">
                              <strong className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">EXAMES:</strong>
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-950/20 px-2 py-1 rounded-md mt-0.5 mt-0.5 truncate">{p.exames}</p>
                            </div>
                          )}
                          {p.culturas && (
                            <div className="line-clamp-2">
                              <strong className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">CULTURAS:</strong>
                              <p className="text-[11px] text-slate-605 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-900/20 px-2 py-1 rounded-md mt-0.5 truncate">{p.culturas}</p>
                            </div>
                          )}
                          {p.profilaxiasText && (
                            <div className="line-clamp-2">
                              <strong className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">PROFILAXIAS:</strong>
                              <p className="text-[11px] text-slate-605 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-900/20 px-2 py-1 rounded-md mt-0.5 truncate">{p.profilaxiasText}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clipboard copy footer action */}
                      <button
                        onClick={() => handleCopySingle(p)}
                        className={`w-full py-2.5 border-t text-xs font-bold transition-all flex items-center justify-center gap-2 select-none ${
                          copiedId === p.id
                            ? 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-400'
                            : 'bg-slate-50/30 hover:bg-slate-100/50 border-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-850 text-blue-600 hover:text-blue-750 dark:text-blue-400'
                        }`}
                      >
                        {copiedId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Copiado Prontuário Unitário!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Texto Leito {p.bed}
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        /* Bedside Editor Form */
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-2xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4">
            <div>
              <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Fila de Leitos
              </span>
              <h3 className="text-base font-black text-slate-850 dark:text-white mt-1">
                {selectedPatientId ? `Editar Leito ${formBed}` : 'Registrar Novo Leito'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-350 font-bold text-xs rounded-xl border border-slate-200 dark:border-transparent transition-colors"
            >
              Voltar ao Round
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Leito Input */}
            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">Identificação / Leito *</label>
              <input
                required
                type="text"
                placeholder="Ex: 1, 03, UTI 05, etc."
                value={formBed}
                onChange={(e) => setFormBed(e.target.value)}
                className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white font-bold uppercase placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">Nome do Paciente</label>
              <input
                type="text"
                placeholder="Nome completo do paciente"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {/* Idade */}
            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">Idade (Anos)</label>
              <input
                type="number"
                min="0"
                max="130"
                placeholder="Ex: 72"
                value={formAge}
                onChange={(e) => setFormAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {/* Dextro */}
            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">DX (Dextro / HGT)</label>
              <input
                type="text"
                placeholder="Ex: 120, 240 ou Não testado"
                value={formDX}
                onChange={(e) => setFormDX(e.target.value)}
                className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 animate-pulse"
              />
            </div>
            {/* Temperatura */}
            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">TX (Temperatura)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: 36.5 ou Afebril"
                  value={formTX}
                  onChange={(e) => setFormTX(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFormTX('36.5')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md"
                >
                  Reg
                </button>
              </div>
            </div>
          </div>

          {/* Vitals Grid Inputs */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-red-500" />
              Sinais Vitais Principais
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">FC (Frequência Cardíaca)</label>
                <input
                  type="text"
                  placeholder="Ex: 85, 110"
                  value={formFC}
                  onChange={(e) => setFormFC(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-5-0/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">FR (Frequência Respiratória)</label>
                <input
                  type="text"
                  placeholder="Ex: 18, 22"
                  value={formFR}
                  onChange={(e) => setFormFR(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-5-0/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">PAS (Pressão Arterial Sist.)</label>
                <input
                  type="text"
                  placeholder="Ex: 120, 140"
                  value={formPAS}
                  onChange={(e) => setFormPAS(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-5-0/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">PAD (Pressão Arterial Diast.)</label>
                <input
                  type="text"
                  placeholder="Ex: 80, 90"
                  value={formPAD}
                  onChange={(e) => setFormPAD(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-5-0/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">SAT (Saturação %)</label>
                <input
                  type="text"
                  placeholder="Ex: 98, 95"
                  value={formSAT}
                  onChange={(e) => setFormSAT(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-5-0/40 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Hydration E, S and Balanço Hídrico calculation */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <Droplets className="w-4 h-4 text-sky-500 hover:text-sky-600" />
              E / S & Balanço Hídrico (BH)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">E (Entradas em ml)</label>
                <input
                  type="text"
                  placeholder="Ex: 1850"
                  value={formE}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormE(val);
                    const calc = calculateBH(val, formS);
                    if (calc) setFormBH(calc);
                  }}
                  className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">S (Saídas em ml)</label>
                <input
                  type="text"
                  placeholder="Ex: 1550"
                  value={formS}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormS(val);
                    const calc = calculateBH(formE, val);
                    if (calc) setFormBH(calc);
                  }}
                  className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-855 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">BH (Balanço Hídrico)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: +300 ou -120"
                    value={formBH}
                    onChange={(e) => setFormBH(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-920 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-black text-blue-700 dark:text-blue-300"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 select-none uppercase tracking-widest leading-none">
                    Calculado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Defecou and detailed text fields */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1.5">DEFECOU (Insira texto / Sim / Não)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Sim (1x pastoso), Não, Em jejum ou Ausente"
                  value={formDefecou}
                  onChange={(e) => setFormDefecou(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setFormDefecou('Sim')}
                  className="px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold text-xs rounded-xl"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormDefecou('Não')}
                  className="px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-xs rounded-xl"
                >
                  Não
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">EXAMES Recentes</label>
              <textarea
                rows={2}
                placeholder="Especifique novos resultados laboratoriais ou exames de imagem..."
                value={formExames}
                onChange={(e) => setFormExames(e.target.value)}
                className="w-full p-3 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">CULTURAS Colhidas ou Ativas</label>
              <textarea
                rows={2}
                placeholder="Descreva culturas e resultados (Ex: Hemocultura parcial negativa, urinocultura esterilizado)..."
                value={formCulturas}
                onChange={(e) => setFormCulturas(e.target.value)}
                className="w-full p-3 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-450 uppercase mb-1">PROFILAXIAS Ativas</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Ex: Anti-TVP, Omeprazol, Colírio contra úlcera de córnea ativos..."
                  value={formProfilaxias}
                  onChange={(e) => setFormProfilaxias(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-500/5 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-hidden"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFormProfilaxias('TVP e Úlcera gástrica ativas')}
                    className="text-[10px] font-bold bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-transparent transition-colors"
                  >
                    Profilaxias Completas Ativas
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormProfilaxias('TVP ativa / Proteção gástrica')}
                    className="text-[10px] font-bold bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-transparent transition-colors"
                  >
                    TVP + Gástrica
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-850/60">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-transparent transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Salvar Leito na Fila
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
