'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import { planejarDistribuicao, conteudos } from '@/dominio/calendario/evolucao';

export function AutoDistribuirModal(props) {
  if (!props.isOpen) return null;
  return <DistribuicaoEditor key={JSON.stringify([props.dataInicioPadrao, props.dataFim, props.aulas, props.topicos, props.feriados])} {...props} />;
}

function DistribuicaoEditor({ onClose, topicos = [], aulas = [], dataInicioPadrao, dataFim, onConfirmar, feriados = [] }) {
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const primeiraData = [...aulas].map(a => a.dataAgendada).sort()[0] || hoje;
  const inicio = dataInicioPadrao === 'inicio_ano' ? primeiraData : /^\d{4}-\d{2}-\d{2}$/.test(dataInicioPadrao || '') ? dataInicioPadrao : hoje;
  const [dataInicio, setDataInicio] = useState(inicio);
  const [fim, setFim] = useState(dataFim || [...aulas].map(a => a.dataAgendada).sort().at(-1) || hoje);
  const [modo, setModo] = useState('apenas_vagas');
  const [preview, setPreview] = useState(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const invalidar = () => { setPreview(null); setErro(''); };
  const rotulos = a => conteudos(a).map(t => `${t.topicoTitulo || t.titulo || topicos.find(x => String(x.id || x.ordem) === String(t.topicoId || t.id || t.topicoOrdem))?.titulo || 'Conteúdo'} (${t.duracaoAlocadaAulas || 1} tempo(s))`).join('; ') || 'Sem conteúdo';
  const revisar = () => {
    try {
      const dataValida = valor => /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor)) && new Date(`${valor}T12:00:00Z`).toISOString().slice(0, 10) === valor;
      if (!dataValida(dataInicio) || !dataValida(fim) || dataInicio > fim) throw new Error('Informe um período válido para a distribuição.');
      const opts = { dataInicio, dataFim: fim, modo, feriados };
      setPreview({ ...planejarDistribuicao(aulas, topicos, opts), opts });
      setErro('');
    } catch (err) { setErro(err.message || 'Não foi possível revisar a distribuição.'); }
  };
  const confirmar = async () => {
    if (!preview || ocupado) return;
    setOcupado(true); setErro('');
    try { await onConfirmar(preview.opts); onClose(); }
    catch (err) { setErro(err.message || 'Não foi possível salvar a distribuição.'); }
    finally { setOcupado(false); }
  };

  return <div role="dialog" aria-modal="true" aria-label="Distribuir conteúdos" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-[#101942] shadow-xl">
      <header className="flex items-center justify-between bg-[#101942] p-5 text-white"><h2 className="flex items-center gap-2 font-bold"><Sparkles size={20} /> Distribuir conteúdos</h2><button type="button" disabled={ocupado} aria-label="Fechar" onClick={onClose} className="rounded-lg p-2"><X size={18} /></button></header>
      <div className="space-y-5 overflow-y-auto p-5">
        <fieldset disabled={ocupado} className="space-y-4" onChange={invalidar}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Distribuir a partir de<input type="date" aria-label="Distribuir a partir de" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
            <label className="text-sm font-semibold">Até<input type="date" aria-label="Distribuir até" value={fim} onChange={e => setFim(e.target.value)} className="mt-1 block w-full rounded-lg border p-2" /></label>
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setDataInicio(hoje); invalidar(); }} className="rounded-lg border px-3 py-2 text-xs">A partir de hoje</button><button type="button" onClick={() => { setDataInicio(primeiraData); invalidar(); }} className="rounded-lg border px-3 py-2 text-xs">Primeira aula da turma</button></div>
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-bold">Como distribuir?</legend>
            <label className="flex items-start gap-2 rounded-lg border p-3"><input type="radio" name="modo-distribuir" value="apenas_vagas" checked={modo === 'apenas_vagas'} onChange={e => setModo(e.target.value)} /><span><span className="block text-sm font-semibold">Preencher aulas vazias</span><span className="text-xs text-slate-500">Mantém os conteúdos já agendados.</span></span></label>
            <label className="flex items-start gap-2 rounded-lg border p-3"><input type="radio" name="modo-distribuir" value="substituir" checked={modo === 'substituir'} onChange={e => setModo(e.target.value)} /><span><span className="block text-sm font-semibold">Reorganizar aulas futuras</span><span className="text-xs text-slate-500">Redistribui os conteúdos nas aulas agendadas do período escolhido.</span></span></label>
          </fieldset>
        </fieldset>
        <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">Preserva aulas anteriores à data escolhida, aulas concluídas e parciais. Dias sem aula permanecem bloqueados.</p>
        {preview && <section aria-label="Prévia da distribuição" className="space-y-3">
          <h3 className="font-bold">Prévia da distribuição</h3>
          <p className="text-sm">{preview.resumo.alteradas} aula(s) alterada(s) · {preview.resumo.preservadas} preservada(s) · {preview.pendentes.length} conteúdo(s) sem vaga.</p>
          {preview.pendentes.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-bold">Permanecerão pendentes</p><ul className="mt-1 list-inside list-disc">{preview.pendentes.map((t, i) => <li key={t.id || i}>{t.topicoTitulo || t.titulo}: {t.duracaoRestante || t.duracaoAlocadaAulas || 1} tempo(s) sem vaga</li>)}</ul></div>}
          <div className="space-y-2">{preview.aulas.filter(a => a.dataAgendada >= dataInicio && a.dataAgendada <= fim).map(a => {
            const anterior = aulas.find(x => x.id === a.id) || {};
            return <details key={a.id} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-semibold">{a.dataAgendada} · {a.horarioInicio || 'Sem horário'} · {rotulos(a)}</summary><p className="mt-2 text-slate-600">Antes: {rotulos(anterior)}</p><p className="mt-1">Depois: {rotulos(a)}</p><p className="mt-1 text-xs text-slate-500">Estado da aula: {a.status || 'AGENDADA'}</p></details>;
          })}</div>
        </section>}
        {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      </div>
      <footer className="flex justify-end gap-3 border-t p-4"><button type="button" disabled={ocupado} onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button><button type="button" disabled={ocupado || !topicos.length || (preview && !preview.resumo.alteradas)} onClick={preview ? confirmar : revisar} className="rounded-xl bg-[#f60c49] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{ocupado ? 'Salvando...' : preview ? 'Confirmar distribuição' : 'Revisar distribuição'}</button></footer>
    </div>
  </div>;
}
