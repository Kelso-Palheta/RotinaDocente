'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PrepararAulao } from './PrepararAulao';
import { RevisarQuestao } from './RevisarQuestao';
import { requisitarRevisao } from './integracaoTransporte';

const semConfirmacoes = () => ({ transcricao: false, gabarito: false, imagens: false, explicacoes: false });
const campo = 'mt-2 w-full rounded-xl border border-teal-700 bg-[#0c2423] p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-50';

export function IntegracaoPreparacao({ obterToken }) {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [selecao, setSelecao] = useState({ titulo: 'Aulão de Arte — ENEM', turmaIds: [], questaoIds: [], duracaoSegundos: 60 });
  const [revisao, setRevisao] = useState(null);
  const [confirmacoes, setConfirmacoes] = useState(semConfirmacoes);
  const sessao = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const atual = { ativa: true, controller, sequencia: 0, ocupado: false };
    sessao.current = atual;
    async function carregar() {
      try {
        const dados = await requisitarRevisao('/catalogo', { obterToken, signal: controller.signal });
        if (!atual.ativa) return;
        setCatalogo(dados); setErro(null);
      } catch (e) { if (atual.ativa) setErro(e.message); }
    }
    Promise.resolve().then(() => { if (atual.ativa) carregar(); });
    return () => { atual.ativa = false; controller.abort(); };
  }, [obterToken, tentativa]);

  async function abrirRevisao(id) {
    const atual = sessao.current;
    if (!atual?.ativa || atual.ocupado) return;
    const numero = ++atual.sequencia;
    atual.ocupado = true; setOcupado(true); setErro(null);
    try {
      const dados = await requisitarRevisao(`/questoes/${encodeURIComponent(id)}`, { obterToken, signal: atual.controller.signal });
      if (!atual.ativa || numero !== atual.sequencia) return;
      setRevisao(dados); setConfirmacoes(semConfirmacoes());
    } catch (e) { if (atual.ativa && numero === atual.sequencia) setErro(e.message); }
    finally { if (atual.ativa && numero === atual.sequencia) { atual.ocupado = false; setOcupado(false); } }
  }

  function editar(campoNome, valor) {
    if (ocupado) return;
    setRevisao(anterior => ({ ...anterior, questao: { ...anterior.questao, [campoNome]: valor } }));
    setConfirmacoes(semConfirmacoes()); setErro(null);
  }

  async function aprovar() {
    const atual = sessao.current;
    if (!atual?.ativa || atual.ocupado || !revisao || !Object.values(confirmacoes).every(v => v === true)) return;
    atual.ocupado = true; setOcupado(true); setErro(null);
    try {
      const q = revisao.questao;
      await requisitarRevisao(`/questoes/${encodeURIComponent(q.id)}/aprovar`, {
        obterToken, signal: atual.controller.signal, body: {
          hashFonte: revisao.hashFonte, confirmacoes,
          ajustes: { enunciado: q.enunciado, alternativas: q.alternativas, explicacoes: q.explicacoes, conteudoRevisao: q.conteudoRevisao },
        },
      });
      if (!atual.ativa) return;
      const dados = await requisitarRevisao('/catalogo', { obterToken, signal: atual.controller.signal });
      if (!atual.ativa) return;
      setCatalogo(dados); setRevisao(null); setConfirmacoes(semConfirmacoes());
    } catch (e) { if (atual.ativa) setErro(e.message); }
    finally { if (atual.ativa) { atual.ocupado = false; setOcupado(false); } }
  }

  async function criar(valor) {
    const atual = sessao.current;
    if (!atual?.ativa || atual.ocupado) return;
    atual.ocupado = true; setOcupado(true); setErro(null);
    try {
      const dados = await requisitarRevisao('/salas', { obterToken, signal: atual.controller.signal, body: { selecao: valor } });
      if (atual.ativa) router.push(`/revisao/sala/${encodeURIComponent(dados.sala.codigo)}`);
    } catch (e) { if (atual.ativa) setErro(e.message); }
    finally { if (atual.ativa) { atual.ocupado = false; setOcupado(false); } }
  }

  if (revisao) {
    const q = revisao.questao;
    return <main className="min-h-screen bg-[#081a19] text-white pb-8">
      <div className="mx-auto max-w-5xl p-4 md:px-8 space-y-4">
        <button type="button" className="rounded-xl border border-teal-600 px-4 py-2 disabled:opacity-50" disabled={ocupado} onClick={() => { setRevisao(null); setConfirmacoes(semConfirmacoes()); setErro(null); }}>← Voltar à preparação</button>
        <details className="rounded-2xl border border-teal-700 p-4" open>
          <summary className="cursor-pointer font-bold text-teal-200">Corrigir textos antes da conferência</summary>
          <p className="mt-2 text-sm text-slate-300">Cada alteração reinicia as quatro confirmações. Identidade, imagens, fontes e gabarito oficial são preservados.</p>
          <label className="block mt-4">Editar enunciado<textarea className={campo} rows={5} value={q.enunciado || ''} disabled={ocupado} onChange={e => editar('enunciado', e.target.value)} /></label>
          {(q.alternativas || []).map((a, i) => <label key={a.id} className="block mt-4">Editar alternativa {a.id}<textarea className={campo} rows={2} value={a.texto} disabled={ocupado} onChange={e => editar('alternativas', q.alternativas.map((item, idx) => idx === i ? { ...item, texto: e.target.value } : item))} /></label>)}
          {['A', 'B', 'C', 'D', 'E'].map(letra => <label key={letra} className="block mt-4">Editar explicação {letra}<textarea className={campo} rows={3} value={q.explicacoes?.[letra] || ''} disabled={ocupado} onChange={e => editar('explicacoes', { ...q.explicacoes, [letra]: e.target.value })} /></label>)}
          {(q.conteudoRevisao || []).map((bloco, i) => bloco.tipo === 'texto' ? <label key={i} className="block mt-4">Editar conteúdo preparatório {i + 1}<textarea className={campo} rows={3} value={bloco.texto} disabled={ocupado} onChange={e => editar('conteudoRevisao', q.conteudoRevisao.map((item, idx) => idx === i ? { ...item, texto: e.target.value } : item))} /></label> : null)}
          <button type="button" className="mt-4 rounded-lg border border-teal-600 px-3 py-2" disabled={ocupado} onClick={() => editar('conteudoRevisao', [...(q.conteudoRevisao || []), { tipo: 'texto', texto: '' }])}>Adicionar conteúdo preparatório</button>
        </details>
      </div>
      <RevisarQuestao questao={q} confirmacoes={confirmacoes} ocupado={ocupado} erro={erro} onConfirmacoesChange={setConfirmacoes} onAprovar={aprovar} />
    </main>;
  }
  return <main className="min-h-screen bg-[#081a19] text-white">
    <div className="mx-auto max-w-7xl p-4 md:px-8 pt-6 space-y-4">
      <Link href="/" className="inline-block rounded-xl border border-teal-700 px-4 py-2">← Voltar ao Hub</Link>
      <section className="rounded-3xl bg-gradient-to-br from-[#5b21b6] to-[#701a75] p-5 md:p-7 border border-[#a78bfa]/50 space-y-2">
        <h1 className="font-black text-2xl">Revisão ao Vivo</h1>
        <p>Prepare o conteúdo → confira as questões → abra a sala → projete e convide os alunos pelo Portal.</p>
        <p className="text-sm text-[#ede9fe]">1.000 pontos por acerto, sem bônus de velocidade. Não altera notas. Piloto com até 100 alunos elegíveis por sala; capacidade de rede escolar ainda depende de ensaio.</p>
        <p className="text-sm text-[#ede9fe]">Acervo parcial. As questões em rascunho precisam da sua conferência antes de entrar no aulão.</p>
      </section>
      {catalogo && !catalogo.turmas?.length && <p role="status" className="rounded-xl border border-amber-600 p-3 text-amber-200">Cadastre uma turma no Diário Pedagógico para criar sua primeira sala.</p>}
      {catalogo && !catalogo.questoes?.some(q => q.apta === true) && <p role="status" className="rounded-xl border border-amber-600 p-3 text-amber-200">Comece por “Inspecionar” uma questão do catálogo e confirme os quatro itens da revisão docente.</p>}
      {Boolean(catalogo?.salas?.length) && <section className="rounded-2xl border border-teal-800 p-4"><h2 className="font-bold mb-3">Retomar uma sala</h2><ul className="max-h-64 overflow-y-auto space-y-2">{catalogo.salas.map(s => <li key={s.id}><Link href={`/revisao/sala/${encodeURIComponent(s.codigo)}`} className="block rounded-lg bg-teal-900/50 p-3 hover:bg-teal-800">{s.titulo} · {s.codigo} · {s.fase}</Link></li>)}</ul></section>}
      {!catalogo && <p role={erro ? 'alert' : 'status'}>{erro || 'Carregando seu acervo e suas turmas…'}</p>}
      {erro && <button type="button" className="rounded-lg border border-teal-600 px-3 py-2" onClick={() => { setErro(null); setTentativa(n => n + 1); }}>Recarregar acervo</button>}
    </div>
    {catalogo && <PrepararAulao {...catalogo} selecao={selecao} ocupado={ocupado} erro={erro} onAlterar={setSelecao} onAbrirRevisao={abrirRevisao} onCriar={criar} />}
  </main>;
}
