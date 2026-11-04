'use client';

import React, { useState } from 'react';
import { BookOpen, X, Check, Trash2 } from 'lucide-react';

export function TopicoModal(props) {
  if (!props.isOpen) return null;
  return <ConteudoEditor key={JSON.stringify(props.topicoEmEdicao || {})} {...props} />;
}

function ConteudoEditor({ onClose, topicoEmEdicao = null, onSalvar, onExcluir }) {
  const [titulo, setTitulo] = useState(topicoEmEdicao?.titulo || '');
  const [descricao, setDescricao] = useState(topicoEmEdicao?.descricao || '');
  const [duracao, setDuracao] = useState(topicoEmEdicao?.duracaoEstimadaAulas || 1);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const isEdicao = Boolean(topicoEmEdicao);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || ocupado) return;
    if (!Number.isInteger(Number(duracao)) || Number(duracao) < 1 || Number(duracao) > 100) { setErro('Informe uma duração inteira entre 1 e 100 tempos.'); return; }
    setOcupado(true); setErro('');
    try {
      const { estado: _estado, ...original } = topicoEmEdicao || {};
      await onSalvar({ ...original, titulo: titulo.trim(), descricao: descricao.trim(), duracaoEstimadaAulas: Number(duracao) });
      onClose();
    } catch (err) { setErro(err.message || 'Não foi possível salvar o conteúdo.'); }
    finally { setOcupado(false); }
  };
  const excluir = async () => {
    if (ocupado || !window.confirm(`Excluir o conteúdo "${titulo}"?`)) return;
    setOcupado(true); setErro('');
    try { await onExcluir(topicoEmEdicao.id); onClose(); }
    catch (err) { setErro(err.message || 'Não foi possível excluir o conteúdo.'); }
    finally { setOcupado(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Conteúdo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#D5E3DC] animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-[#123c3a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E]/20 border border-[#0F766E]/30 flex items-center justify-center text-[#0F766E]">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdicao ? 'Editar conteúdo' : 'Novo conteúdo'}
              </h3>
              <p className="text-[11px] text-[#B7D3C8]">
                {isEdicao ? 'Atualize as informações do conteúdo' : 'Adicione manualmente ao planejamento'}
              </p>
            </div>
          </div>
          <button
            disabled={ocupado}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#B7D3C8] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <fieldset disabled={ocupado} className="space-y-4">
          <div>
            <label htmlFor="conteudo-titulo" className="text-xs font-bold uppercase tracking-wider text-[#4F6B63] mb-1 block">
              Título do conteúdo
            </label>
            <input
              id="conteudo-titulo" type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Introdução à Função Quadrática"
              className="w-full p-2.5 bg-[#F3F8F5] border border-[#D5E3DC] rounded-xl text-xs font-bold text-[#123c3a] outline-none focus:border-[#0F766E] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4F6B63] mb-1 block">
              Descrição / Habilidades BNCC (Opcional)
            </label>
            <textarea
              aria-label="Descrição / Habilidades BNCC"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Habilidade EM13MAT101 - Vértice da parábola e raízes reais"
              rows={3}
              className="w-full p-2.5 bg-[#F3F8F5] border border-[#D5E3DC] rounded-xl text-xs text-[#35594D] outline-none focus:border-[#0F766E] focus:bg-white transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#4F6B63] mb-1 block">
              Duração estimada (tempos)
            </label>
            <input
              aria-label="Duração estimada em tempos" type="number"
              min={1}
              max={100}
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className="w-24 p-2 bg-[#F3F8F5] border border-[#D5E3DC] rounded-xl text-xs font-bold text-[#123c3a] outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#F3F7F5] flex items-center justify-between">
            {isEdicao && onExcluir ? (
              <button
                type="button"
                onClick={excluir}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#0F766E] hover:bg-[#F3F8F5] transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={ocupado}
            onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#4F6B63] hover:bg-[#F3F7F5] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#0B5F59] text-white text-xs font-bold shadow-md transition-all"
              >
                <Check size={14} />
                {ocupado ? 'Aguarde...' : isEdicao ? 'Salvar alterações' : 'Adicionar conteúdo'}
              </button>
            </div>
          </div>
          </fieldset>
          {erro && <p role="alert" className="text-sm text-[#0B5F59]">{erro}</p>}
        </form>
      </div>
    </div>
  );
}
