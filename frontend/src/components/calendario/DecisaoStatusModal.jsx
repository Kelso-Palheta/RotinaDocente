'use client';

import React, { useState } from 'react';
import { conteudos } from '@/dominio/calendario/evolucao';
import { ArrowRight, FastForward, CalendarClock, X, AlertTriangle } from 'lucide-react';

export function DecisaoStatusModal({
  isOpen,
  onClose,
  aula,
  novoStatus,
  onConfirmar,
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  if (!isOpen || !aula) return null;
  async function confirmar(decisao) {
    if (salvando) return;
    setSalvando(true); setErro('');
    try { await onConfirmar(decisao); onClose(); }
    catch (error) { setErro(error.message || 'Não foi possível salvar a decisão.'); }
    finally { setSalvando(false); }
  }

  const topicosCount = conteudos(aula).length;
  const isNaoRealizada = novoStatus === 'NAO_REALIZADA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-[#101942] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isNaoRealizada ? 'Aula Não Realizada' : 'Aula Concluída Parcialmente'}
                </h3>
                <p className="text-xs text-slate-300">
                  Como deseja tratar o conteúdo programado ({topicosCount} {topicosCount === 1 ? 'tópico' : 'tópicos'})?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={salvando}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Opções de Decisão */}
        <div className="p-6 space-y-4">
          {erro && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">{erro}</p>}
          {salvando && <p role="status" className="text-sm">Salvando decisão…</p>}
          <p className="text-xs text-slate-500 font-medium">
            Selecione a ação pedagógica ideal para o cronograma desta turma:
          </p>

          <div className="space-y-3">
            {/* Opção 1: Smart Shift */}
            <button
              type="button"
              disabled={salvando}
              onClick={() => confirmar('smart_shift')}
              className="w-full text-left p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                <CalendarClock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#101942]">
                    Reagendar nas próximas aulas
                  </h4>
                  <ArrowRight size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Transfere o conteúdo desta aula para o próximo dia letivo e <strong>desloca em cascata</strong> os conteúdos seguintes. Conteúdos sem vaga ficam pendentes.
                </p>
              </div>
            </button>

            {/* Opção 2: Pular Conteúdo */}
            <button
              type="button"
              disabled={salvando}
              onClick={() => confirmar('pular')}
              className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-100 transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 border border-slate-300 flex items-center justify-center text-slate-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                <FastForward size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#101942]">
                    Devolver aos pendentes e manter próximas datas
                  </h4>
                  <ArrowRight size={16} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <strong>Não altera as próximas aulas</strong>. O conteúdo desta aula retorna para a lista de pendentes para não atrasar o calendário programado.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
              disabled={salvando}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
