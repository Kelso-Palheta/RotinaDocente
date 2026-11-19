'use client';
import React, { useEffect, useRef, useState } from 'react';
import { requisitarLivre } from './api';

export function PublicacaoRevisao({ questao, turmas = [], obterToken, onAtualizar }) {
  const [selecionadas, setSelecionadas] = useState(questao.turmaIdsRevisaoAutonoma || []);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const ativo = useRef(true);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);
  if (questao.status !== 'revisada' || questao.tipo !== 'multipla_escolha') return null;
  const salvar = async () => {
    if (ocupado) return;
    setOcupado(true); setMensagem('');
    try {
      const data = await requisitarLivre('publicar', { obterToken, body: { questaoId: questao.id, expectedRevision: questao.revision, turmaIds: selecionadas } });
      if (ativo.current) { onAtualizar?.(data.questao); setMensagem(selecionadas.length ? 'Disponível para revisão autônoma nas turmas escolhidas.' : 'Liberação retirada.'); }
    } catch (e) { if (ativo.current) setMensagem(e.message); }
    finally { if (ativo.current) setOcupado(false); }
  };
  return <details className="rounded-xl border border-cyan-300 bg-cyan-50 p-3 text-[#25104A]">
    <summary className="cursor-pointer font-bold">Revisar sozinho · liberar para turmas</summary>
    <p className="my-2 text-sm">A questão poderá ser praticada em casa, com gabarito após responder. Não altera notas.</p>
    <div className="flex flex-wrap gap-3">{turmas.filter(t => !t.arquivada).map(t => <label key={t.id} className="inline-flex gap-2 items-center rounded-lg bg-white p-2"><input type="checkbox" checked={selecionadas.includes(String(t.id))} disabled={ocupado} onChange={e => setSelecionadas(s => e.target.checked ? [...s, String(t.id)] : s.filter(id => id !== String(t.id)))} />{t.nome}</label>)}</div>
    {!turmas.length && <p className="text-sm">Cadastre uma turma para liberar a revisão.</p>}
    <button type="button" disabled={ocupado || !turmas.length} onClick={salvar} className="mt-3 min-h-11 rounded-xl bg-[#6315D9] px-4 py-2 font-bold text-white disabled:opacity-40">{ocupado ? 'Salvando...' : 'Salvar liberação'}</button>
    {mensagem && <p role="status" className="mt-2 text-sm font-bold">{mensagem}</p>}
  </details>;
}
