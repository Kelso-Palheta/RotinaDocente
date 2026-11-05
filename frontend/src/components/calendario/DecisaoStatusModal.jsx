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
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E2D9F7] animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-[#25104a] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#6315D9]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6315D9]/20 border border-[#6315D9]/30 flex items-center justify-center text-[#6315D9]">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isNaoRealizada ? 'Aula Não Realizada' : 'Aula Concluída Parcialmente'}
                </h3>
                <p className="text-xs text-[#B9A6EF]">
                  Como deseja tratar o conteúdo programado ({topicosCount} {topicosCount === 1 ? 'tópico' : 'tópicos'})?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={salvando}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#B9A6EF] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Opções de Decisão */}
        <div className="p-6 space-y-4">
          {erro && <p role="alert" className="text-sm text-[#5411B8] bg-[#F3EDFF] p-3 rounded-xl">{erro}</p>}
          {salvando && <p role="status" className="text-sm">Salvando decisão…</p>}
          <p className="text-xs text-[#6E5F94] font-medium">
            Selecione a ação pedagógica ideal para o cronograma desta turma:
          </p>

          <div className="space-y-3">
            {/* Opção 1: Smart Shift */}
            <button
              type="button"
              disabled={salvando}
              onClick={() => confirmar('smart_shift')}
              className="w-full text-left p-4 rounded-2xl border-2 border-[#E7DBFD] hover:border-[#6315D9] bg-[#F3EDFF]/40 hover:bg-[#F3EDFF]/80 transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#6315D9]/10 border border-[#E2D9F7] flex items-center justify-center text-[#6315D9] flex-shrink-0 group-hover:scale-110 transition-transform">
                <CalendarClock size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#25104a]">
                    Reagendar nas próximas aulas
                  </h4>
                  <ArrowRight size={16} className="text-[#6315D9] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-[#6E5F94] mt-1">
                  Transfere o conteúdo desta aula para o próximo dia letivo e <strong>desloca em cascata</strong> os conteúdos seguintes. Conteúdos sem vaga ficam pendentes.
                </p>
              </div>
            </button>

            {/* Opção 2: Pular Conteúdo */}
            <button
              type="button"
              disabled={salvando}
              onClick={() => confirmar('pular')}
              className="w-full text-left p-4 rounded-2xl border-2 border-[#E2D9F7] hover:border-[#6E5F94] bg-[#F3EDFF]/60 hover:bg-[#F3EDFF] transition-all group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E2D9F7]/60 border border-[#B9A6EF] flex items-center justify-center text-[#5B4B86] flex-shrink-0 group-hover:scale-110 transition-transform">
                <FastForward size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#25104a]">
                    Devolver aos pendentes e manter próximas datas
                  </h4>
                  <ArrowRight size={16} className="text-[#6E5F94] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-[#6E5F94] mt-1">
                  <strong>Não altera as próximas aulas</strong>. O conteúdo desta aula retorna para a lista de pendentes para não atrasar o calendário programado.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F3EDFF] border-t border-[#F3EDFF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
              disabled={salvando}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#5B4B86] hover:bg-[#E2D9F7] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
