import React, { useState, useEffect } from 'react';
import { 
  PatientRound, 
  PatientVitals, 
  PatientHydration, 
  PatientProphylaxis 
} from './types';
import DailyRoundTab from './components/DailyRoundTab';
import VentilationTab from './components/VentilationTab';
import ScoresTab from './components/ScoresTab';
import CalculatorTab from './components/CalculatorTab';
import { 
  Stethoscope, 
  Users, 
  Wind, 
  Activity, 
  Calculator, 
  Moon, 
  Sun, 
  HeartHandshake
} from 'lucide-react';

// Generates simulated clinical patients for instant visual satisfaction on first-load
const INITIAL_DEMO_PATIENTS: PatientRound[] = [
  {
    id: 'demo-1',
    name: 'Sebastião Ferreira de Souza',
    age: 72,
    bed: 'UTI 03',
    vitals: {
      fcMin: 65, fcMax: 118,
      frMin: 14, frMax: 26,
      pasMin: 95, pasMax: 145,
      padMin: 55, padMax: 85,
      tempMin: 36.2, tempMax: 37.9,
      satMin: 91, satMax: 98
    },
    hydration: {
      entries: 1850,
      diuresis: 1400,
      otherSaidas: 150
    },
    dietType: 'Enteral',
    dietObs: 'Infusore 65ml/h - Alvo metabólico normoglicêmico',
    evacuated: true,
    prophylaxis: {
      tvp: true,
      ulcer: true,
      eyeDrop: true
    },
    occurrences: 'Apresentou pico de agitação psicomotora transiente às 03:00 da manhã. Solicitado ajuste de RASS para -1. Sem déficits hemodinâmicos sustentados.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'demo-2',
    name: 'Maria Clarice Gonçalves',
    age: 58,
    bed: 'UTI 07',
    vitals: {
      fcMin: 72, fcMax: 94,
      frMin: 12, frMax: 18,
      pasMin: 110, pasMax: 130,
      padMin: 60, padMax: 78,
      tempMin: 35.8, tempMax: 36.8,
      satMin: 95, satMax: 100
    },
    hydration: {
      entries: 2100,
      diuresis: 2350,
      otherSaidas: 0
    },
    dietType: 'VO',
    dietObs: 'Dieta branda hipossódica sem restrições hídricas',
    evacuated: false,
    prophylaxis: {
      tvp: true,
      ulcer: false,
      eyeDrop: false
    },
    occurrences: 'Paciente em desmame ventilatório bem sucedido (PSV ativo de 8 cmH2O). Hemodinâmica limpa, programado rebaixamento de vigilância intensiva para amanhã cedo.',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'round' | 'vent' | 'scores' | 'calc'>('round');
  const [patients, setPatients] = useState<PatientRound[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load state and themes
  useEffect(() => {
    const savedPatients = localStorage.getItem('medic_round_patients');
    if (savedPatients) {
      try {
        setPatients(JSON.parse(savedPatients));
      } catch (e) {
        setPatients(INITIAL_DEMO_PATIENTS);
      }
    } else {
      setPatients(INITIAL_DEMO_PATIENTS);
      localStorage.setItem('medic_round_patients', JSON.stringify(INITIAL_DEMO_PATIENTS));
    }

    const savedTheme = localStorage.getItem('medic_round_theme') as 'light' | 'dark' | null;
    const currentTheme = savedTheme || 'light';
    setTheme(currentTheme);
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Save patient update
  const handleSavePatient = (updatedPatient: PatientRound) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedPatient.id);
      let nextPatients: PatientRound[];
      if (idx !== -1) {
        // Update
        nextPatients = [...prev];
        nextPatients[idx] = updatedPatient;
      } else {
        // Create new
        nextPatients = [updatedPatient, ...prev];
      }
      localStorage.setItem('medic_round_patients', JSON.stringify(nextPatients));
      return nextPatients;
    });
  };

  // Delete patient
  const handleDeletePatient = (id: string) => {
    if (window.confirm('Tem certeza de que deseja remover este paciente do registro de round?')) {
      setPatients((prev) => {
        const nextPatients = prev.filter((p) => p.id !== id);
        localStorage.setItem('medic_round_patients', JSON.stringify(nextPatients));
        return nextPatients;
      });
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('medic_round_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Clinician Top Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-xl text-white shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-slate-850 dark:text-white uppercase">Medic Round Pro</h1>
                <span className="text-[10px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-extrabold px-1.5 py-0.5 rounded-sm select-none">
                  LEITO UTI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold select-none leading-none">Visita e Controle Multidisciplinar Intensivo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stats on the header */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 font-medium">Pacientes ativos:</span>
              <span className="font-bold text-slate-800 dark:text-white">{patients.length}</span>
            </div>

            {/* Dark & Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-500 dark:text-slate-450 transition-colors border border-transparent hover:border-slate-205 dark:hover:border-slate-800"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Clinical Navigation Workspace */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 sticky top-[57px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-1 sm:py-2 scrollbar-none">
            {[
              { id: 'round', name: 'Round Diário', icon: Users },
              { id: 'vent', name: 'Ventilação Mecânica', icon: Wind },
              { id: 'scores', name: 'Escores Médicos', icon: Activity },
              { id: 'calc', name: 'Calculadora Médica', icon: Calculator }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg border transition-all whitespace-nowrap scroll-mx-6 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-transparent border-transparent text-slate-605 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Viewport Workspace Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {activeTab === 'round' && (
          <DailyRoundTab 
            patients={patients} 
            onSavePatient={handleSavePatient} 
            onDeletePatient={handleDeletePatient} 
          />
        )}
        {activeTab === 'vent' && <VentilationTab />}
        {activeTab === 'scores' && <ScoresTab />}
        {activeTab === 'calc' && <CalculatorTab />}
      </main>

      {/* Clinical Footer Disclaimer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-850 py-4 px-4 text-center mt-12 select-none">
        <p className="text-[11px] text-slate-405 font-medium flex items-center justify-center gap-1">
          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
          Medic Round Pro — Projetado para médicos intensivistas, emergencistas e pneumologistas.
        </p>
        <p className="text-[9px] text-slate-400 max-w-lg mx-auto leading-tight mt-1">
          Este aplicativo é uma plataforma auxiliar para rounds analíticos e de ventilação mecânica. Use sempre em conformidade com o regimento clínico, CRM local e exames de fidedignidade laboratorial.
        </p>
      </footer>
    </div>
  );
}
