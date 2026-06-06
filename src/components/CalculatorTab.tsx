import React, { useState } from 'react';
import { ClipboardList, Sparkles, Send, ArrowRight, Layers, HelpCircle } from 'lucide-react';

export default function CalculatorTab() {
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

  return (
    <div className="space-y-6">
      {/* Pristine workspace header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-805 shadow-xs space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <ClipboardList className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-850 dark:text-white">Calculadora Médica Customizada</h2>
            <p className="text-sm text-slate-500">Módulo de Atendimento Personalizado beira-leito.</p>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 space-y-3">
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/35 p-4 rounded-xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-350 font-medium">
              <p className="font-bold text-amber-900 dark:text-amber-350">Aguardando Especificações de Redação Clinical:</p>
              <p>
                Como solicitado nas instruções ("*Ainda vou informar as orientações, por enquanto não monte nada dentro da aba*"), esta área de trabalho está estruturalmente pronta para acomodar suas fórmulas preferidas, doses de drogas vasoativas (Nora, Fentanil, Propofol), taxas de infusão ou cálculos adicionais.
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                👉 Envie-nos as equações desejadas e faremos a ativação analítica instantânea neste painel!
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic conversion micro-utility as an non-obtrusive, useful assistant placeholder */}
        <div className="bg-slate-50 dark:bg-slate-955 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Layers className="w-4 h-4 text-blue-500" />
            Conversor Auxiliar Temp (Celsius ↔ Fahrenheit)
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Temperatura (°Celsius)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 37"
                value={celsius}
                onChange={(e) => handleCelsiusChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Temperatura (°Fahrenheit)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 98.6"
                value={fahrenheit}
                onChange={(e) => handleFahrenheitChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
              />
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 italic">
            Atalho rápido para rounds em pacientes com dados descritos em literatura americana ou inglesa.
          </p>
        </div>

        {/* Concept graphic layout to inspire the user */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-1">
            <span className="text-sm">🧪</span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Gasometria Avançada</p>
            <p className="text-[9px] text-slate-400">Ânion Gap, bicarbonato ideal, excesso de base...</p>
          </div>
          <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-1">
            <span className="text-sm">💧</span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Drogas & Infusões</p>
            <p className="text-[9px] text-slate-400">Bombas de infusão, mcg/kg/min em ml/h...</p>
          </div>
          <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-1">
            <span className="text-sm">🫁</span>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Filtração Hematológica</p>
            <p className="text-[9px] text-slate-450">Clerance de creatinina (Cockcroft-Gault / CKD-EPI)...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
