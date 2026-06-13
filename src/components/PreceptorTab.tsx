import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  UploadCloud, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Check, 
  Clock, 
  ChevronRight, 
  Loader2, 
  Database, 
  Plus, 
  Send, 
  X, 
  BrainCircuit, 
  CheckCircle2, 
  Bookmark,
  ChevronDown,
  Info,
  Cloud,
  FolderOpen,
  LogOut,
  RefreshCw,
  Folder
} from 'lucide-react';

import { 
  auth, 
  googleSignIn, 
  googleSignOut, 
  initAuthListener, 
  getCachedToken, 
  setCachedToken 
} from '../lib/firebase';

interface RAGDocument {
  id: string;
  name: string;
  size: number;
  chunkCount: number;
  uploadedAt: string;
}

interface RAGMatch {
  docName: string;
  text: string;
  relevance: number;
}

interface QueryResponse {
  answer: string;
  matches: RAGMatch[];
}

export default function PreceptorTab() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastResponse, setLastResponse] = useState<QueryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Document upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showAddTextModal, setShowAddTextModal] = useState(false);
  const [newTextTitle, setNewTextTitle] = useState('');
  const [newTextContent, setNewTextContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Extra features
  const [activeQueryHistory, setActiveQueryHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Google Drive Integration state
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [syncingFileId, setSyncingFileId] = useState<string | null>(null);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Custom confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Default suggested quick queries
  const QUICK_QUERIES = [
    "Como ventilar paciente asmático no DPOC?",
    "Qual a dose de indução na ISR de UTI?",
    "Como é composto o pacote de 1 hora na sepse?"
  ];

  // Fetch documents and hook up auth on mount
  useEffect(() => {
    fetchDocuments();
    
    // Auto-listen to Google Auth credentials persistence
    const unsubscribe = initAuthListener(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        if (token) {
          fetchDriveFiles(token);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConnectDrive = async () => {
    try {
      setIsFetchingDrive(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setCachedToken(res.accessToken);
        await fetchDriveFiles(res.accessToken);
        setShowDriveModal(true);
      }
    } catch (err: any) {
      console.error(err);
      alert("Falha de autenticação com o Google Drive: " + (err.message || err));
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    setConfirmModal({
      title: "Desconectar Google Drive",
      message: "Deseja mesmo desconectar sua conta do Google Drive deste dispositivo?",
      onConfirm: async () => {
        try {
          await googleSignOut();
          setGoogleUser(null);
          setGoogleToken(null);
          setCachedToken(null);
          setDriveFiles([]);
          setShowDriveModal(false);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const fetchDriveFiles = async (token: string) => {
    setIsFetchingDrive(true);
    try {
      const folderId = "1WX7q9gxCKwJnNexcY7vLZuTQlyTgsDdS";
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false and (mimeType = 'application/pdf' or mimeType = 'text/plain' or mimeType = 'application/vnd.google-apps.document')`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=name&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=40&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          await googleSignOut();
          setGoogleUser(null);
          setGoogleToken(null);
          setCachedToken(null);
          setDriveFiles([]);
          throw new Error("Sessão expirada. Por favor reconecte sua conta do Google Drive.");
        }
        throw new Error("Erro de comunicação com a API do Google Drive.");
      }
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao carregar lista de arquivos do seu Google Drive.');
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const handleImportDriveFile = async (file: { id: string, name: string, mimeType: string }) => {
    if (!googleToken) return;
    setSyncingFileId(file.id);
    setIsUploading(true);
    setUploadProgress(`Iniciando conexão segura com Google Drive...`);
    setErrorMessage(null);

    try {
      if (file.mimeType.includes("pdf")) {
        setUploadProgress(`Indexando "${file.name}" via Inteligência Artificial (OCR e Segmentação)...`);
      } else {
        setUploadProgress(`Lendo diretrizes de "${file.name}" e convertendo blocos estruturais...`);
      }

      const res = await fetch('/api/preceptor/import-drive-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          accessToken: googleToken
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro interno ao indexar conteúdo.');
      }

      await fetchDocuments();
      alert(`Excelente! Referência do Preceptor "${file.name}" sincronizada com sucesso no banco RAG!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Erro ao importar do Google Drive: ${err.message}`);
    } finally {
      setSyncingFileId(null);
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/preceptor/documents');
      if (!res.ok) throw new Error('Erro ao carregar os documentos.');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Não foi possível obter a lista de documentos do Preceptor RAG.');
    }
  };

  const handleQuerySubmit = async (textToQuery: string) => {
    if (!textToQuery.trim() || isQuerying) return;
    setQuery(textToQuery);
    setIsQuerying(true);
    setErrorMessage(null);

    // Save history
    if (!activeQueryHistory.includes(textToQuery)) {
      setActiveQueryHistory(prev => [textToQuery, ...prev].slice(0, 5));
    }

    try {
      const res = await fetch('/api/preceptor/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToQuery })
      });

      if (!res.ok) {
        const errText = await res.json();
        throw new Error(errText.error || 'Erro na pesquisa semântica.');
      }

      const data = await res.json();
      setLastResponse(data);
      
      // Smooth scroll to chat bottom
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Falha ao processar dúvida com o Preceptor RAG.');
    } finally {
      setIsQuerying(false);
    }
  };

  // Delete document
  const handleDeleteDoc = async (id: string, name: string) => {
    setConfirmModal({
      title: "Excluir Manual",
      message: `Deseja mesmo excluir permanentemente o manual "${name}" e todos os seus fragmentos no banco RAG? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/preceptor/document/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Falha ao deletar documento.');
          setDocuments(prev => prev.filter(d => d.id !== id));
          // Reset last queries if they reference it
          if (lastResponse && lastResponse.matches.some(m => m.docName === name)) {
            setLastResponse(null);
          }
        } catch (err: any) {
          alert(err.message || 'Erro ao deletar documento do banco.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Text upload submission
  const handleAddTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextTitle.trim() || !newTextContent.trim()) return;

    setIsUploading(true);
    setUploadProgress('Fatiando texto e gerando embeddings...');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/preceptor/upload-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTextTitle, content: newTextContent })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao indexar texto.');
      }

      setNewTextTitle('');
      setNewTextContent('');
      setShowAddTextModal(false);
      await fetchDocuments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao indexar protocolo.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the dataurl prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Formato de arquivo incompatível.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Handle uploaded files
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    setUploadProgress(`Lendo "${file.name}"...`);
    setErrorMessage(null);

    try {
      const base64Data = await fileToBase64(file);
      
      // Determine OCR progress warning if PDF
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setUploadProgress('Extraindo texto e transcrevendo via Gemini OCR (isso pode levar uns segundos)...');
      } else {
        setUploadProgress('Indexando fragmentos e criando banco de vetores...');
      }

      const res = await fetch('/api/preceptor/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao processar arquivo.');
      }

      await fetchDocuments();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Incompatibilidade de arquivo: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1 min-h-[70vh]" id="preceptor-viewport">
      
      {/* Sidebar: RAG Document Manager */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Banco de Vetores RAG
            </h2>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
            Seus arquivos são fatiados em blocos de parágrafos estruturados e convertidos em vetores. Pesquisas utilizam apenas as referências autorais listadas abaixo.
          </p>

          {!isAdmin && (
            <p className="text-[11px] bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-150 dark:border-slate-855 text-slate-600 dark:text-slate-400 mb-5 leading-relaxed font-medium">
              ℹ️ Biblioteca de diretrizes indexadas blindada contra alterações externas. Suas condutas são fundamentadas estritamente nas referências do preceptor.
            </p>
          )}

          {/* Google Drive Integration Panel */}
          {isAdmin && (
            <>
              {!googleUser ? (
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center mb-6">
                  <Cloud className="w-8 h-8 text-blue-500 dark:text-blue-450 mx-auto mb-2" />
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">G-Drive Integrado</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                    Vincule as condutas, diretrizes clínicas e protocolos da UTI diretamente do seu Google Drive com inteligência RAG.
                  </p>
                  <button
                    onClick={handleConnectDrive}
                    disabled={isFetchingDrive}
                    className="w-full justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all focus:ring-2 focus:ring-blue-500/20 active:scale-[0.98]"
                  >
                    {isFetchingDrive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderOpen className="w-3.5 h-3.5" />
                    )}
                    Conectar Google Drive
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50/80 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200/85 dark:border-slate-800/85 mb-6">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-150 dark:border-slate-850">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <div className="w-6 h-6 rounded-full bg-blue-105 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 font-extrabold text-[10px] uppercase">
                        {googleUser.email?.slice(0, 2) || 'GD'}
                      </div>
                      <div className="truncate">
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Drive Ativo</p>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate" title={googleUser.email}>
                          {googleUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDisconnectDrive}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                      title="Desconectar conta Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowDriveModal(true)}
                    className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-705 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-200/40 dark:border-slate-750 transition-colors shadow-2xs"
                  >
                    <Folder className="w-4 h-4 text-blue-500 dark:text-blue-450" />
                    Vincular Manuais do Drive
                  </button>
                </div>
              )}
            </>
          )}

          {/* Documents lists */}
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Manuais Ativos ({documents.length})
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-850 dark:hover:text-blue-400 rounded-md transition-colors text-slate-400"
                  title="Upload de Manual (PDF/TXT)"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTextModal(true)}
                  className="p-1 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-850 dark:hover:text-emerald-450 rounded-md transition-colors text-slate-400"
                  title="Digitar manual como texto"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Hidden native input picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              accept=".pdf,.txt"
              className="hidden"
            />

            {isUploading && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-105 dark:border-blue-900/50 rounded-xl p-3 animate-pulse">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-450 animate-spin" />
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300">Análise de IA</span>
                </div>
                <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-snug">{uploadProgress}</p>
              </div>
            )}

            {documents.length === 0 && !isUploading ? (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850">
                <Bookmark className="w-5 h-5 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Biblioteca Vazia</p>
                <p className="text-[9px] text-slate-500 max-w-[140px] mx-auto mt-0.5 leading-snug">Seus manuais precursores aparecerão indexados aqui.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-150 dark:border-slate-850/80 hover:bg-slate-100 dark:hover:bg-slate-950 transition-colors"
                >
                  <div className="flex items-start gap-2.5 max-w-[80%]">
                    <FileText className="w-4 h-4 text-blue-500 dark:text-blue-450 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-205 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 mt-1">
                        <span className="text-[9px] bg-blue-100/60 dark:bg-blue-950/50 text-blue-800 dark:text-blue-350 px-1 py-0.2 rounded-sm font-mono font-bold leading-normal">
                          {doc.chunkCount} {doc.chunkCount === 1 ? 'bloco' : 'blocos RAG'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          {Math.round(doc.size / 102.4) / 10} KB
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.name)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-955/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors select-none"
                    title="Excluir documento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informative system info */}
        <div className="mt-6 p-3.5 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-101 dark:border-yellow-950/30 rounded-xl select-none">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-yellow-800 dark:text-yellow-405 leading-relaxed">
              <strong>Grounding Clínico Estrito:</strong> Na ausência de manuais, o Preceptor IA autocarrega os protocolos de SARA, ISR e Sepse padrão de UTI de forma segura.
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel: Interactive AI Preceptor Chat/Query Workspace */}
      <div className="lg:col-span-3 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-880 p-5 min-h-[580px] shadow-sm relative">
        
        {/* Workspace Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-950/60 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-800 dark:text-white">Preceptor IA</h2>
                <span className="text-[9px] bg-purple-100 dark:bg-purple-950/50 text-purple-705 dark:text-purple-400 px-1.5 py-0.5 rounded-sm font-extrabold tracking-wider uppercase">
                  Somente Seus Dados
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold select-none">Mecanismo de busca fundamentado exclusivamente em dados médicos autorais</p>
            </div>
          </div>
          <div 
            onClick={() => {
              const next = !isAdmin;
              setIsAdmin(next);
              if (next) {
                alert("Modo Administrador Habilitado: Painel de upload e exclusão de manuais clínicos ativado com sucesso para você.");
              } else {
                alert("Modo Administrador Desabilitado: Painel de upload e exclusão ocultado.");
              }
            }}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold uppercase cursor-pointer select-none transition-all"
            title="Selo de Grounding do Preceptor - Toque para controles avançados"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {isAdmin ? 'ADMIN MODE' : 'RAG ATIVO'}
          </div>
        </div>

        {/* Output Workspace */}
        <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-105 dark:border-red-900/40 rounded-xl p-4 text-xs text-red-750 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-extrabold mb-0.5">Falha Clínico-Tecnológica</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!lastResponse && !isQuerying ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-12 px-6 text-center max-w-xl mx-auto flex flex-col items-center justify-center h-full min-h-[350px]"
              >
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full text-blue-500/80 mb-4 border border-slate-100 dark:border-slate-850">
                  <GraduationCap className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-black text-slate-850 dark:text-white">Consulta do Professor IA</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-2 leading-relaxed">
                  Digite sua dúvida sobre drogas vasoativas, parâmetros de ventilação mecânica protetora, diretrizes ou doentes. O Preceptor IA vasculhará os manuais indexados via algoritmo de <strong className="text-blue-500">busca semântica por cossenos</strong>, fundamentando respostas unicamente nos trechos mais compatíveis!
                </p>

                {/* Quick suggestions */}
                <div className="mt-8 w-full">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-left">
                    Dúvidas recomendadas / Seeding padrão
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_QUERIES.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuerySubmit(q)}
                        className="py-2.5 px-3.5 text-left bg-slate-50 hover:bg-blue-50/50 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-850 hover:border-blue-300 dark:hover:border-slate-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-between group"
                      >
                        <span className="truncate pr-4">{q}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                
                {/* Active question query card */}
                {query && (
                  <div className="flex gap-3 justify-end items-start">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm py-3 px-4.5 text-xs max-w-xl shadow-xs leading-relaxed font-bold">
                      {query}
                    </div>
                  </div>
                )}

                {/* AI generated grounded response */}
                {isQuerying ? (
                  <div className="flex gap-3 justify-start items-start animate-pulse">
                    <div className="bg-blue-105 dark:bg-blue-950/40 p-2 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="space-y-2 flex-1 max-w-xl">
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded-md w-[40%]" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded-md w-[90%]" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded-md w-[80%]" />
                      <div className="h-3 bg-slate-105 dark:bg-slate-855 rounded-md w-[60%]" />
                    </div>
                  </div>
                ) : (
                  lastResponse && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex gap-3 justify-start items-start">
                        <div className="bg-blue-100 dark:bg-blue-950 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                          <GraduationCap className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 sm:p-5 border border-slate-150 dark:border-slate-850">
                          
                          {/* Main response text parsed using safe standard blocks */}
                          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-150 leading-relaxed font-normal whitespace-pre-wrap">
                            {lastResponse.answer}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850/80 mt-4 pt-3 uppercase font-extrabold select-none">
                            <Clock className="w-3.5 h-3.5 text-slate-350" /> Consultor Preceptor Clínico IA
                          </div>
                        </div>
                      </div>

                      {/* Display retrieved RAG grounding matches */}
                      {lastResponse.matches && lastResponse.matches.length > 0 && (
                        <div className="pl-0 sm:pl-12">
                          <div className="flex items-center gap-2 mb-3">
                            <Bookmark className="w-4 h-4 text-slate-405 shrink-0" />
                            <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                              Origens Ancoradas para esta resposta ({lastResponse.matches.length})
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {lastResponse.matches.map((match, i) => (
                              <div 
                                key={i}
                                className="bg-white dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750 transition-colors flex flex-col justify-between"
                              >
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed italic mb-3">
                                  "{match.text}"
                                </p>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900/50">
                                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-305 truncate max-w-[70%]" title={match.docName}>
                                    {match.docName}
                                  </span>
                                  {/* Similarity badge */}
                                  <span className="text-[9px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-sm">
                                    {(match.relevance * 100).toFixed(0)}% ref
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                )}
              </div>
            )}
          </AnimatePresence>
          <div ref={chatBottomRef} />
        </div>

        {/* Input box */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleQuerySubmit(query); }}
            className="relative flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all"
          >
            <div className="pl-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={documents.length === 0 ? "Consulte os protocolos padrão de UTI (Asma, SARA, Sepse)..." : "Digitar pergunta sobre manual indexado..."}
              disabled={isQuerying}
              className="flex-1 bg-transparent py-2.5 px-1 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-550 min-w-0"
              id="preceptor-query-input"
            />
            
            <button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 shadow-sm"
              id="preceptor-submit-btn"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perguntar</span>
            </button>
          </form>
          
          <div className="flex items-center justify-between px-1.5 mt-2 select-none">
            <span className="text-[9px] text-slate-405 leading-none">
              Respostas baseadas estritamente em cossenos vetoriais.
            </span>
            {activeQueryHistory.length > 0 && (
              <span className="text-[9px] text-slate-400 leading-none">
                {activeQueryHistory.length} histórico recente
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Manual text block dialog/modal */}
      <AnimatePresence>
        {showAddTextModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-450" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                    Adicionar Referência RAG
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAddTextModal(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTextSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 mb-1">
                    Título do Manual / Protocolo
                  </label>
                  <input
                    type="text"
                    required
                    value={newTextTitle}
                    onChange={(e) => setNewTextTitle(e.target.value)}
                    placeholder="Ex: Protocolo de Antibioticoterapia do Hospital"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 mb-1">
                    Conteúdo Clínico
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={newTextContent}
                    onChange={(e) => setNewTextContent(e.target.value)}
                    placeholder="Cole aqui o texto do protocolo, diretrizes, condutas ou anotações médicas completas..."
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 font-sans leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddTextModal(false)}
                    className="py-2 px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Indexar Documento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDriveModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-3.5 mb-4 items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-450" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                      Pasta de Manuais da UTI
                    </h3>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Integrado com a pasta compartilhada de Protocolos</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => googleToken && fetchDriveFiles(googleToken)}
                    disabled={isFetchingDrive}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-105 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title="Atualizar arquivos"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetchingDrive ? 'animate-spin text-blue-500' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setShowDriveModal(false)}
                    className="p-2 text-slate-400 hover:bg-slate-101 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Information bar */}
              <p className="text-[11px] bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-150 dark:border-slate-850/80 text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                📂 <strong>Pasta Integrada:</strong> Buscando arquivos em <code>...folders/1WX7q9gx...</code>. Selecione as diretrizes ou condutas para que a IA do Preceptor extraia, organize e vetorize as condutas clínicas do manual automaticamente.
              </p>

              {/* Live search input */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  placeholder="Pesquisar manuais, protocolos ou PDFs no seu Google Drive..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-55 dark:bg-slate-955 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-slate-200"
                />
              </div>

              {/* List space */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] max-h-[350px]">
                {isFetchingDrive && driveFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-semibold">Verificando arquivos no seu Google Drive...</p>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-850">
                    <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Nenhum documento encontrado</p>
                    <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto mt-1 leading-relaxed">
                      Sua conta não possui PDFs, arquivos de texto ou Google Docs válidos na pasta raiz do Drive, ou estão na lixeira.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filtered = driveFiles.filter(f => f.name.toLowerCase().includes(driveSearch.toLowerCase()));
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/30 rounded-xl">
                          <p className="text-xs text-slate-400">Nenhum arquivo coincide com a busca "{driveSearch}".</p>
                        </div>
                      );
                    }
                    return filtered.map(file => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-950 transition-all"
                      >
                        <div className="flex items-center gap-3 max-w-[70%]">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            file.mimeType.includes("pdf") 
                              ? 'bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400' 
                              : file.mimeType.includes("document") 
                              ? 'bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-450' 
                              : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-450'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-205 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-medium">
                                Modificado em {new Date(file.modifiedTime).toLocaleDateString("pt-BR")}
                              </span>
                              {file.size && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  • {Math.round(parseInt(file.size) / 1024)} KB
                                </span>
                              )}
                              <span className="text-[9px] bg-slate-205 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.2 rounded-sm text-[8px] font-bold uppercase shrink-0">
                                {file.mimeType.includes("pdf") ? 'PDF' : file.mimeType.includes("document") ? 'GDoc' : 'TEXT'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleImportDriveFile(file)}
                          disabled={isUploading}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1.5 ${
                            syncingFileId === file.id
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs focus:ring-1 focus:ring-blue-400 active:scale-[0.97]'
                          }`}
                        >
                          {syncingFileId === file.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Sincronizando
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3" />
                              Sincronizar
                            </>
                          )}
                        </button>
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 leading-none">
                  Controle de RAG seguro • {driveFiles.length} arquivos mapeados
                </span>
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="py-2 px-4 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom confirmation popup overlay */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {confirmModal.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-500 active:scale-[0.97] rounded-xl transition-all shadow-xs"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
