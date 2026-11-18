'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { EstadoVazio } from '@/components/ui/EstadoVazio';
import { RenderTextoSeguro } from './RenderTextoSeguro';
import { criarSala, gerarRequestId } from './api';
import {
  FASES_ROTULO,
  MODALIDADES_PADRAO,
  classeDificuldade,
  mesclarModalidades,
  obterModalidadeInfo,
  questaoCompativelComModalidade,
  resolverRequestIdOperacao,
  rotuloDificuldade,
  rotuloTipoQuestao,
} from './constantes';

export function PrepararSala({
  modalidadesServidor = null,
  turmas = [],
  questoes = [],
  salas = [],
  modalidadeInicial = 'quiz',
  obterToken,
  onSalaCriada,
}) {
  const formId = useId();
  const modalidades = useMemo(() => mesclarModalidades(modalidadesServidor), [modalidadesServidor]);

  const [titulo, setTitulo] = useState('');
  const [modalidade, setModalidade] = useState(modalidadeInicial || MODALIDADES_PADRAO[0].id);
  const [turmaIds, setTurmaIds] = useState([]);
  const [questaoIds, setQuestaoIds] = useState([]);
  const [tempoSegundos, setTempoSegundos] = useState(60);
  const [equipes, setEquipes] = useState([]);
  const [nomeNovaEquipe, setNomeNovaEquipe] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState(null);
  const [avisoIncompatibilidade, setAvisoIncompatibilidade] = useState(null);
  const [salaRecemCriada, setSalaRecemCriada] = useState(null);

  const montadoRef = useRef(true);
  const operacaoSalaRef = useRef(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const infoModalidade = obterModalidadeInfo(modalidade, modalidadesServidor);

  // Preserva turma de cada aluno e usa o participanteId estável entregue pelo servidor (alunos[].id),
  // nunca deduplicando alunos de turmas distintas por alunoId local sozinho.
  const alunosDasTurmasSelecionadas = useMemo(() => {
    const lista = [];
    const vistos = new Set();
    for (const turma of turmas) {
      if (!turmaIds.includes(turma.id)) continue;
      for (const aluno of turma.alunos || []) {
        const participanteId = String(aluno.id ?? '');
        if (!participanteId) continue;
        const chaveComposta = `${turma.id}::${participanteId}`;
        if (vistos.has(chaveComposta)) continue;
        vistos.add(chaveComposta);
        lista.push({
          chave: chaveComposta,
          participanteId,
          alunoId: aluno.alunoId ? String(aluno.alunoId) : participanteId,
          nome: aluno.nome || participanteId,
          turmaId: String(turma.id),
          turmaNome: turma.nome || turma.titulo || String(turma.id),
        });
      }
    }
    return lista;
  }, [turmas, turmaIds]);

  const distribuirEquipesTabuleiro = (alunos = alunosDasTurmasSelecionadas) => {
    const azul = { id: 'eq_azul', nome: 'Equipe Azul', cor: 'azul', participanteIds: [] };
    const verde = { id: 'eq_verde', nome: 'Equipe Verde', cor: 'verde', participanteIds: [] };
    alunos.forEach((al, idx) => {
      (idx % 2 === 0 ? azul : verde).participanteIds.push(al.participanteId);
    });
    return [azul, verde];
  };

  const equipesEfetivas = useMemo(() => {
    if (modalidade !== 'tabuleiro') return equipes;
    if (equipes.length >= 2) {
      const totalComAluno = equipes.reduce((s, e) => s + e.participanteIds.length, 0);
      if (totalComAluno > 0 || alunosDasTurmasSelecionadas.length === 0) return equipes;
    }
    return distribuirEquipesTabuleiro(alunosDasTurmasSelecionadas);
  }, [modalidade, equipes, alunosDasTurmasSelecionadas]);

  const trocarModalidade = (novaModalidade) => {
    setModalidade(novaModalidade);
    setAvisoIncompatibilidade(null);
    // Remove automaticamente questões incompatíveis já marcadas.
    setQuestaoIds((prev) =>
      prev.filter((id) => {
        const q = questoes.find((item) => item.id === id);
        return q && q.status === 'revisada' && questaoCompativelComModalidade(q, novaModalidade, modalidadesServidor);
      })
    );
  };

  const alternarTurma = (id) => {
    setTurmaIds((prev) => {
      const proximas = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      // Remove das equipes participantes pertencentes a uma turma recém-desmarcada.
      const permitidos = new Set();
      for (const turma of turmas) {
        if (!proximas.includes(turma.id)) continue;
        for (const al of turma.alunos || []) {
          if (al.id) permitidos.add(String(al.id));
        }
      }
      setEquipes((eqs) => {
        const filtradas = eqs.map((eq) => ({
          ...eq,
          participanteIds: eq.participanteIds.filter((pid) => permitidos.has(String(pid))),
        }));
        if (modalidade !== 'tabuleiro' || filtradas.length === 0) return filtradas;
        const jaAlocados = new Set(filtradas.flatMap((eq) => eq.participanteIds.map(String)));
        const novos = [...permitidos].filter((pid) => !jaAlocados.has(pid));
        if (novos.length === 0) return filtradas;
        const atualizadas = filtradas.map((eq) => ({ ...eq, participanteIds: [...eq.participanteIds] }));
        novos.forEach((pid, idx) => {
          atualizadas[idx % atualizadas.length].participanteIds.push(pid);
        });
        return atualizadas;
      });
      return proximas;
    });
  };

  const alternarQuestao = (questao) => {
    setAvisoIncompatibilidade(null);
    if (questao.status !== 'revisada') {
      setAvisoIncompatibilidade(
        'Esta questão está em rascunho. Aprove a revisão docente no Banco de Questões antes de incluí-la na sala.'
      );
      return;
    }
    if (!questaoCompativelComModalidade(questao, modalidade, modalidadesServidor)) {
      setAvisoIncompatibilidade(
        `Tipo incompatível: ${infoModalidade.nome} aceita apenas questões de ${infoModalidade.tiposQuestoes.map(rotuloTipoQuestao).join(', ')}.`
      );
      return;
    }
    setQuestaoIds((prev) =>
      prev.includes(questao.id) ? prev.filter((id) => id !== questao.id) : [...prev, questao.id]
    );
  };

  const adicionarEquipe = () => {
    const limpo = nomeNovaEquipe.trim();
    if (!limpo) return;
    if (modalidade === 'tabuleiro' && equipesEfetivas.length >= 4) {
      setErro('O Tabuleiro aceita no máximo quatro equipes.');
      return;
    }
    const base = equipes.length ? equipes : equipesEfetivas;
    setEquipes([
      ...base,
      { id: `eq_${Date.now().toString(36)}_${base.length + 1}`, nome: limpo, participanteIds: [] },
    ]);
    setNomeNovaEquipe('');
  };

  const alternarParticipanteEquipe = (equipeId, alunoId) => {
    setEquipes((prev) => {
      const base = prev.length ? prev : equipesEfetivas;
      return base.map((eq) => {
        if (eq.id === equipeId) {
          const existe = eq.participanteIds.includes(alunoId);
          return {
            ...eq,
            participanteIds: existe
              ? eq.participanteIds.filter((p) => p !== alunoId)
              : [...eq.participanteIds, alunoId],
          };
        }
        // Garante que um aluno pertença a no máximo uma equipe.
        return {
          ...eq,
          participanteIds: eq.participanteIds.filter((p) => p !== alunoId),
        };
      });
    });
  };

  const handleCriarSala = async (e) => {
    e.preventDefault();
    setErro(null);
    setAvisoIncompatibilidade(null);

    if (!titulo.trim()) {
      setErro('Informe um título para a sala.');
      return;
    }
    if (turmaIds.length === 0) {
      setErro('Selecione pelo menos uma turma autorizada para participar.');
      return;
    }
    if (questaoIds.length === 0) {
      setErro('Selecione pelo menos uma questão revisada e compatível com a modalidade.');
      return;
    }
    if ((modalidade === 'equipes' || modalidade === 'tabuleiro') && equipesEfetivas.length < 2) {
      setErro('Cadastre pelo menos duas equipes para este modo.');
      return;
    }
    if (modalidade === 'tabuleiro' && equipesEfetivas.length > 4) {
      setErro('O Tabuleiro aceita no máximo quatro equipes.');
      return;
    }

    const tempoValido = Math.max(15, Math.min(600, Number(tempoSegundos) || 60));

    const configuracao = {
      titulo: titulo.trim(),
      modalidade,
      turmaIds,
      questaoIds,
      tempoSegundos: tempoValido,
      ...(modalidade === 'equipes' || modalidade === 'tabuleiro' ? { equipes: equipesEfetivas } : {}),
    };

    const assinatura = JSON.stringify(configuracao);
    const requestId = resolverRequestIdOperacao(operacaoSalaRef, assinatura, () => gerarRequestId('criar_sala'));

    setCriando(true);
    try {
      const res = await criarSala({
        configuracao,
        requestId,
        obterToken,
      });
      if (!montadoRef.current) return;
      operacaoSalaRef.current = null;
      const salaCriada = res?.sala;
      if (salaCriada) {
        setSalaRecemCriada(salaCriada);
        onSalaCriada?.(salaCriada);
        setTitulo('');
        setQuestaoIds([]);
      }
    } catch (err) {
      if (!montadoRef.current) return;
      setErro(err?.message || 'Não foi possível criar a sala agora.');
    } finally {
      if (montadoRef.current) setCriando(false);
    }
  };

  return (
    <section aria-labelledby={`${formId}-titulo`} className="space-y-6">
      <form
        onSubmit={handleCriarSala}
        noValidate
        className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-6 space-y-6 shadow-xs"
      >
        <div className="border-b border-[#E2D9F7] pb-3">
          <h2 id={`${formId}-titulo`} className="font-head text-xl font-black text-[#25104A]">
            Preparar nova sala ao vivo
          </h2>
          <p className="text-xs text-[#5B4B86] mt-0.5">
            As salas congelam uma cópia revisada das questões selecionadas para preservar a partida mesmo se o banco for editado depois.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor={`${formId}-nome`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Título da sala
            </label>
            <input
              id={`${formId}-nome`}
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Ex.: Revisão de Funções · 2º Ano B"
              className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base text-[#25104A]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`${formId}-tempo`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
              Tempo por rodada (segundos)
            </label>
            <input
              id={`${formId}-tempo`}
              type="number"
              min={15}
              max={600}
              value={tempoSegundos}
              onChange={(e) => setTempoSegundos(Number(e.target.value))}
              className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base font-bold text-[#25104A]"
            />
          </div>
        </div>

        {/* Seleção das 5 modalidades */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Modalidade do jogo
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {modalidades.map((mod) => {
              const selecionada = modalidade === mod.id;
              return (
                <label
                  key={mod.id}
                  className={`flex flex-col gap-1 rounded-xl border-2 p-3 cursor-pointer transition ${
                    selecionada
                      ? 'border-[#6315D9] bg-[#F3EDFF] text-[#25104A] shadow-xs'
                      : 'border-[#E2D9F7] bg-[#FFFDF7] text-[#5B4B86] hover:bg-[#F3EDFF]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`${formId}-modalidade`}
                      value={mod.id}
                      checked={selecionada}
                      onChange={() => trocarModalidade(mod.id)}
                      className="accent-[#6315D9]"
                    />
                    <span className="text-sm font-black text-[#25104A]">{mod.nome}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#5B4B86]">
                    Aceita: {mod.tiposQuestoes.map(rotuloTipoQuestao).join(', ')}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Regra explícita quando equipes ou tabuleiro estiver selecionada */}
        {(modalidade === 'equipes' || modalidade === 'tabuleiro') && (
          <div className="rounded-2xl border-2 border-[#6315D9] bg-[#F3EDFF] p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="inline-block rounded-md bg-[#FFE500] px-2.5 py-0.5 text-[11px] font-black uppercase text-[#25104A]">
                  {modalidade === 'tabuleiro'
                    ? 'Equipes do Tabuleiro (prévia editável)'
                    : 'Regra do Desafio em Equipes'}
                </span>
                <p className="text-sm font-bold text-[#25104A]">
                  {modalidade === 'tabuleiro'
                    ? 'Equipes padrão (Azul e Verde) com alunos distribuídos automaticamente. Edite nomes, adicione equipes ou ajuste integrantes antes de iniciar.'
                    : 'Uma resposta por aluno/rodada, pontuação da equipe pela soma dos resultados individuais (1000 pontos por acerto, sem bônus por tempo).'}
                </p>
              </div>
              {modalidade === 'tabuleiro' && (
                <button
                  type="button"
                  onClick={() => setEquipes(distribuirEquipesTabuleiro(alunosDasTurmasSelecionadas))}
                  className="min-h-10 rounded-xl border border-[#6315D9] bg-white px-3 py-1.5 text-xs font-extrabold text-[#6315D9] hover:bg-[#E7DBFD]"
                >
                  Distribuir automaticamente
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-52 flex flex-col gap-1">
                <label htmlFor={`${formId}-nova-eq`} className="text-xs font-extrabold text-[#4A3B7C]">
                  Nome da nova equipe
                </label>
                <input
                  id={`${formId}-nova-eq`}
                  type="text"
                  value={nomeNovaEquipe}
                  onChange={(e) => setNomeNovaEquipe(e.target.value)}
                  placeholder="Ex.: Equipe Alfa"
                  className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-sm text-[#25104A]"
                />
              </div>
              <button
                type="button"
                disabled={modalidade === 'tabuleiro' && equipesEfetivas.length >= 4}
                onClick={adicionarEquipe}
                className="min-h-11 rounded-xl bg-[#25104A] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#180A30] disabled:opacity-45"
              >
                + Adicionar equipe
              </button>
            </div>

            {equipesEfetivas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipesEfetivas.map((eq) => (
                  <div key={eq.id} className="rounded-xl border border-[#E2D9F7] bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        aria-label={`Nome da equipe ${eq.nome}`}
                        value={eq.nome}
                        onChange={(e) => {
                          const base = equipesEfetivas;
                          setEquipes(
                            base.map((item) =>
                              item.id === eq.id ? { ...item, nome: e.target.value } : item
                            )
                          );
                        }}
                        className="min-h-9 flex-1 rounded-lg border border-[#E2D9F7] bg-[#F8F5FF] px-2.5 py-1 text-sm font-black text-[#25104A]"
                      />
                      <span className="text-xs font-bold text-[#5B4B86]">
                        ({eq.participanteIds.length} integrantes)
                      </span>
                      <button
                        type="button"
                        onClick={() => setEquipes(equipesEfetivas.filter((item) => item.id !== eq.id))}
                        className="text-xs font-bold text-red-700 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                    {alunosDasTurmasSelecionadas.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {alunosDasTurmasSelecionadas.map((al) => {
                          const naEquipe = eq.participanteIds.includes(al.participanteId);
                          return (
                            <label
                              key={al.chave}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold cursor-pointer ${
                                naEquipe
                                  ? 'border-[#6315D9] bg-[#E7DBFD] text-[#25104A]'
                                  : 'border-[#E2D9F7] bg-[#FFFDF7] text-[#5B4B86]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={naEquipe}
                                onChange={() => alternarParticipanteEquipe(eq.id, al.participanteId)}
                                className="accent-[#6315D9]"
                              />
                              <span>
                                {al.nome}
                                {turmaIds.length > 1 && (
                                  <>
                                    {' '}
                                    <span className="text-[10px] text-[#5B4B86]">({al.turmaNome})</span>
                                  </>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#5B4B86]">
                        Selecione uma turma abaixo para distribuir estudantes nesta equipe (ou deixe para associação pela turma).
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Turmas autorizadas */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Turmas autorizadas ({turmaIds.length} selecionadas)
          </legend>
          {turmas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E2D9F7] bg-[#FFFDF7] p-3 text-xs text-[#5B4B86]">
              Nenhuma turma cadastrada encontrada no Diário Pedagógico. Cadastre uma turma no Diário para abrir salas aos estudantes.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {turmas.map((turma) => {
                const marcada = turmaIds.includes(turma.id);
                return (
                  <label
                    key={turma.id}
                    className={`inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-sm font-bold cursor-pointer transition ${
                      marcada
                        ? 'border-[#6315D9] bg-[#F3EDFF] text-[#25104A]'
                        : 'border-[#E2D9F7] bg-white text-[#5B4B86]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => alternarTurma(turma.id)}
                      className="accent-[#6315D9]"
                    />
                    <span>{turma.nome || turma.titulo || turma.id}</span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        {/* Seleção de questões revisadas e compatíveis */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
            Questões da partida ({questaoIds.length} selecionadas) — apenas revisadas e compatíveis com {infoModalidade.nome}
          </legend>

          {avisoIncompatibilidade && (
            <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">
              {avisoIncompatibilidade}
            </p>
          )}

          {questoes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E2D9F7] bg-[#FFFDF7] p-4 text-xs text-[#5B4B86]">
              Nenhuma questão disponível no banco ainda. Crie ou gere questões e aprove a revisão primeiro.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {questoes.map((q) => {
                const revisada = q.status === 'revisada';
                const compativel = questaoCompativelComModalidade(q, modalidade, modalidadesServidor);
                const habilitada = revisada && compativel;
                const selecionada = questaoIds.includes(q.id);

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border-2 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      selecionada
                        ? 'border-[#6315D9] bg-[#F3EDFF]'
                        : habilitada
                        ? 'border-[#E2D9F7] bg-white'
                        : 'border-[#E2D9F7]/70 bg-[#FFFDF7] opacity-75'
                    }`}
                  >
                    <label className="flex items-start gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selecionada}
                        aria-disabled={!habilitada}
                        onChange={() => alternarQuestao(q)}
                        className="mt-1 h-4 w-4 accent-[#6315D9]"
                      />
                      <span className="space-y-1 text-sm">
                        <span className="block font-bold text-[#25104A]">
                          <RenderTextoSeguro texto={q.enunciado} />
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#5B4B86]">
                          <span>{q.disciplina}</span>
                          <span>·</span>
                          <span>{q.anoEscolar}</span>
                          <span>·</span>
                          <span className={`rounded px-1.5 py-0.5 border ${classeDificuldade(q.dificuldade)}`}>
                            {rotuloDificuldade(q.dificuldade)}
                          </span>
                          <span className="rounded bg-[#E7DBFD] px-1.5 py-0.5 text-[#25104A]">
                            {rotuloTipoQuestao(q.tipo)}
                          </span>
                        </span>
                      </span>
                    </label>

                    {!revisada && (
                      <span className="shrink-0 rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">
                        Aguardando revisão docente
                      </span>
                    )}
                    {revisada && !compativel && (
                      <span className="shrink-0 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-extrabold text-red-900">
                        Incompatível com esta modalidade
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>

        {erro && (
          <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-900">
            {erro}
          </p>
        )}

        {salaRecemCriada && (
          <div role="status" className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-emerald-950">
                Sala criada! Código: <span className="font-mono text-lg">{salaRecemCriada.codigo}</span>
              </p>
              <p className="text-xs text-emerald-900">
                Abra o painel docente para controlar a partida e o telão para projetar para a turma.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/aula-gamificada/sala/${encodeURIComponent(salaRecemCriada.codigo)}`}
                className="min-h-10 inline-flex items-center rounded-xl bg-[#6315D9] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#5411B8]"
              >
                Abrir painel docente →
              </Link>
              <Link
                href={`/aula-gamificada/projecao/${encodeURIComponent(salaRecemCriada.codigo)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-10 inline-flex items-center rounded-xl bg-[#25104A] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#180A30]"
              >
                Abrir telão ↗
              </Link>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={criando}
            className="min-h-12 rounded-xl bg-[#6315D9] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#5411B8] disabled:opacity-50"
          >
            {criando ? 'Criando sala...' : 'Criar sala ao vivo'}
          </button>
        </div>
      </form>

      {/* Lista de salas existentes */}
      <div className="space-y-3">
        <h3 className="font-head text-lg font-black text-[#25104A]">
          Minhas salas ({salas.length})
        </h3>
        {salas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma sala aberta ainda"
            descricao="Preencha o formulário acima com uma modalidade, turma e questões revisadas para gerar o código da turma."
            icone="🎮"
          />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salas.map((sala) => {
              const modInfo = obterModalidadeInfo(sala.modalidade, modalidadesServidor);
              return (
                <li
                  key={sala.codigo}
                  className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-5 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-lg bg-[#FFE500] px-2.5 py-0.5 font-mono text-sm font-black text-[#25104A]">
                        {sala.codigo}
                      </span>
                      <span className="rounded-full bg-[#F3EDFF] border border-[#E2D9F7] px-2.5 py-0.5 text-xs font-bold text-[#4A3B7C]">
                        {FASES_ROTULO[sala.fase] || sala.fase}
                      </span>
                    </div>
                    <h4 className="font-head text-lg font-black text-[#25104A]">{sala.titulo}</h4>
                    <p className="text-xs font-semibold text-[#5B4B86]">
                      {modInfo.nome} · {(sala.questaoIds || []).length} questões · {sala.tempoSegundos || 60}s/rodada
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2D9F7]">
                    <Link
                      href={`/aula-gamificada/sala/${encodeURIComponent(sala.codigo)}`}
                      className="flex-1 min-h-10 inline-flex items-center justify-center rounded-xl bg-[#6315D9] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#5411B8]"
                    >
                      Painel docente
                    </Link>
                    <Link
                      href={`/aula-gamificada/projecao/${encodeURIComponent(sala.codigo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-10 inline-flex items-center justify-center rounded-xl border border-[#25104A] bg-[#25104A] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#180A30]"
                    >
                      Telão ↗
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
