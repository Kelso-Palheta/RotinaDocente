'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EstadoVazio } from '@/components/ui/EstadoVazio';
import { BarraAcoes } from '@/components/ui/BarraAcoes';
import { FormularioQuestao } from './FormularioQuestao';
import { RenderTextoSeguro } from './RenderTextoSeguro';
import { gerarRequestId, revisarQuestao, salvarQuestao } from './api';
import {
  DIFICULDADES,
  TIPOS_QUESTAO,
  classeDificuldade,
  resolverRequestIdOperacao,
  rotuloDificuldade,
  rotuloTipoQuestao,
  textoCarta,
} from './constantes';

export function BancoQuestoes({
  questoes = [],
  obterToken,
  tipoInicialCriar = null,
  onQuestaoAtualizada,
  onLimparTipoInicial,
}) {
  const [filtros, setFiltros] = useState({
    busca: '',
    disciplina: '',
    anoEscolar: '',
    dificuldade: '',
    tipo: '',
    status: '',
  });
  const [editando, setEditando] = useState(() => (tipoInicialCriar ? { __novo: true, tipo: tipoInicialCriar } : null));
  const [salvando, setSalvando] = useState(false);
  const [revisandoId, setRevisandoId] = useState(null);
  const [erroEditor, setErroEditor] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);
  const [avisoSucesso, setAvisoSucesso] = useState(null);

  const montadoRef = useRef(true);
  const operacaoSalvarRef = useRef(null);
  const operacaoRevisarRef = useRef(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const disciplinasUnicas = useMemo(
    () => Array.from(new Set(questoes.map((q) => q.disciplina).filter(Boolean))).sort(),
    [questoes]
  );
  const anosUnicos = useMemo(
    () => Array.from(new Set(questoes.map((q) => q.anoEscolar).filter(Boolean))).sort(),
    [questoes]
  );

  const questoesFiltradas = useMemo(() => {
    const termo = filtros.busca.trim().toLowerCase();
    return questoes.filter((q) => {
      if (filtros.disciplina && q.disciplina !== filtros.disciplina) return false;
      if (filtros.anoEscolar && q.anoEscolar !== filtros.anoEscolar) return false;
      if (filtros.dificuldade && q.dificuldade !== filtros.dificuldade) return false;
      if (filtros.tipo && q.tipo !== filtros.tipo) return false;
      if (filtros.status && q.status !== filtros.status) return false;
      if (termo) {
        const alvo = `${q.disciplina || ''} ${q.anoEscolar || ''} ${q.conteudo || ''} ${q.enunciado || ''}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [questoes, filtros]);

  const handleSalvar = async (dadosQuestao, expectedRevision) => {
    const revisaoEsperada = dadosQuestao.id ? expectedRevision : undefined;
    const assinatura = JSON.stringify({ expectedRevision: revisaoEsperada ?? null, questao: dadosQuestao });
    const requestId = resolverRequestIdOperacao(operacaoSalvarRef, assinatura, () => gerarRequestId('salvar_q'));

    setSalvando(true);
    setErroEditor(null);
    setAvisoSucesso(null);
    try {
      const res = await salvarQuestao({
        questao: dadosQuestao,
        expectedRevision: revisaoEsperada,
        requestId,
        obterToken,
      });
      if (!montadoRef.current) return;
      operacaoSalvarRef.current = null;
      if (res?.questao) {
        onQuestaoAtualizada?.(res.questao);
      }
      setEditando(null);
      onLimparTipoInicial?.();
      setAvisoSucesso(
        dadosQuestao.id
          ? 'Questão atualizada em rascunho. Revise e aprove antes de usá-la em sala.'
          : 'Questão criada em rascunho. Revise e aprove para liberar em sala.'
      );
    } catch (err) {
      if (!montadoRef.current) return;
      // Preserva o formulário aberto, o rascunho digitado e o requestId da operação pendente.
      setErroEditor(err?.message || 'Não foi possível salvar a questão. Seu rascunho foi preservado.');
    } finally {
      if (montadoRef.current) setSalvando(false);
    }
  };

  const handleRevisar = async (questao) => {
    const assinatura = JSON.stringify({ id: questao.id, expectedRevision: questao.revision });
    const requestId = resolverRequestIdOperacao(operacaoRevisarRef, assinatura, () => gerarRequestId(`rev_${questao.id}`));

    setRevisandoId(questao.id);
    setErroAcao(null);
    setAvisoSucesso(null);
    try {
      const res = await revisarQuestao({
        id: questao.id,
        expectedRevision: questao.revision,
        requestId,
        obterToken,
      });
      if (!montadoRef.current) return;
      operacaoRevisarRef.current = null;
      if (res?.questao) {
        onQuestaoAtualizada?.(res.questao);
      }
      setAvisoSucesso('Aprovação concluída e liberada para uso em salas ao vivo.');
    } catch (err) {
      if (!montadoRef.current) return;
      setErroAcao(err?.message || 'Não foi possível aprovar a revisão desta questão.');
    } finally {
      if (montadoRef.current) setRevisandoId(null);
    }
  };

  return (
    <section aria-labelledby="titulo-banco-questoes" className="space-y-5">
      <BarraAcoes>
        <div>
          <h2 id="titulo-banco-questoes" className="font-head text-xl font-black text-[#25104A]">
            Banco privado de questões ({questoesFiltradas.length} de {questoes.length})
          </h2>
          <p className="text-xs text-[#5B4B86]">
            Somente itens com revisão docente aprovada entram em sala; editar conteúdo ou gabarito retorna para rascunho.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErroEditor(null);
            setEditando({ __novo: true, tipo: 'multipla_escolha' });
          }}
          className="min-h-11 rounded-xl bg-[#6315D9] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#5411B8]"
        >
          + Nova questão manual
        </button>
      </BarraAcoes>

      {avisoSucesso && (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {avisoSucesso}
        </p>
      )}
      {erroAcao && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          {erroAcao}
        </p>
      )}

      {editando && (
        <FormularioQuestao
          key={editando.id || `novo-${editando.tipo || 'mc'}`}
          questaoInicial={editando.__novo ? null : editando}
          tipoPadrao={editando.tipo || 'multipla_escolha'}
          salvando={salvando}
          erroExterno={erroEditor}
          onSalvar={handleSalvar}
          onCancelar={() => {
            setEditando(null);
            setErroEditor(null);
            onLimparTipoInicial?.();
          }}
        />
      )}

      {/* Filtros semânticos com landmark role="search" */}
      <div role="search" aria-label="Filtros do banco de questões" className="rounded-2xl border border-[#E2D9F7] bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label htmlFor="filtro-busca-q" className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Pesquisar no banco
            </label>
            <input
              id="filtro-busca-q"
              type="search"
              value={filtros.busca}
              onChange={(e) => setFiltros((p) => ({ ...p, busca: e.target.value }))}
              placeholder="Ex.: Citologia, frações, modernismo..."
              className="min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-sm text-[#25104A]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filtro-disciplina-q" className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Filtrar por disciplina
            </label>
            <select
              id="filtro-disciplina-q"
              value={filtros.disciplina}
              onChange={(e) => setFiltros((p) => ({ ...p, disciplina: e.target.value }))}
              className="min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-sm text-[#25104A]"
            >
              <option value="">Todas</option>
              {disciplinasUnicas.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filtro-ano-q" className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Filtrar por série/ano
            </label>
            <select
              id="filtro-ano-q"
              value={filtros.anoEscolar}
              onChange={(e) => setFiltros((p) => ({ ...p, anoEscolar: e.target.value }))}
              className="min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-sm text-[#25104A]"
            >
              <option value="">Todos</option>
              {anosUnicos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filtro-dificuldade-q" className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Filtrar por dificuldade
            </label>
            <select
              id="filtro-dificuldade-q"
              value={filtros.dificuldade}
              onChange={(e) => setFiltros((p) => ({ ...p, dificuldade: e.target.value }))}
              className="min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-sm text-[#25104A]"
            >
              <option value="">Todas</option>
              {DIFICULDADES.map((d) => <option key={d.id} value={d.id}>{d.rotulo}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filtro-status-q" className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Status e tipo
            </label>
            <div className="flex gap-1.5">
              <select
                id="filtro-status-q"
                aria-label="Filtrar por status"
                value={filtros.status}
                onChange={(e) => setFiltros((p) => ({ ...p, status: e.target.value }))}
                className="w-1/2 min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-2 py-2 text-xs text-[#25104A]"
              >
                <option value="">Status</option>
                <option value="revisada">Aprovadas</option>
                <option value="rascunho">Rascunhos</option>
              </select>
              <select
                aria-label="Filtrar por tipo"
                value={filtros.tipo}
                onChange={(e) => setFiltros((p) => ({ ...p, tipo: e.target.value }))}
                className="w-1/2 min-h-11 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-2 py-2 text-xs text-[#25104A]"
              >
                <option value="">Tipo</option>
                {Object.values(TIPOS_QUESTAO).map((t) => (
                  <option key={t.id} value={t.id}>{t.rotulo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {questoes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma questão cadastrada ainda"
          descricao="Crie sua primeira questão manualmente ou use o gerador por tema ou material anexado na aba Gerar com IA."
          textoAcao="Criar primeira questão"
          onAcao={() => setEditando({ __novo: true, tipo: 'multipla_escolha' })}
          icone="📚"
          badge="Banco vazio"
        />
      ) : questoesFiltradas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma questão corresponde aos filtros"
          descricao="Limpe ou ajuste os filtros de disciplina, série, dificuldade, tipo ou status para visualizar outras questões."
          textoAcao="Limpar filtros"
          onAcao={() => setFiltros({ busca: '', disciplina: '', anoEscolar: '', dificuldade: '', tipo: '', status: '' })}
          icone="🔎"
        />
      ) : (
        <ul className="space-y-4">
          {questoesFiltradas.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#F3EDFF] border border-[#E2D9F7] px-2.5 py-0.5 text-xs font-extrabold text-[#25104A]">
                    {q.disciplina}
                  </span>
                  <span className="rounded-lg bg-[#FFFDF7] border border-[#E2D9F7] px-2.5 py-0.5 text-xs font-bold text-[#5B4B86]">
                    {q.anoEscolar} · {q.conteudo}
                  </span>
                  <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${classeDificuldade(q.dificuldade)}`}>
                    {rotuloDificuldade(q.dificuldade)}
                  </span>
                  <span className="rounded-lg bg-[#E7DBFD] px-2.5 py-0.5 text-xs font-bold text-[#25104A]">
                    {rotuloTipoQuestao(q.tipo)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                      q.status === 'revisada'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {q.status === 'revisada' ? 'Revisada' : 'Rascunho'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErroEditor(null);
                      setEditando(q);
                    }}
                    className="min-h-10 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-1.5 text-xs font-bold text-[#25104A] hover:bg-[#F3EDFF]"
                  >
                    Editar
                  </button>
                  {q.status !== 'revisada' && (
                    <button
                      type="button"
                      disabled={revisandoId === q.id}
                      onClick={() => handleRevisar(q)}
                      className="min-h-10 rounded-xl bg-[#6315D9] px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-[#5411B8] disabled:opacity-50"
                    >
                      {revisandoId === q.id ? 'Aprovando...' : 'Aprovar revisão'}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-base font-bold text-[#25104A]">
                <RenderTextoSeguro texto={q.enunciado} />
              </div>

              {q.tipo === 'multipla_escolha' && Array.isArray(q.alternativas) && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {q.alternativas.map((alt) => {
                    const correta = q.respostaCorreta === alt.id;
                    return (
                      <li
                        key={alt.id}
                        className={`rounded-xl border px-3 py-2 ${
                          correta
                            ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-950'
                            : 'border-[#E2D9F7] bg-[#FFFDF7] text-[#25104A]'
                        }`}
                      >
                        <RenderTextoSeguro texto={alt.texto} />
                        {correta && <span className="ml-2 text-xs font-black text-emerald-800">(Gabarito)</span>}
                      </li>
                    );
                  })}
                </ul>
              )}

              {q.tipo === 'resposta_aberta' && <div className="rounded-xl bg-[#F3EDFF] p-3 text-[#25104A]"><strong>Resposta-modelo</strong><RenderTextoSeguro texto={q.respostaCorreta} /></div>}
              {q.tipo === 'pares' && Array.isArray(q.pares) && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {q.pares.map((par) => (
                    <li key={par.id} className="rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-[#25104A]">
                      <strong><RenderTextoSeguro texto={textoCarta(par.esquerda)} /></strong>
                      <span className="mx-2 text-[#6315D9]">↔</span>
                      <RenderTextoSeguro texto={textoCarta(par.direita)} />
                    </li>
                  ))}
                </ul>
              )}

              {q.tipo === 'ordenacao' && Array.isArray(q.itens) && (
                <ol className="space-y-1.5 text-sm">
                  {q.itens.map((it, idx) => (
                    <li key={it.id} className="rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-1.5 text-[#25104A]">
                      <span className="font-black text-[#6315D9] mr-2">{idx + 1}º</span>
                      <RenderTextoSeguro texto={it.texto} />
                    </li>
                  ))}
                </ol>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E2D9F7] text-xs text-[#5B4B86]">
                <div>
                  <strong className="text-[#25104A]">Explicação pedagógica: </strong>
                  <RenderTextoSeguro texto={q.explicacao} />
                </div>
                <div>
                  <strong className="text-[#25104A]">Justificativa da dificuldade: </strong>
                  <RenderTextoSeguro texto={q.justificativaDificuldade} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
