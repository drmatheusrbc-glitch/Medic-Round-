import React, { useState } from "react";
import { 
  FileText, 
  Sparkles, 
  User, 
  Calendar, 
  MapPin, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Heart, 
  Droplet, 
  Thermometer, 
  Wind, 
  Trash2, 
  Copy, 
  Printer, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  RotateCcw, 
  Clipboard, 
  Plus, 
  Scale, 
  AlertCircle,
  FileDown
} from "lucide-react";

// Structure definition for clinical summary
interface Identity {
  nome: string;
  sexo: string;
  idade: string;
  peso: string;
  procedencia?: string;
  outrosDados?: string;
}

interface InternmentDays {
  dataInternacao: string;
  diasTotais: string;
  diaIOT: string;
  diaPCR: string;
  intercorrencias: string[];
}

interface HistoryPresentIllness {
  hda: string;
}

interface PastHistory {
  patologiasPrevias: string[];
  medicacoesCasa: string[];
  alergias: string[];
}

interface Exams {
  laboratoriais: string[];
  imagem: string[];
}

interface CulturesAntibiotics {
  culturas: string[];
  antibioticosPrevios: string[];
  antibioticosAtuais: string[];
}

interface ClinicalParameters {
  sinaisVitais: string[];
  balancoHidrico: string;
  drogasVasoativas: string[];
  parametrosVentilatorios: string[];
}

interface TreatmentPlan {
  condutas: string[];
  pendencias: string[];
}

interface PrescriptionMedication {
  medicamento: string;
  dose: string;
  posologia: string;
}

interface ClinicalSummary {
  identidade: Identity;
  diasInternacao: InternmentDays;
  hda: string;
  antecedentes: PastHistory;
  exames: Exams;
  culturasAntibioticos: CulturesAntibiotics;
  sinaisEParametros: ClinicalParameters;
  planoCondutas: TreatmentPlan;
  prescricaoMedica: PrescriptionMedication[];
}

// Built-in high fidelity clinical demos to allow immediate visual playground testing
const DEMO_EVOLUTION = `Evolução Clínica de Terapia Intensiva
Paciente: Sebastião Ferreira de Souza, 72 anos, masculino, peso aproximado de 75 kg.
Admitido na UTI no dia 01/06/2026 encaminhado pelo Pronto Socorro, com diagnóstico de Insuficiência Respiratória Aguda secundária a Pneumonia Adquirida na Comunidade (PAC) grave e sepse de foco pulmonar.
Histórico de Diabetes Mellitus tipo 2 e Hipertensão Arterial Sistêmica. Medicamentos de uso domiciliar: Cloridrato de Metformina 850mg 2x/dia e Enalapril 20mg 1x/dia. Alergia relatada a contraste iodado (reação urticariforme).

No dia 02/06/2026, apresentou piora do padrão respiratório com fadiga muscular e hipoxemia refratária, sendo submetido a Intubação Orotraqueal (IOT) e início de ventilação mecânica invasiva protetora.
Durante a evolução clínica do dia 03/06/2026, apresentou episódio de Parada Cardiorrespiratória (PCR) em ritmo de AESP (Atividade Elétrica Sem Pulso) que durou cerca de 4 minutos, revertida com protocolo de RCP padrão (adrenalina 1mg, massagem cardíaca). Apresentou episódio de instabilidade hemodinâmica logo após a PCR, sendo iniciada infusão de Noradrenalina.

Exames Laboratoriais mais recentes (06/06/2026):
- Gasometria Arterial: pH 7.36, pO2 84 mmHg, pCO2 38 mmHg, HCO3 21 mEq/L, BE -3.2, SaO2 95% (FiO2 35%). Relação P/F = 240.
- Hemograma: Leucócitos 14.200/mm³ (com 8% de bastões), Hb 11.2 g/dL, Plaquetas 165.000/mm³.
- Bioquímica: Creatinina 1.6 mg/dL, Ureia 82 mg/dL, Potássio 4.8 mEq/L, Sódio 138 mEq/L, Lactato 1.8 mmol/L, PCR (Proteína C Reativa) 124 mg/L.

Exames de Imagem:
- Raio-X de Tórax (05/06/2026): Infiltrado alveolar bilateral difuso em bases pulmonares, pior à direita, com discreto derrame pleural ipsilateral. Sem pneumotórax.

Culturas e Esquema Infeccioso:
- Hemocultura de admissão (01/06): Negativa após 5 dias.
- Secreção Traqueal (02/06): Crescimento de Streptococcus pneumoniae sensível à Ceftriaxona.
- Terapia Prévia: Fez uso de Piperacilina/Tazobactam (Tazocin) por 3 dias (de 01/06 a 03/06), suspenso por direcionamento de cultura.
- Terapia Atual: Iniciada Ceftriaxona no dia 03/06/2026 (D4 hoje) associada a Claritromicina endotraqueal (D4 hoje).

Sinais Vitais e Monitorização (Últimas 24h):
- Pressão Arterial Média: 72 mmHg estável. PA aferida 118x68 mmHg.
- FC: 84 bpm em ritmo sinusal.
- Temperatura: 36.8 °C de pico (afebril).
- Balanço Hídrico: Total de Entradas de 1.850 ml e Saídas de 1.400 ml (diurese espontânea) + 150 ml perdas insensíveis. BH positivo em 300 ml.
- Drogas Vasoativas: Noradrenalina em infusão contínua a 0.05 mcg/kg/min (em processo de desmame).
- Ventilação Mecânica: Modo PCV, Pressão Controlada de 12 cmH2O acima da PEEP, PEEP de 8 cmH2O, FiO2 35%, FR de 14 ipm. Volume corrente gerado em torno de 440 ml (aprox. 5.9 ml/kg peso ideal).

Plano Terapêutico e Condutas:
- Manter decúbito elevado a 35-45 graus para prevenção de pneumonia associada à ventilação.
- Prosseguir desmame gradual da Noradrenalina conforme PAM > 65 mmHg estável.
- Testar transição de modo de ventilação controlada para assistida (PSV) se tolerar bem e RASS estiver entre 0 e -1 (atualmente sedado com Propofol a 2 ml/h, em pausa diária programada).
- Manter profilaxia farmacológica de TVP com Enoxaparina 40mg SC 1x/dia, e profilaxia de úlcera com Omeprazol 40mg EV.
- Solicitados novos exames de controle laboratorial (função renal e eletrólitos) para amanhã cedo.
- Pendências: Aguardar consulta da nefrologia para avaliação de disfunção renal aguda instalada (Estágio KDIGO 1).`;

const DEMO_PRESCRIPTION = `PRESCRIÇÃO MÉDICA - LEITO UTI 03
1. Dieta Enteral Blenda 1500 kcal/dia - Infundir em 22 horas (65 ml/h)
2. Soro Fisiológico 0.9% 500ml + Cloreto de Potássio 10% 10ml EV de 8/8h
3. Ceftriaxona 2g EV 1x ao dia (Dx 4 de 7)
4. Claritromicina 500mg EV de 12/12h (Dx 4 de 7)
5. Propofol 10mg/ml infusão contínua a 2 ml/h (ajustar conforme escala de sedação Alvo RASS -2)
6. Noradrenalina (0.2 mg/ml) 4mg em SG 5% 100ml - Infundir EV em bomba de infusão contínua a 3.5 ml/h (PAM alvo > 65 mmHg)
7. Enoxaparina Sódica 40mg SC 1x ao dia (08:00h) - Profilaxia TVP
8. Omeprazol 40mg pó liofilizado EV 1x ao dia
9. Dipirona Monoidratada 1g EV de 6/6h se temperatura > 37.8°C ou dor
10. Insulina Humana Regular SC conforme glicemia capilar de 4/4h (escala móvel)
11. Nebulização com Brometo de Ipratrópio 10 gotas + SF 0.9% 5ml de 6/6h`;

interface ClinicalFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 data (excluding metadata header)
}

export default function ReportSummaryTab() {
  const [evolutionText, setEvolutionText] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<ClinicalFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Legacy states kept for internal reference safety
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string>("");
  const [fileMime, setFileMime] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Simulated live clinical logging messages for loading state feedback
  const loadingMessages = [
    "Conectando ao modelo clínico seguro do Gemini...",
    "Lendo evolução clínica e identificando dados de identidade...",
    "Calculando dias de internação, PCR, intubações e datas de referência...",
    "Analisando história da doença atual (HDA) e antecedentes clínicos...",
    "Lendo e correlacionando resultados de exames laboratoriais...",
    "Buscando exames de imagem e achados radiográficos relevantes...",
    "Consultando culturas colhidas e cruzando antimicrobianos prévios...",
    "Consolidando antibióticos ativos e calculando dia de tratamento (Dx)...",
    "Extraindo balanço hídrico, sinais vitais e parâmetros de ventilação mecânica...",
    "Organizando plano condutas, pendências clínicas e lista de prescrição...",
    "Garantindo fidedignidade dos dados estruturados..."
  ];

  // Load a built-in prefilled medical patient example
  const handleLoadDemo = () => {
    setEvolutionText(DEMO_EVOLUTION);
    setPrescriptionText(DEMO_PRESCRIPTION);
    setFile(null);
    setFileData("");
    setFileMime("");
    setUploadedFiles([]);
    setError(null);
  };

  const handleClearInputs = () => {
    setEvolutionText("");
    setPrescriptionText("");
    setFile(null);
    setFileData("");
    setFileMime("");
    setUploadedFiles([]);
    setError(null);
  };

  // Convert uploaded files (txt, pdf, images) to base64 for Gemini payload ingestion
  const processFiles = (filesArray: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    
    for (const f of filesArray) {
      if (f.size > 20 * 1024 * 1024) {
        setError(`O arquivo "${f.name}" é grande demais. Por favor selecione arquivos menores que 20MB.`);
        return;
      }
      validFiles.push(f);
    }

    validFiles.forEach((selectedFile) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64DataOnly = base64String.split(",")[1];
        
        setUploadedFiles((prev) => {
          // Avoid duplicate files based on name + size
          if (prev.some((f) => f.name === selectedFile.name && f.size === selectedFile.size)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: `${selectedFile.name}-${selectedFile.size}-${Date.now()}-${Math.random()}`,
              name: selectedFile.name,
              size: selectedFile.size,
              type: selectedFile.type,
              data: base64DataOnly,
            }
          ];
        });
      };
      reader.onerror = () => {
        setError(`Erro ao ler o arquivo "${selectedFile.name}". Tente novamente.`);
      };
      reader.readAsDataURL(selectedFile);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;
    processFiles(Array.from(filesList));
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Safe server post to /api/summarize
  const handleSubmitSummary = async () => {
    if (!evolutionText.trim() && !prescriptionText.trim() && uploadedFiles.length === 0) {
      setError("Por favor, cole uma Evolução Clínica, digite uma Prescrição ou anexe arquivos para resumir.");
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    
    // Animate loading milestones
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evolutionText,
          prescriptionText,
          files: uploadedFiles.map(f => ({
            data: f.data,
            mimeType: f.type
          }))
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(`O servidor de processamento retornou uma resposta inesperada (Status: ${response.status}). Detalhes: ${textError.substring(0, 100) || "Resposta vazia"}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || `Erro do servidor (${response.status})`);
      }

      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro inesperado ao estruturar o resumo médico.");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  // Copies the structured medical record outline to clipboard in clean Markdown structure
  const handleCopyTextSummary = () => {
    if (!summary) return;

    const mk = `=== RESUMO DE PRONTUÁRIO UTI ===

1. IDENTIDADE DO PACIENTE
- Nome: ${summary.identidade.nome || "Não informado"}
- Sexo: ${summary.identidade.sexo || "Não informado"}
- Idade: ${summary.identidade.idade || "Não informado"}
- Peso: ${summary.identidade.peso || "Não informado"}
- Procedência: ${summary.identidade.procedencia || "Não informado"}
- Outros Dados: ${summary.identidade.outrosDados || "Não informado"}

2. INTERNAÇÃO E MARCOS TEMPORAIS
- Admissão/Internação: ${summary.diasInternacao.dataInternacao || "Não informada"}
- Tempo de Internação: ${summary.diasInternacao.diasTotais || "Não informado"}
- Dia da PCR: ${summary.diasInternacao.diaPCR || "Não consta"}
- Dia da IOT: ${summary.diasInternacao.diaIOT || "Não consta"}
- Intercorrências registradas: 
${summary.diasInternacao.intercorrencias?.length > 0
  ? summary.diasInternacao.intercorrencias.map(i => `  * ${i}`).join("\n")
  : "  * Sem intercorrências adicionais registradas."}

3. BREVE HISTÓRIA DA DOENÇA ATUAL (HDA)
${summary.hda || "Não reportado."}

4. ANTECEDENTES E ALERGIAS
- Comorbidades Prévias: ${summary.antecedentes.patologiasPrevias?.join(", ") || "Nenhuma relatada"}
- Medicações em Casa: ${summary.antecedentes.medicacoesCasa?.join(", ") || "Nenhuma relatada"}
- Alergias relatadas: ${summary.antecedentes.alergias?.join(", ") || "Nega alergias conhecidas"}

5. EXAMES REALIZADOS
- Laboratoriais:
${summary.exames.laboratoriais?.map(e => `  * ${e}`).join("\n") || "  * Nenhum registro de laboratório recente"}
- Exames de Imagem:
${summary.exames.imagem?.map(i => `  * ${i}`).join("\n") || "  * Nenhum de imagem recente registrado"}

6. CULTURAS E ANTIMICROBIANOS
- Culturas Colhidas/Resultados:
${summary.culturasAntibioticos.culturas?.map(c => `  * ${c}`).join("\n") || "  * Nenhuma cultura informada"}
- Antimicrobianos Prévios:
${summary.culturasAntibioticos.antibioticosPrevios?.map(a => `  * ${a}`).join("\n") || "  * Nenhum antibiótico prévio relatado"}
- Antimicrobianos Atuais:
${summary.culturasAntibioticos.antibioticosAtuais?.map(a => `  * ${a}`).join("\n") || "  * Nenhum antibiótico ativo relatado"}

7. MONITORAÇÃO CLÍNICA E PARÂMETROS
- Sinais Vitais: ${summary.sinaisEParametros.sinaisVitais?.join(" | ") || "Não registrados"}
- Balanço Hídrico: ${summary.sinaisEParametros.balancoHidrico || "Não registrado"}
- Drogas Vasoativas / Suporte Hemodinâmico: ${summary.sinaisEParametros.drogasVasoativas?.join(", ") || "Nenhuma droga vasoativa ativa"}
- Parâmetros de Ventilação Mecânica: ${summary.sinaisEParametros.parametrosVentilatorios?.join(" | ") || "Não em MV ventilada"}

8. PLANO DE CUIDADOS E PENDÊNCIAS
- Condutas Terapêuticas:
${summary.planoCondutas.condutas?.map(c => `  * ${c}`).join("\n") || "  * Sem condutas expressas registradas."}
- Pendências de Visita:
${summary.planoCondutas.pendencias?.map(p => `  * ${p}`).join("\n") || "  * Nenhuma pendência pendente."}

9. MEDICAÇÕES DA PRESCRIÇÃO EXTRAÍDAS
${summary.prescricaoMedica?.length > 0 
  ? summary.prescricaoMedica.map((m, idx) => `  ${idx + 1}. ${m.medicamento} | Dose: ${m.dose} | Posologia: ${m.posologia}`).join("\n")
  : "  * Nenhuma medicação extraída."}

--- Gerado via Assistente Clínico Medic Round Pro ---`;

    navigator.clipboard.writeText(mk);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Trigger high quality printing matching stylesheet configurations
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="report-summary-container" className="space-y-6">
      
      {/* Title Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs tracking-wider flex items-center gap-1 uppercase select-none">
              <Sparkles className="w-3.5 h-3.5" />
              UTI Inteligente
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1.5 uppercase tracking-tight">Resumo de Prontuário Clínico</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">Organize o pensamento clínico estruturado, digite ou anexe prescrições e evoluções, e obtenha resumos fidedignos automáticos com o Gemini AI.</p>
        </div>

        {summary && (
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setSummary(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar / Editar
            </button>

            <button
              onClick={handleCopyTextSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/45 border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold hover:bg-emerald-200 hover:dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-400 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedText ? "Copiado!" : "Copiar Resumo (PEP)"}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-slate-100 dark:text-slate-900 text-xs font-bold hover:bg-slate-900 dark:hover:bg-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-xl flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">Falha no Processamento Clínico</h4>
            <p className="text-[11px] text-rose-700 dark:text-rose-450 mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: Input forms for data entry */}
      {!summary && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
          
          {/* Main workspace to write/paste the patient round evolution */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Evoluções, Notas ou Anamnese</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Insira tudo o que sabe sobre a internação e o roundtable</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadDemo}
                    className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250/20 text-emerald-700 dark:text-emerald-400 font-extrabold px-2 py-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/70 transition-all cursor-pointer"
                  >
                    Carregar Exemplo de Paciente
                  </button>
                  {evolutionText && (
                    <button
                      onClick={handleClearInputs}
                      className="text-[10px] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-350 p-1 rounded-md transition-colors"
                      title="Limpar formulários"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={evolutionText}
                onChange={(e) => setEvolutionText(e.target.value)}
                placeholder="Por favor, cole as anotações do prontuário eletrônico, evolução médica recente, anotações de plantão, exames laboratoriais ou notas do round com o paciente..."
                className="w-full h-80 max-h-120 p-3.5 border border-slate-700 dark:border-slate-800 rounded-lg text-xs bg-slate-900 dark:bg-slate-950 text-white dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-sans tracking-wide leading-relaxed scrollbar-thin shadow-inner"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                <span>Caracteres: {evolutionText.length}</span>
                <span>Fidelidade clínica garantida via IA</span>
              </div>
            </div>
          </div>

          {/* Right column: Prescription copy-paste and upload zone */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Copy paste prescription area */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-105 dark:border-slate-800 pb-3 mb-3">
                <div className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                  <Clipboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Prescrição Médica (Texto)</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Importante para gerar o checklist de medicamentos</p>
                </div>
              </div>

              <textarea
                value={prescriptionText}
                onChange={(e) => setPrescriptionText(e.target.value)}
                placeholder="Cole o texto da prescrição farmacológica do leito do paciente aqui se disponível..."
                className="w-full h-34 p-3 border border-slate-700 dark:border-slate-800 rounded-lg text-xs bg-slate-900 dark:bg-slate-950 text-white dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 font-sans leading-relaxed scrollbar-thin shadow-inner"
              />
            </div>

            {/* Document PDF or image uploader zone */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-105 dark:border-slate-800 pb-3 mb-3">
                <div className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">3. Anexar Arquivo Clínico</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Formatos suportados: PDF, imagens (PNG, JPG) ou arquivos de texto</p>
                </div>
              </div>

              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-all ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50/15 dark:bg-blue-950/20 scale-[1.01]"
                    : uploadedFiles.length > 0 
                      ? "border-emerald-400/50 bg-emerald-50/5 dark:bg-emerald-950/5" 
                      : "border-slate-250 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-55/70"
                }`}
              >
                <label className="cursor-pointer space-y-2 group block w-full">
                  <Upload className="w-7 h-7 mx-auto text-slate-400 group-hover:text-slate-500 transition-colors" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-350">
                      Arraste ou <span className="text-blue-500 underline font-extrabold">clique para selecionar múltiplos arquivos ou imagens</span>
                    </p>
                    <p className="text-[9px] text-slate-400">Suporte a múltiplos arquivos PDF, PNG, JPG, JPEG ou TXT até 20MB cada</p>
                  </div>
                  <input 
                    type="file" 
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/jpg,text/plain" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>

                {uploadedFiles.length > 0 && (
                  <div className="w-full text-left space-y-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Arquivos Selecionados ({uploadedFiles.length})
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadedFiles([]);
                        }}
                        className="text-[9px] text-rose-500 hover:text-rose-600 font-bold hover:underline"
                      >
                        Limpar todos
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {uploadedFiles.map((f) => (
                        <div 
                          key={f.id} 
                          className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl hover:border-slate-200 dark:hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0 max-w-[85%]">
                            <span className="text-sm select-none">
                              {f.type.includes("pdf") ? "📄" : f.type.startsWith("image/") ? "🖼️" : "📝"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-205 truncate" title={f.name}>
                                {f.name}
                              </p>
                              <p className="text-[8px] text-slate-400 font-medium">
                                {(f.size / (1024 * 1024)).toFixed(2)} MB • {f.type.includes("pdf") ? "PDF" : f.type.startsWith("image/") ? "Imagem" : "Texto"}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setUploadedFiles(prev => prev.filter(item => item.id !== f.id));
                            }}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors shrink-0"
                            title="Remover arquivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Launch processing button */}
            <button
              onClick={handleSubmitSummary}
              className="w-full bg-emerald-600 dark:bg-emerald-500 text-white font-black hover:bg-emerald-700 dark:hover:bg-emerald-600 py-3.5 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-transparent active:scale-[0.99]"
            >
              <Sparkles className="w-4.5 h-4.5" />
              CONSOLIDAR RESUMO COGNITIVO COM IA
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: LOADING SCREEN */}
      {isLoading && (
        <div className="min-h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-850 rounded-xl p-8 py-14 shadow-xs text-center print:hidden">
          <div className="relative mb-6">
            <div className="w-14 h-14 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
            <Sparkles className="w-5 h-5 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Processando Prontuário Clínico</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-bold animate-pulse max-w-md">
            {loadingMessages[loadingStep]}
          </p>
          
          <div className="w-64 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-400 mt-2 select-none">Consolidando e filtrando dados de acordo com premissas médicas...</p>
        </div>
      )}

      {/* VIEW 3: SUMMARY DISPLAY REPORT DASHBOARD (Fully Styled / Interactive / printable) */}
      {summary && !isLoading && (
        <div className="space-y-6 print:space-y-4">
          
          {/* PRINT-ONLY SECTION HEADER */}
          <div className="hidden print:block border-b border-black pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-black uppercase">Medic Round Pro - Resumo Clínico de UTI</h1>
                <p className="text-xs text-slate-600">Sumário Cognitivo de Terapia Intensiva / PEP Integrado</p>
              </div>
              <div className="text-right text-xs text-slate-900 leading-normal">
                <p><strong>Paciente:</strong> {summary.identidade.nome}</p>
                <p><strong>Data de Impressão:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </div>

          {/* SECTION 1: IDENTITY CARD (GORGEOUS BENTO METADATA) */}
          <div id="section-identity" className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Identity Details Box */}
            <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <User className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-wider">1. Identidade do Paciente</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none">Nome Completo</p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-1 leading-normal break-words">{summary.identidade.nome || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none">Sexo / Gênero</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-50 leading-normal break-words capitalize">{summary.identidade.sexo || "Não informado"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none">Idade</p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-1 leading-normal break-words">{summary.identidade.idade || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none">Peso Registrado</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Scale className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-50 leading-normal break-words">{summary.identidade.peso || "Não informado"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none">Procedência original</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-50 leading-normal break-words">{summary.identidade.procedencia || "Não informado"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none">Outras Informações</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-normal break-words">{summary.identidade.outrosDados || "Nenhum histórico extra"}</p>
                </div>
              </div>
            </div>

            {/* SECTION 2: INTERNATION AND REF DATES */}
            <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <Clock className="w-5 h-5" />
                  <h3 className="text-xs font-black uppercase tracking-wider">2. Dias de Internação e Marcos</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase">Data Admissão:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{summary.diasInternacao.dataInternacao || "Não informada"}</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase">Tempo de UTI/Internação:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{summary.diasInternacao.diasTotais || "-- dias"}</span>
                  </div>
                  
                  {/* IOT & PCR Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 dark:bg-blue-955/20 dark:border-blue-900 text-center flex flex-col justify-center">
                      <p className="text-[8px] text-slate-550 dark:text-slate-450 uppercase font-black tracking-wider">Admissão IOT</p>
                      <p className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 mt-1 break-words">{summary.diasInternacao.diaIOT || "Não Realizado"}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 dark:bg-rose-955/20 dark:border-rose-900 text-center flex flex-col justify-center">
                      <p className="text-[8px] text-slate-550 dark:text-slate-450 uppercase font-black tracking-wider">Histórico PCR</p>
                      <p className="text-[11px] font-extrabold text-rose-700 dark:text-rose-455 mt-1 break-words">{summary.diasInternacao.diaPCR || "Não Realizado"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left columnar block */}
              <div className="lg:col-span-8 space-y-6">
              {/* SECTION 3: HDA SUMMARY */}
              <div id="section-hda" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-xs font-black uppercase tracking-wider">3. Resumo da HDA (História da Doença Atual)</h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-semibold text-slate-900 dark:text-slate-100 bg-emerald-50/15 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-250 dark:border-emerald-900/50 break-words">
                  {summary.hda || "Nenhum sumário de HDA disponível."}
                </p>
                {summary.diasInternacao.intercorrencias?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase select-none mb-2">Datas de intercorrências e marcos adicionais:</p>
                    <div className="flex flex-wrap gap-2">
                      {summary.diasInternacao.intercorrencias.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-extrabold px-2.5 py-1 border border-amber-200/50 dark:border-amber-900/45 rounded-lg break-words"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: CLINICAL LAB EXAMS AND IMAGING */}
              <div id="section-exams" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <Activity className="w-5 h-5" />
                  <h3 className="text-xs font-black uppercase tracking-wider">5. Resultados Principais de Exames</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Laboratories column */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 border-b border-emerald-250 dark:border-emerald-900 pb-1.5 tracking-wider">Gasometria, Biomarcadores & Lab recentes</h4>
                    {summary.exames.laboratoriais?.length > 0 ? (
                      <ul className="space-y-2">
                        {summary.exames.laboratoriais.map((item, idx) => (
                          <li key={idx} className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-start gap-2 bg-slate-50/50 dark:bg-slate-950/45 p-2 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed break-words">
                            <span className="text-emerald-500 font-black shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium italic">Nenhum exame laboratorial relatado.</p>
                    )}
                  </div>

                  {/* Imaging diagnostic column */}
                  <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-5">
                    <h4 className="text-[10px] font-black uppercase text-blue-750 dark:text-blue-405 border-b border-blue-200 dark:border-blue-900 pb-1.5 tracking-wider">Radiologia e Imagem (Rx, TC, US)</h4>
                    {summary.exames.imagem?.length > 0 ? (
                      <ul className="space-y-2">
                        {summary.exames.imagem.map((item, idx) => (
                          <li key={idx} className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-start gap-2 bg-slate-50/50 dark:bg-slate-950/45 p-2 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed break-words">
                            <span className="text-blue-500 font-black shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium italic">Nenhum laudo de imagem anexado.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 6: INFECTION / CULTURES TIMELINE */}
              <div id="section-cultures" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <Droplet className="w-5 h-5" />
                  <h3 className="text-xs font-black uppercase tracking-wider">6. Aspecto Infeccioso, Culturas e Antibióticos</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Culturas results block */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wide select-none pb-1 border-b border-slate-100 dark:border-slate-800 block">Resultados de Culturas</span>
                    {summary.culturasAntibioticos.culturas?.length > 0 ? (
                      <ul className="space-y-2">
                        {summary.culturasAntibioticos.culturas.map((cult, idx) => (
                          <li key={idx} className="text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed break-words">
                            {cult}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-550 dark:text-slate-450 italic">Nenhum cultivo cadastrado.</p>
                    )}
                  </div>

                  {/* Previous Antibiotics completed block */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-405 tracking-wide select-none pb-1 border-b border-rose-100 dark:border-rose-900 block">Antimicrobianos Anteriores (Suspensos)</span>
                    {summary.culturasAntibioticos.antibioticosPrevios?.length > 0 ? (
                      <ul className="space-y-2">
                        {summary.culturasAntibioticos.antibioticosPrevios.map((antib, idx) => (
                          <li key={idx} className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-start gap-1.5 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg break-words">
                            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                            <span>{antib}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-555 dark:text-slate-450 italic">Sem antimicrobianos prévios suspensos.</p>
                    )}
                  </div>

                  {/* Current Active Antibiotics with treatment day (Dx) */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-450 tracking-wide select-none pb-1 border-b border-emerald-100 dark:border-emerald-900 block">Antimicrobianos em Uso (Dia Atual)</span>
                    {summary.culturasAntibioticos.antibioticosAtuais?.length > 0 ? (
                      <div className="space-y-2">
                        {summary.culturasAntibioticos.antibioticosAtuais.map((antib, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-250 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-100 font-extrabold text-xs leading-normal break-words shadow-2xs">
                            <span className="text-base shrink-0 select-none">💊</span>
                            <span>{antib}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-555 dark:text-slate-450 italic">Nenhum antibiótico ativo registrado.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 7: CLINICAL MONITORING, INFUSIONS, VENTILATION */}
              <div id="section-vitals-param" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <Wind className="w-5 h-5" />
                  <h3 className="text-xs font-black uppercase tracking-wider">7. Sinais Clínicos e Monitoração Contínua</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Sinais vitais block */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all font-semibold">
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-455 border-b border-rose-150 dark:border-rose-900 pb-1.5 mb-2.5 flex-wrap">
                      <Heart className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Sinais Vitais</span>
                    </div>
                    {summary.sinaisEParametros.sinaisVitais?.length > 0 ? (
                      <div className="space-y-1.5 text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {summary.sinaisEParametros.sinaisVitais.map((vit, idx) => (
                          <p key={idx} className="border-b border-dotted border-slate-200 dark:border-slate-800 pb-1 break-words last:border-0">{vit}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">Não reportado.</p>
                    )}
                  </div>

                  {/* Balanço Hídrico */}
                  <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-450 border-b border-blue-150 dark:border-blue-900 pb-1.5 mb-2.5 flex-wrap">
                      <Droplet className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Balanço Hídrico</span>
                    </div>
                    <p className="text-xs font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-lg border border-blue-200/55 dark:border-blue-900/50 text-center uppercase tracking-wide break-words shadow-2xs">
                      {summary.sinaisEParametros.balancoHidrico || "Não registrado"}
                    </p>
                  </div>

                  {/* Vasopressores in infusion block */}
                  <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-b border-amber-150 dark:border-amber-900 pb-1.5 mb-2.5 flex-wrap">
                      <Thermometer className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Vasopressores (DVA)</span>
                    </div>
                    {summary.sinaisEParametros.drogasVasoativas?.length > 0 && summary.sinaisEParametros.drogasVasoativas[0] !== "Nenhuma" ? (
                      <div className="space-y-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300">
                        {summary.sinaisEParametros.drogasVasoativas.map((drug, idx) => (
                          <div key={idx} className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-250/20 dark:border-amber-900/30 text-center break-words">{drug}</div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-center uppercase">Sem DVA Ativa</p>
                    )}
                  </div>

                  {/* Parâmetros MV block */}
                  <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 border-b border-emerald-150 dark:border-emerald-950 pb-1.5 mb-2.5 flex-wrap">
                      <Wind className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Ventilação Mecânica</span>
                    </div>
                    {summary.sinaisEParametros.parametrosVentilatorios?.length > 0 ? (
                      <div className="space-y-1.5 text-xs font-semibold text-slate-800 dark:text-slate-150">
                        {summary.sinaisEParametros.parametrosVentilatorios.map((param, idx) => (
                          <p key={idx} className="border-b border-dotted border-slate-200 dark:border-slate-800 last:border-0 pb-1 break-words">{param}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-semibold uppercase italic bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-center">Espontânea / Sem MV</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right columnar block (3.1 PRO / FLASH INFRASTRUCTURE) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SECTION 4: BACKGROUND PATHOLOGIES CLINICAL LABS */}
              <div id="section-history" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Heart className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">4. Histórico Prévio e Alergias</h3>
                </div>

                {/* Comorbidades */}
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase select-none mb-1">Patologias e Comorbidades Prévias</h4>
                  {summary.antecedentes.patologiasPrevias?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {summary.antecedentes.patologiasPrevias.map((p, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 font-semibold px-2 py-0.5 border border-slate-100 dark:border-slate-850 rounded-md">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-450 italic">Sem comorbidades registradas.</p>
                  )}
                </div>

                {/* Medicamentos de uso domiciliar */}
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase select-none mb-1">Medicações de Uso Domiciliar Crônico</h4>
                  {summary.antecedentes.medicacoesCasa?.length > 0 ? (
                    <ul className="space-y-1">
                      {summary.antecedentes.medicacoesCasa.map((m, idx) => (
                        <li key={idx} className="text-xs text-slate-650 dark:text-slate-300 font-medium flex items-center gap-1.5">
                          <span className="text-[10px]">🏠</span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-slate-450 italic">Nenhum fármaco reportado para uso crônico.</p>
                  )}
                </div>

                {/* Alergias list - High alert color pairing */}
                <div className="p-3 bg-rose-50/20 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-950/65 rounded-xl">
                  <div className="flex items-center gap-1 text-rose-600 dark:text-rose-450 mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <h5 className="text-[10px] font-black uppercase tracking-wider">Alergias Relatadas</h5>
                  </div>
                  {summary.antecedentes.alergias?.length > 0 ? (
                    <ul className="space-y-0.5">
                      {summary.antecedentes.alergias.map((a, idx) => (
                        <li key={idx} className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase">
                          • {a}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-rose-500 font-bold bg-rose-50/30 border border-rose-100 rounded-lg p-1 text-center">NEGA ALERGIAS CONHECIDAS</p>
                  )}
                </div>
              </div>

              {/* SECTION 8: ACTIVE CONDUCTS AND VISITATION PENDENCIES */}
              <div id="section-conducts" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Clipboard className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">8. Plano Terapêutico e Pendências</h3>
                </div>

                {/* Active therapeutic conducts in round */}
                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase select-none">Condutas e Diretrizes Clínicas</h4>
                  {summary.planoCondutas.condutas?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {summary.planoCondutas.condutas.map((cond, idx) => (
                        <li key={idx} className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-850/50 leading-tight">
                          <input type="checkbox" defaultChecked className="mt-0.5 h-3.5 w-3.5 border-slate-300 rounded text-emerald-650 focus:ring-emerald-500" />
                          <span>{cond}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Nenhuma conduta direta registrada.</p>
                  )}
                </div>

                {/* Visitation critical pendencies */}
                <div className="space-y-1.5">
                  <h4 className="text-[9px] font-black text-amber-500 uppercase select-none tracking-wider">Pendências Clínicas e Investigativas</h4>
                  {summary.planoCondutas.pendencias?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {summary.planoCondutas.pendencias.map((pend, idx) => (
                        <li key={idx} className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-955/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40 flex items-start gap-2 leading-tight">
                          <span className="h-2 w-2 rounded-full bg-amber-550 shrink-0 mt-1 animate-pulse" />
                          <span>{pend}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50/15 border border-emerald-100 p-1.5 rounded-lg text-center">Nenhuma pendência prioritária ativa!</p>
                  )}
                </div>
              </div>

              {/* SECTION 9: EXTRACTED ACTIVE MEDICAL PRESCRIPTION PRESCRIPTIVE LIST */}
              <div id="section-prescription-checklist" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-slate-105 dark:border-slate-800 pb-2 mb-3">
                  <FileDown className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">9. Medicamentos Ativos da Prescrição</h3>
                </div>

                {summary.prescricaoMedica?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <th className="py-2 px-3 w-12 text-center">Nº</th>
                          <th className="py-2 px-3">Medicamento / Princípio Ativo</th>
                          <th className="py-2 px-3">Dose</th>
                          <th className="py-2 px-3 text-right">Posologia / Frequência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {summary.prescricaoMedica.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                            <td className="py-2.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400 select-none bg-emerald-50/20 dark:bg-emerald-950/10 rounded-l-lg">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                              {med.medicamento}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-900/30">
                                {med.dose || "Não Informada"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right rounded-r-lg">
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200/60 dark:border-slate-700/50">
                                {med.posologia || "Não Informada"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-[11px] text-slate-400 font-medium">Nenhum medicamento ativo pôde ser extraído.</p>
                    <p className="text-[9px] text-slate-450 mt-1">Cole ou anexe uma prescrição médica legível para identificar as soluções em infusão e drogas vasoativas.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <div className="hidden print:block text-center mt-20 text-[9px] text-slate-500 border-t pt-2">
            Este resumo médico foi estruturado cognitivamente sobre dados de admissão e prontuário vigentes pelo Medic Round Pro. 
            Direcionado exclusivamente ao profissional médico assistente — CRM responsável.
          </div>

        </div>
      )}
    </div>
  );
}
