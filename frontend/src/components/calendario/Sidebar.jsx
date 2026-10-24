'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Upload, Sparkles, Edit2, Trash2, Search, Clock } from 'lucide-react';
import { estadoConteudos } from '@/dominio/calendario/evolucao';

/** Biblioteca completa: vínculos no calendário nunca ocultam o conteúdo. */
export function Sidebar({
  planejamento, aulas = [], onOpenNovoTopico, onOpenEditarTopico, onExcluirTopico,
  onOpenImport, onOpenAutoDistribuir, onClearPlanejamento, onCopiarPlanejamento,
  turmas = [], turmaSelecionada,
}) {
  const [categoria, setCategoria] = useState('todos');
  const [busca, setBusca] = useState('');
  const topicos = estadoConteudos(planejamento?.topicos || [], aulas);
  const contagem = topicos.reduce((acc, t) => ({ ...acc, [t.estado]: acc[t.estado] + 1 }), { pendente: 0, agendado: 0, concluido: 0 });
  const percentual = topicos.length ? Math.round(contagem.concluido / topicos.length * 100) : 0;
  const normalizar = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const visiveis = topicos.filter(t => (categoria === 'todos' || t.estado === categoria) && normalizar(`${t.titulo || ''} ${t.descricao || ''} ${t.ordem || ''}`).includes(normalizar(busca)));
  const categorias = [['todos', 'Todos', topicos.length], ['pendente', 'Pendentes', contagem.pendente], ['agendado', 'Agendados', contagem.agendado], ['concluido', 'Concluídos', contagem.concluido]];
  const cores = { pendente: 'bg-slate-100 text-slate-700', agendado: 'bg-blue-50 text-blue-700', concluido: 'bg-emerald-50 text-emerald-700' };
  const status = { pendente: 'Pendente', agendado: 'Agendado', concluido: 'Concluído' };
  const outrasTurmas = turmas.filter(t => t.id !== turmaSelecionada?.id);
  const acao = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce0f0] px-4 py-2.5 text-sm font-semibold disabled:opacity-40';

  return <section aria-label="Biblioteca de conteúdos" className="w-full min-w-0 rounded-2xl border border-[#dce0f0] bg-white p-4 sm:p-6 text-[#101942]">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen size={20} /> Conteúdos</h2>
        <p className="mt-1 text-sm text-[#6070a0]">Cadastre, revise e acompanhe os conteúdos desta turma.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onOpenNovoTopico} className={`${acao} bg-[#101942] text-white`}><Plus size={16} /> Novo conteúdo</button>
        <button type="button" onClick={onOpenImport} className={acao}><Upload size={16} /> Importar conteúdos</button>
        <button type="button" disabled={!topicos.length} onClick={onOpenAutoDistribuir} className={`${acao} text-blue-700`}><Sparkles size={16} /> Distribuir com prévia</button>
      </div>
    </div>

    <div className="my-5 rounded-xl border border-[#dce0f0] bg-[#f7f8fc] p-4">
      <p className="text-sm font-semibold">{contagem.concluido} de {topicos.length} conteúdos concluídos ({percentual}%)</p>
      <div role="progressbar" aria-label="Progresso dos conteúdos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentual} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div style={{ width: `${percentual}%` }} className="h-full bg-emerald-500" /></div>
      <p className="mt-2 text-xs text-[#6070a0]">{aulas.length} aula(s) no calendário. Cada conteúdo conta uma vez no progresso.</p>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Estado dos conteúdos" className="flex flex-wrap gap-2">
        {categorias.map(([valor, rotulo, quantidade]) => <button key={valor} type="button" role="tab" aria-selected={categoria === valor} aria-controls="lista-conteudos" onClick={() => setCategoria(valor)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${categoria === valor ? 'bg-[#101942] text-white' : 'bg-[#f7f8fc] text-[#6070a0]'}`}>{rotulo} ({quantidade})</button>)}
      </div>
      <label className="flex min-w-0 items-center gap-2 rounded-xl border border-[#dce0f0] px-3 py-2"><Search size={16} className="shrink-0 text-[#6070a0]" /><input type="search" aria-label="Buscar conteúdo" placeholder="Buscar conteúdo..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full min-w-0 text-sm outline-none" /></label>
    </div>

    <div id="lista-conteudos" role="tabpanel" className="mt-4">
      {!visiveis.length ? <p className="rounded-xl border border-dashed border-[#dce0f0] p-8 text-center text-sm text-[#6070a0]">{topicos.length ? 'Nenhum conteúdo corresponde ao filtro.' : 'Nenhum conteúdo cadastrado. Crie um conteúdo ou importe seu planejamento.'}</p> :
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visiveis.map((topico, index) => <li key={topico.id || topico.ordem || index} draggable={topico.estado === 'pendente'} onDragStart={e => e.dataTransfer.setData('application/json', JSON.stringify(topico))} className="min-w-0 rounded-xl border border-[#dce0f0] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
              <span className="text-[#f60c49]">Conteúdo {topico.ordem ?? index + 1}</span>
              <span className={`rounded-lg px-2 py-1 ${cores[topico.estado]}`}>{status[topico.estado]}</span>
            </div>
            <h3 className="mt-2 break-words font-semibold">{topico.titulo}</h3>
            {topico.descricao && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#6070a0]">{topico.descricao}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-1 text-xs text-[#6070a0]"><Clock size={13} /> {topico.duracaoEstimadaAulas || 1} tempo(s) estimado(s)</span>
              <div className="flex gap-2">
                <button type="button" aria-label={`Editar ${topico.titulo}`} onClick={() => onOpenEditarTopico?.(topico)} className="inline-flex items-center gap-1 rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-700"><Edit2 size={14} /> Editar</button>
                <button type="button" aria-label={`Excluir ${topico.titulo}`} onClick={() => onExcluirTopico?.(topico.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-700"><Trash2 size={14} /> Excluir</button>
              </div>
            </div>
          </li>)}
        </ul>}
    </div>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#dce0f0] pt-4">
      {outrasTurmas.length > 0 && onCopiarPlanejamento && <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">Copiar conteúdos de outra turma
        <select aria-label="Turma para copiar conteúdos" value="" onChange={e => e.target.value && onCopiarPlanejamento(e.target.value)} className="rounded-lg border border-[#dce0f0] p-2"><option value="">Selecione a turma...</option>{outrasTurmas.map(t => <option key={t.id} value={t.id}>{t.nome || t.name}</option>)}</select>
      </label>}
      {Boolean(topicos.length) && onClearPlanejamento && <button type="button" onClick={onClearPlanejamento} className="rounded-lg border border-rose-100 px-3 py-2 text-sm font-semibold text-rose-700">Remover conteúdos do planejamento</button>}
    </div>
  </section>;
}

export const BibliotecaConteudos = Sidebar;
