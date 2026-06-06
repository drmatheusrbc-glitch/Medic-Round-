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
  ArrowRight, 
  Check, 
  AlertCircle, 
  Moon, 
  Sun, 
  Calendar,
  Share2,
  Clock,
  User,
  Heart,
  Droplets,
  ClipboardList,
  Flame,
  Activity,
  Files
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

export default function DailyRoundTab({ patients, onSavePatient, onDeletePatient }: DailyRoundTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState<PatientRound | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState<number | ''>('');
  const [formBed, setFormBed] = useState('');
  const [formVitals, setFormVitals] = useState<PatientVitals>(defaultVitals());
  const [formHydration, setFormHydration] = useState<PatientHydration>(defaultHydration());
  const [formDietType, setFormDietType] = useState<DietType>('VO');
  const [formDietObs, setFormDietObs] = useState('');
  const [formEvacuated, setFormEvacuated] = useState(false);
  const [formProphylaxis, setFormProphylaxis] = useState<PatientProphylaxis>(defaultProphylaxis());
  const [formOccurrences, setFormOccurrences] = useState('');

  // Sinais vitais ranges & alarms
  const checkVitalIssues = (vitals: PatientVitals) => {
    const alerts: string[] = [];
    if (vitals.fcMax && vitals.fcMax > 120) alerts.push(`Taquicardia severa (${vitals.fcMax} bpm)`);
    if (vitals.fcMin && vitals.fcMin < 50) alerts.push(`Bradicardia severa (${vitals.fcMin} bpm)`);
    if (vitals.frMax && vitals.frMax > 24) alerts.push(`Taquipneia (${vitals.frMax} irpm)`);
    if (vitals.frMin && vitals.frMin < 10) alerts.push(`Bradipneia (${vitals.frMin} irpm)`);
    if (vitals.satMin && vitals.satMin < 90) alerts.push(`Hipoxemia (<90% Sat O₂: ${vitals.satMin}%)`);
    if (vitals.tempMax && vitals.tempMax > 38.3) alerts.push(`Hipertermia / Febre (${vitals.tempMax} °C)`);
    if (vitals.tempMin && vitals.tempMin < 35.0) alerts.push(`Hipotermia (${vitals.tempMin} °C)`);
    
    // Pressões
    if (vitals.pasMax && vitals.pasMax > 160) alerts.push(`PAS elevada (${vitals.pasMax} mmHg)`);
    if (vitals.pasMin && vitals.pasMin < 90) alerts.push(`Hipotensão sistólica (${vitals.pasMin} mmHg)`);
    return alerts;
  };

  const getHydrationBalance = (hydration: PatientHydration) => {
    const ent = Number(hydration.entries) || 0;
    const diur = Number(hydration.diuresis) || 0;
    const out = Number(hydration.otherSaidas) || 0;
    const balence = ent - (diur + out);
    return {
      balance: balence,
      colorClass: balence === 0 
        ? 'text-emerald-600 dark:text-emerald-400 font-semibold' 
        : balence < 0 
          ? 'text-sky-600 dark:text-sky-400 font-semibold' 
          : 'text-rose-600 dark:text-rose-400 font-semibold',
      bgColor: balence === 0
        ? 'bg-emerald-50 dark:bg-emerald-950/30'
        : balence < 0
          ? 'bg-sky-50 dark:bg-sky-950/30'
          : 'bg-rose-50 dark:bg-rose-950/30',
      text: balence === 0 ? 'Neutro' : balence < 0 ? 'Negativo' : 'Positivo'
    };
  };

  const generateSummaryText = (p: PatientRound) => {
    const isMasc = true; // generic, can infer from Portuguese sentence patterns
    const { balance, text: balText } = getHydrationBalance(p.hydration);
    
    const v = p.vitals;
    let vitalsSegment = '';
    if (v.fcMin || v.fcMax || v.frMax || v.pasMin || v.pasMax || v.satMin) {
      vitalsSegment = `Apresentou sinais vitais nas últimas 24h com: FC ${v.fcMin || 'N/A'}-${v.fcMax || 'N/A'} bpm; FR ${v.frMin || 'N/A'}-${v.frMax || 'N/A'} irpm; PA ${v.pasMin || 'N/A'}/${v.padMin || 'N/A'} a ${v.pasMax || 'N/A'}/${v.padMax || 'N/A'} mmHg; Temp ${v.tempMin || 'N/A'}-${v.tempMax || 'N/A'} °C; Saturação de O₂ mínima de ${v.satMin || 'N/A'}%.`;
    } else {
      vitalsSegment = 'Parâmetros de sinais vitais estáveis nas últimas 24h ou não registrados.';
    }

    const bhSegment = `Balanço hídrico acumulado de ${balance} ml em 24h (Balanço ${balText.toLowerCase()}: Entradas de ${p.hydration.entries || 0} ml, Saídas de ${(Number(p.hydration.diuresis)||0) + (Number(p.hydration.otherSaidas)||0)} ml).`;
    
    let dietaText = '';
    if (p.dietType === 'VO') dietaText = `Via Oral (${p.dietObs || 'sem restrições'})`;
    else if (p.dietType === 'Enteral') dietaText = `Dieta Enteral (${p.dietObs || 'conforme prescrição'})`;
    else if (p.dietType === 'Parenteral') dietaText = `Nutrição Parenteral (${p.dietObs || 'conforme protocolo'})`;
    else dietaText = `Jejum absoluto (${p.dietObs || 'sem outras observações'})`;

    const evacText = p.evacuated ? 'Egressões presentes (evacuação registrada).' : 'Ausência de evacuação nas últimas 24h.';
    
    const profs: string[] = [];
    if (p.prophylaxis.tvp) profs.push('profilaxia de TVP ativa');
    if (p.prophylaxis.ulcer) profs.push('proteção gástrica/úlcera de estresse');
    if (p.prophylaxis.eyeDrop) profs.push('colírio de proteção ocular');
    const profsText = profs.length > 0 
      ? `Em uso de profilaxias: ${profs.join(', ')}.` 
      : 'Nenhuma medida profilática profilaxia padrão registrada.';

    const interText = p.occurrences 
      ? `Intercorrências relatadas: ${p.occurrences}` 
      : 'Sem intercorrências clínicas dignas de nota registradas nas últimas 24h.';

    return `ROUND CLÍNICO DIÁRIO\n--------------------\nPaciente: ${p.name}\nIdade: ${p.age} anos | Leito: ${p.bed}\n\nSINAIS VITAIS (Últimas 24h):\n${vitalsSegment}\n\nBALANÇO HÍDRICO & ELIMINAÇÕES:\n- ${bhSegment}\n- Evacuação: ${evacText}\n\nDIETA & SUPORTE:\n- Tipo de Dieta: ${dietaText}\n- ${profsText}\n\nEVOLUÇÃO & INTERCORRÊNCIAS:\n- ${interText}\n\nResumo para Prontuário:\nPaciente ${p.name}, leito ${p.bed}, ${p.age} anos. ${vitalsSegment} No controle hídrico de 24 horas, obteve balanço de ${balance} ml. Mantém suporte nutricional via ${dietaText}. ${evacText} ${profsText} Nas últimas 24 horas, ${p.occurrences ? p.occurrences : 'não apresentou novas intercorrências relevantes'}. Conduta e plano terapêutico mantidos.`;
  };

  const handleCopySummary = (p: PatientRound) => {
    const text = generateSummaryText(p);
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateAllSummariesText = () => {
    return patients.map(p => {
      return `==================================================\nLEITO: ${p.bed} - PACIENTE: ${p.name} (${p.age} anos)\n==================================================\n${generateSummaryText(p)}`;
    }).join('\n\n\n');
  };

  const handleCopyAll = () => {
    const text = generateAllSummariesText();
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const patientsContent = patients.map(p => {
        const { balance, text: balText } = getHydrationBalance(p.hydration);
        const formulaSummary = generateSummaryText(p);
        return `
          <div style="margin-bottom: 40px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 30px; page-break-inside: avoid;">
            <h2 style="color: #1e3a8a; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 5px;">Leito ${p.bed} — ${p.name}</h2>
            <div style="font-size: 13px; color: #475569; margin-bottom: 15px;">Idade: ${p.age} anos | Criado em: ${new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong>Sinais Vitais (Últimas 24h):</strong><br>
                FC: ${p.vitals.fcMin || 'N/R'} - ${p.vitals.fcMax || 'N/R'} bpm<br>
                FR: ${p.vitals.frMin || 'N/R'} - ${p.vitals.frMax || 'N/R'} irpm<br>
                PA: ${p.vitals.pasMin || 'N/R'}/${p.vitals.padMin || 'N/R'} a ${p.vitals.pasMax || 'N/R'}/${p.vitals.padMax || 'N/R'} mmHg<br>
                Temp: ${p.vitals.tempMin || 'N/R'} - ${p.vitals.tempMax || 'N/R'} °C<br>
                Sat O₂: ${p.vitals.satMin || 'N/R'} - ${p.vitals.satMax || 'N/R'}%
              </div>
              <div style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong>Controle Hídrico & Nutrição:</strong><br>
                Balanço: ${balance} ml (${balText})<br>
                Entradas: ${p.hydration.entries || 0} ml | Saídas: ${(Number(p.hydration.diuresis)||0) + (Number(p.hydration.otherSaidas)||0)} ml<br>
                Evacuação: ${p.evacuated ? 'Presente' : 'Ausente'}<br>
                Dieta: ${p.dietType} (${p.dietObs || 'Sem obs'})
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <strong>Profilaxias Ativas:</strong> 
              TVP: ${p.prophylaxis.tvp ? 'Sim' : 'Não'} | 
              Úlcera Gástrica: ${p.prophylaxis.ulcer ? 'Sim' : 'Não'} | 
              Proteção Ocular: ${p.prophylaxis.eyeDrop ? 'Sim' : 'Não'}
            </div>

            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; font-size: 13px; margin-bottom: 15px;">
              <strong>Evolução / Intercorrências:</strong><br>
              ${p.occurrences || 'Sem intercorrências registradas.'}
            </div>

            <div>
              <strong>Resumo Texto Prontuário:</strong>
              <pre style="white-space: pre-wrap; font-family: monospace; background: #f1f5f9; padding: 10px; border-radius: 6px; font-size: 11px; margin-top: 5px; color: #334155;">${formulaSummary}</pre>
            </div>
          </div>
        `;
      }).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório Consolidado de Rounds Clínicos - ${patients.length} Pacientes</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
              h1 { color: #1e3a8a; border-bottom: 3px solid #2563eb; padding-bottom: 12px; font-size: 26px; }
              .print-btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; margin-bottom: 25px; }
              @media print { .print-btn { display: none; } }
            </style>
          </head>
          <body>
            <button class="print-btn" onclick="window.print()">Imprimir Todo o Painel / PDF</button>
            <h1>Relatório Consolidado de Rounds Clínicos</h1>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 40px;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} — Total de Pacientes Ativos: ${patients.length}</p>
            ${patientsContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleEdit = (p: PatientRound) => {
    setSelectedPatientId(p.id);
    setFormName(p.name);
    setFormAge(p.age);
    setFormBed(p.bed);
    setFormVitals({ ...p.vitals });
    setFormHydration({ ...p.hydration });
    setFormDietType(p.dietType);
    setFormDietObs(p.dietObs);
    setFormEvacuated(p.evacuated);
    setFormProphylaxis({ ...p.prophylaxis });
    setFormOccurrences(p.occurrences);
    setIsEditing(true);
  };

  const handleDuplicateForTomorrow = (p: PatientRound) => {
    // Duplicate patient details but clean out the last 24h metrics (vitals, hydration, occurrences) so that they can be recollected
    const duplicated: PatientRound = {
      ...p,
      id: crypto.randomUUID(),
      vitals: defaultVitals(),
      hydration: defaultHydration(),
      occurrences: '',
      createdAt: new Date().toISOString()
    };
    onSavePatient(duplicated);
  };

  const handleNewPatientForm = () => {
    setSelectedPatientId(null);
    setFormName('');
    setFormAge('');
    setFormBed('');
    setFormVitals(defaultVitals());
    setFormHydration(defaultHydration());
    setFormDietType('VO');
    setFormDietObs('');
    setFormEvacuated(false);
    setFormProphylaxis(defaultProphylaxis());
    setFormOccurrences('');
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBed || formAge === '') return;

    const saved: PatientRound = {
      id: selectedPatientId || crypto.randomUUID(),
      name: formName,
      age: Number(formAge),
      bed: formBed,
      vitals: formVitals,
      hydration: formHydration,
      dietType: formDietType,
      dietObs: formDietObs,
      evacuated: formEvacuated,
      prophylaxis: formProphylaxis,
      occurrences: formOccurrences,
      createdAt: new Date().toISOString()
    };

    onSavePatient(saved);
    setIsEditing(false);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bed.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  // Export to simple printer-friendly window/PDF representation
  const handlePrintPatient = (p: PatientRound) => {
    const summary = generateSummaryText(p);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Round Clínico - Leito ${p.bed}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              h1 { border-bottom: 2px solid #2563eb; padding-bottom: 10px; color: #1e3a8a; font-size: 24px; margin-bottom: 2px; }
              .meta-badge { font-size: 14px; color: #666; margin-bottom: 30px; }
              .section { margin-bottom: 25px; }
              .section-title { font-weight: bold; font-size: 16px; color: #1e40af; border-left: 4px solid #3b82f6; padding-left: 10px; margin-bottom: 10px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
              .data-card { background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
              .notes { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-top: 10px; }
              .print-btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
              @media print { .print-btn { display: none; } }
            </style>
          </head>
          <body>
            <button class="print-btn" onclick="window.print()">Imprimir / Salvar em PDF</button>
            <h1>Medic Round Pro — Round de Evolução</h1>
            <div class="meta-badge">Impresso em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
            
            <div class="grid">
              <div class="data-card">
                <strong>Paciente:</strong> ${p.name}<br>
                <strong>Idade:</strong> ${p.age} anos<br>
                <strong>Leito:</strong> ${p.bed}
              </div>
              <div class="data-card">
                <strong>Data de Round:</strong> ${new Date(p.createdAt).toLocaleDateString('pt-BR')}<br>
                <strong>Balanço Hídrico:</strong> ${getHydrationBalance(p.hydration).balance} ml (${getHydrationBalance(p.hydration).text})
              </div>
            </div>

            <div class="section">
              <div class="section-title">Parâmetros Otimizados & Sinais Vitais (24h)</div>
              <div>
                <strong>FC:</strong> ${p.vitals.fcMin || 'N/R'} - ${p.vitals.fcMax || 'N/R'} bpm | 
                <strong>FR:</strong> ${p.vitals.frMin || 'N/R'} - ${p.vitals.frMax || 'N/R'} irpm | 
                <strong>PA:</strong> ${p.vitals.pasMin || 'N/R'}/${p.vitals.padMin || 'N/R'} a ${p.vitals.pasMax || 'N/R'}/${p.vitals.padMax || 'N/R'} mmHg
              </div>
              <div>
                <strong>Temp:</strong> ${p.vitals.tempMin || 'N/R'} - ${p.vitals.tempMax || 'N/R'} °C | 
                <strong>Sat O₂:</strong> ${p.vitals.satMin || 'N/R'} - ${p.vitals.satMax || 'N/R'}%
              </div>
            </div>

            <div class="section">
              <div class="section-title">Controle de Balanço & Dietas</div>
              <div><strong>Balanço Hídrico:</strong> Entradas: ${p.hydration.entries || 0} ml | Saídas: ${(Number(p.hydration.diuresis)||0) + (Number(p.hydration.otherSaidas)||0)} ml (Diurese: ${p.hydration.diuresis || 0} ml, Outros: ${p.hydration.otherSaidas || 0} ml)</div>
              <div><strong>Eliminações (Evacuação):</strong> ${p.evacuated ? 'Presente' : 'Ausente'}</div>
              <div><strong>Dieta prescrita:</strong> ${p.dietType} - ${p.dietObs || 'Sem adicionais'}</div>
              <div><strong>Profilaxias:</strong> 
                TVP: ${p.prophylaxis.tvp ? 'ATIVA' : 'Não prescrita'} | 
                Úlcera: ${p.prophylaxis.ulcer ? 'ATIVA' : 'Não prescrita'} | 
                Colírio: ${p.prophylaxis.eyeDrop ? 'ATIVO' : 'Não prescrito'}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Intercorrências das Últimas 24h</div>
              <div class="notes">${p.occurrences || 'Sem intercorrências registradas.'}</div>
            </div>

            <div class="section" style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;">
              <div class="section-title">Resumo Clínico Estruturado (Copiável)</div>
              <pre style="white-space: pre-wrap; font-family: monospace; background: #f1f5f9; padding: 15px; border-radius: 6px; font-size: 13px;">${summary}</pre>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <h2 id="round-title" className="text-xl font-bold text-slate-800 dark:text-white">Round Clínico Diário</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Colete as informações de 24h dos pacientes e gere relatórios e balanço hídrico na hora.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {patients.length > 0 && (
            <button
              onClick={() => setShowBatchExport(true)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg shadow-xs transition-all"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              Exportar Todos ({patients.length})
            </button>
          )}
          <button
            id="btn-add-patient"
            onClick={handleNewPatientForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Novo Paciente
          </button>
        </div>
      </div>

      {/* Main Screen with List & Quick Search */}
      {!isEditing ? (
        <div className="space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-patients"
              type="text"
              placeholder="Buscar paciente por nome ou leito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {filteredPatients.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-350 dark:text-slate-700" />
              <p className="font-medium text-slate-700 dark:text-slate-300">Nenhum paciente cadastrado</p>
              <p className="text-xs mt-1">Busque por outro termo ou cadastre um novo paciente para iniciar o round.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPatients.map((p) => {
                const bal = getHydrationBalance(p.hydration);
                const alarms = checkVitalIssues(p.vitals);
                return (
                  <motion.div
                    key={p.id}
                    layoutId={p.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Visual stripe status bar if there are severe alarm parameters */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${alarms.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-blue-600'}`} />
                    
                    <div className="flex justify-between items-start pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Leito {p.bed}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white dark:text-white">{p.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Idade: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.age} anos</span></p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          title="Editar Paciente"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateForTomorrow(p)}
                          title="Duplicar para Amanhã (Limpa vitais)"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-blue-600 dark:text-blue-400 transition-colors"
                        >
                          <Files className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintPatient(p)}
                          title="Exportar PDF / Imprimir"
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePatient(p.id)}
                          title="Excluir"
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Vitals summary bar */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase">FC Max</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {p.vitals.fcMax ? `${p.vitals.fcMax}` : '--'} <span className="text-[9px] font-normal text-slate-400">bpm</span>
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase">PA Máx</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {p.vitals.pasMax ? `${p.vitals.pasMax}/${p.vitals.padMax}` : '--'} <span className="text-[9px] font-normal text-slate-400">mmHg</span>
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase">Sat Mín</p>
                        <p className={`text-xs font-bold ${p.vitals.satMin && p.vitals.satMin < 92 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {p.vitals.satMin ? `${p.vitals.satMin}%` : '--'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase">Bal. Híd.</p>
                        <p className={`text-xs ${bal.colorClass}`}>
                          {bal.balance > 0 ? `+${bal.balance}` : bal.balance} <span className="text-[9px] font-normal text-slate-400">ml</span>
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase">Dieta</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {p.dietType}
                        </p>
                      </div>
                    </div>

                    {/* Alerts from vitals constraints list */}
                    {alarms.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 p-2.5 rounded-lg flex items-start gap-2 text-amber-800 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="text-xs space-y-0.5 font-medium">
                          <p className="font-semibold text-amber-900 dark:text-amber-300">Atenção - Parâmetros Limítrofes:</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {alarms.map((al, idx) => (
                              <span key={idx} className="after:content-[',_'] last:after:content-none">• {al} </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick footer with copy text interaction */}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-850">
                      <div className="flex flex-wrap gap-2 text-slate-400">
                        <span className={`px-1.5 py-0.5 rounded-md ${p.evacuated ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          Evac: {p.evacuated ? 'Pres' : 'Aus'}
                        </span>
                        {p.prophylaxis.tvp && <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">TVP</span>}
                        {p.prophylaxis.ulcer && <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">GasPro</span>}
                      </div>
                      <button
                        onClick={() => handleCopySummary(p)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold select-none border transition-all ${
                          copiedId === p.id 
                            ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-250 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-800 text-blue-600 hover:text-blue-700 dark:text-blue-400 border-slate-200 dark:border-slate-805'
                        }`}
                      >
                        {copiedId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Prontuário
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Patient Form */
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-white">
                {selectedPatientId ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
              </h3>
              <p className="text-slate-400 text-xs">Preencha os dados obtidos nas últimas 24h clínicas.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-md transition-colors"
            >
              Cancelar
            </button>
          </div>

          {/* Section 1: Identificação */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              1. Identificação Hospitalar
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Idade (Anos) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="130"
                  placeholder="Ex: 65"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Leito de Internação *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: UTI 03 ou ENF 202A"
                  value={formBed}
                  onChange={(e) => setFormBed(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sinais Vitais */}
          <div className="space-y-4 pt-4 border-t border-slate-105 dark:border-slate-850">
            <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              2. Sinais Vitais das Últimas 24h (Mín / Máx)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* FC */}
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-150 dark:border-slate-850 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center border-b border-slate-200/60 dark:border-slate-800 pb-1">Freq. Cardíaca</p>
                <div className="flex gap-1">
                  <input
                    placeholder="Mín"
                    type="number"
                    value={formVitals.fcMin}
                    onChange={(e) => setFormVitals({ ...formVitals, fcMin: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                  <input
                    placeholder="Máx"
                    type="number"
                    value={formVitals.fcMax}
                    onChange={(e) => setFormVitals({ ...formVitals, fcMax: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* FR */}
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-150 dark:border-slate-850 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center border-b border-slate-200/60 dark:border-slate-800 pb-1">Freq. Resp.</p>
                <div className="flex gap-1">
                  <input
                    placeholder="Mín"
                    type="number"
                    value={formVitals.frMin}
                    onChange={(e) => setFormVitals({ ...formVitals, frMin: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                  <input
                    placeholder="Máx"
                    type="number"
                    value={formVitals.frMax}
                    onChange={(e) => setFormVitals({ ...formVitals, frMax: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* PAS */}
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-150 dark:border-slate-850 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center border-b border-slate-200/60 dark:border-slate-800 pb-1">PA Sistólica</p>
                <div className="flex gap-1">
                  <input
                    placeholder="Mín"
                    type="number"
                    value={formVitals.pasMin}
                    onChange={(e) => setFormVitals({ ...formVitals, pasMin: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                  <input
                    placeholder="Máx"
                    type="number"
                    value={formVitals.pasMax}
                    onChange={(e) => setFormVitals({ ...formVitals, pasMax: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* PAD */}
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-150 dark:border-slate-850 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center border-b border-slate-200/60 dark:border-slate-800 pb-1">PA Diastólica</p>
                <div className="flex gap-1">
                  <input
                    placeholder="Mín"
                    type="number"
                    value={formVitals.padMin}
                    onChange={(e) => setFormVitals({ ...formVitals, padMin: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                  <input
                    placeholder="Máx"
                    type="number"
                    value={formVitals.padMax}
                    onChange={(e) => setFormVitals({ ...formVitals, padMax: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Temp */}
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-150 dark:border-slate-850 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center border-b border-slate-200/60 dark:border-slate-800 pb-1">Temp (°C)</p>
                <div className="flex gap-1">
                  <input
                    placeholder="Mín"
                    type="number"
                    step="0.1"
                    value={formVitals.tempMin}
                    onChange={(e) => setFormVitals({ ...formVitals, tempMin: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                  <input
                    placeholder="Máx"
                    type="number"
                    step="0.1"
                    value={formVitals.tempMax}
                    onChange={(e) => setFormVitals({ ...formVitals, tempMax: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Sat */}
              <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-150 dark:border-slate-850 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase text-center border-b border-slate-200/60 dark:border-slate-800 pb-1">Sat O₂ (%)</p>
                <div className="flex gap-1">
                  <input
                    placeholder="Mín"
                    type="number"
                    value={formVitals.satMin}
                    onChange={(e) => setFormVitals({ ...formVitals, satMin: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                  <input
                    placeholder="Máx"
                    type="number"
                    value={formVitals.satMax}
                    onChange={(e) => setFormVitals({ ...formVitals, satMax: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full text-center px-1.5 py-1 bg-white dark:bg-slate-900 text-xs border border-slate-205 dark:border-slate-800 rounded-md text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Balanço Hídrico */}
          <div className="space-y-4 pt-4 border-t border-slate-105 dark:border-slate-850">
            <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Droplets className="w-4 h-4" />
              3. Balanço Hídrico Acumulado das últimas 24h
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Entradas (ml)</label>
                <input
                  placeholder="Injetados, dietas, soro, etc."
                  type="number"
                  value={formHydration.entries}
                  onChange={(e) => setFormHydration({ ...formHydration, entries: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Diurese (ml)</label>
                <input
                  placeholder="Volume urina em 24h"
                  type="number"
                  value={formHydration.diuresis}
                  onChange={(e) => setFormHydration({ ...formHydration, diuresis: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Outras Saídas / Drenos (ml)</label>
                <input
                  placeholder="Drenos, SNG, fístulas, etc."
                  type="number"
                  value={formHydration.otherSaidas}
                  onChange={(e) => setFormHydration({ ...formHydration, otherSaidas: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Automatic balance indicator */}
              <div className={`p-2.5 rounded-lg border text-center ${getHydrationBalance(formHydration).bgColor}`}>
                <p className="text-[10px] uppercase font-bold text-slate-400">BH Final Gerado</p>
                <p className={`text-base ${getHydrationBalance(formHydration).colorClass}`}>
                  {getHydrationBalance(formHydration).balance > 0 
                    ? `+${getHydrationBalance(formHydration).balance}` 
                    : getHydrationBalance(formHydration).balance} ml
                </p>
                <p className="text-[10px] text-slate-500 capitalize">Balanço {getHydrationBalance(formHydration).text}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Suporte, Eliminacoes, Proﬁlaxias */}
          <div className="space-y-4 pt-4 border-t border-slate-105 dark:border-slate-850">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4" />
              4. Dieta, Eliminações e Profilaxias Ativas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dieta e Evacuação */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo de Dieta Prescrita</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['VO', 'Enteral', 'Parenteral', 'Jejum'] as DietType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormDietType(type)}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                          formDietType === type 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                            : 'bg-white hover:bg-slate-55 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Observações da Dieta</label>
                  <input
                    type="text"
                    placeholder="Ex: sem sal, restrição hídrica, infusão de 50ml/h, etc."
                    value={formDietObs}
                    onChange={(e) => setFormDietObs(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="evacuation-checkbox"
                    type="checkbox"
                    checked={formEvacuated}
                    onChange={(e) => setFormEvacuated(e.target.checked)}
                    className="w-4.5 h-4.5 rounded-sm bg-slate-105 border-slate-200 dark:bg-slate-955 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="evacuation-checkbox" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Evacuação Presente nas Últimas 24h?
                  </label>
                </div>
              </div>

              {/* Profilaxias */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                <p className="text-xs font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  Profilaxias Clínicas Obrigatórias (Checklist)
                </p>
                
                <label className="flex items-center gap-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProphylaxis.tvp}
                    onChange={(e) => setFormProphylaxis({ ...formProphylaxis, tvp: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-750"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Prevenção de TVP (Trombose Venosa Profunda)</p>
                    <p className="text-[10px] text-slate-400">Medicamentosa (Enoxaparina, Heparina) ou Mecânica ativa.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProphylaxis.ulcer}
                    onChange={(e) => setFormProphylaxis({ ...formProphylaxis, ulcer: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-750"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Proteção de Úlcera de Estresse</p>
                    <p className="text-[10px] text-slate-400">Uso de IBP (Omeprazol) ou Antagonista H2 se paciente em VM/gasp.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formProphylaxis.eyeDrop}
                    onChange={(e) => setFormProphylaxis({ ...formProphylaxis, eyeDrop: e.target.checked })}
                    className="w-4.5 h-4.5 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-750"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Colírio de Proteção Ocular</p>
                    <p className="text-[10px] text-slate-400">Lubrificante ou barreira ocular em pacientes sedados/com lagoftalmo.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Intercorrências */}
          <div className="space-y-3 pt-4 border-t border-slate-105 dark:border-slate-850">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              5. Intercorrências & Evolução Clínica (Últimas 24h)
            </h4>
            <textarea
              rows={3}
              placeholder="Descreva picos febris, episódios de agitação, instabilidades transientes de ventilação, novos antibióticos ou procedimentos invasivos realizados..."
              value={formOccurrences}
              onChange={(e) => setFormOccurrences(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-colors"
            >
              Confirmar e Salvar Paciente
            </button>
          </div>
        </form>
      )}

      {/* Batch Export Modal overlay */}
      <AnimatePresence>
        {showBatchExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-850">
                <div>
                  <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-blue-500" />
                    Exportação Consolidada ({patients.length} Pacientes)
                  </h3>
                  <p className="text-slate-400 text-xs">Informações coletadas exibidas uma abaixo da outra prontas para o prontuário ou passagem de plantão.</p>
                </div>
                <button
                  onClick={() => setShowBatchExport(false)}
                  className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-bold transition-all text-xs"
                >
                  Fechar
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
                <div className="space-y-4">
                  {patients.map((p, idx) => {
                    return (
                      <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3 shadow-xs">
                        {/* Title bed */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              Leito {p.bed}
                            </span>
                            <span className="font-bold text-white dark:text-white text-sm">
                              {p.name}
                            </span>
                            <span className="text-slate-450 dark:text-slate-400 text-xs">({p.age} anos)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold">
                            #{idx + 1} de {patients.length}
                          </span>
                        </div>

                        {/* Raw output showing details stacked */}
                        <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-800 leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap select-text">
                          {generateSummaryText(p)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Você pode colar o conteúdo diretamente no prontuário eletrônico hospitalar.</p>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={handlePrintAll}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Gravar PDF / Imprimir Lote
                  </button>
                  <button
                    onClick={handleCopyAll}
                    className={`px-5 py-2 font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer ${
                      copiedAll 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-4 h-4 animate-bounce" />
                        Lote Completo Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Todo o Lote
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
