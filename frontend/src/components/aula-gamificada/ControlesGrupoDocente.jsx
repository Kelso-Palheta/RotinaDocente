'use client';

import React, { useState } from 'react';

function rotuloPresenca(p) {
  if (p?.presenteConfirmado === true) return 'Presente confirmado';
  if (p?.presenteConfirmado === false) return 'Ausente confirmado';
  if (p?.entrouEmMs) return 'Sessão ativa';
  return 'Não confirmado';
}

export default function ControlesGrupoDocente({
  estado,
  ocupado = false,
  bloqueado = false,
  onComando,
}) {
  const equipes = Array.isArray(estado?.equipes) ? estado.equipes : [];
  const participantes = Array.isArray(estado?.participantes) ? estado.participantes : [];
  const ehGrupos = estado?.formatoParticipacao === 'grupos' || equipes.length > 0;
  const ehCompartilhada = estado?.modoRespostaGrupo === 'compartilhada';

  const turmasDistintas = new Set(participantes.map((p) => p?.turmaId).filter(Boolean)).size;

  const repsIniciais = {};
  for (const eq of equipes) {
    const membros = participantes.filter((p) => String(p.equipeId) === String(eq.id));
    const atual =
      membros.find((p) => String(p.id) === String(eq.representanteParticipanteId || '')) ||
      membros.find((p) => String(p.alunoId) === String(eq.representanteAlunoId || ''));
    if (atual) repsIniciais[eq.id] = atual.id;
  }

  const presentesIniciais = new Set();
  for (const p of participantes) {
    if (p.presenteConfirmado === true || (p.presenteConfirmado == null && Boolean(p.entrouEmMs))) {
      presentesIniciais.add(String(p.id));
    }
  }

  const [repsOverride, setRepsOverride] = useState({});
  const [presentesOverride, setPresentesOverride] = useState(null);
  const [feedbackOk, setFeedbackOk] = useState(null);
  const [feedbackErro, setFeedbackErro] = useState(null);

  const repsSelecionados = { ...repsIniciais, ...repsOverride };
  const presentesMarcados = presentesOverride ?? presentesIniciais;

  if (!ehGrupos || (equipes.length === 0 && participantes.length === 0)) {
    return null;
  }

  const salvarRepresentante = async (eqId) => {
    const repId = repsSelecionados[eqId];
    if (!repId || typeof onComando !== 'function') return;
    setFeedbackOk(null);
    setFeedbackErro(null);
    try {
      await onComando('alterar_representante', {
        equipeId: eqId,
        representanteParticipanteId: repId,
      });
      const eq = equipes.find((e) => String(e.id) === String(eqId));
      const p = participantes.find((m) => String(m.id) === String(repId));
      setFeedbackOk(
        `Representante de ${eq?.nome || eqId} atualizado para ${p?.nomeExibicao || repId} (tentativas e placar preservados).`,
      );
      setRepsOverride((prev) => {
        const prox = { ...prev };
        delete prox[eqId];
        return prox;
      });
    } catch (e) {
      setFeedbackErro(e?.message || 'Não foi possível alterar o representante agora.');
    }
  };

  const salvarPresenca = async () => {
    if (typeof onComando !== 'function') return;
    setFeedbackOk(null);
    setFeedbackErro(null);
    try {
      await onComando('confirmar_presenca', {
        presentesIds: [...presentesMarcados],
        substituir: true,
      });
      setFeedbackOk(
        `Presença confirmada para ${presentesMarcados.size} de ${participantes.length} participantes.`,
      );
      setPresentesOverride(null);
    } catch (e) {
      setFeedbackErro(e?.message || 'Não foi possível salvar a presença agora.');
    }
  };

  const alternarPresente = (id) => {
    setPresentesOverride((prev) => {
      const proximo = new Set(prev ?? presentesIniciais);
      const chave = String(id);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  };

  return (
    <section
      aria-label="Gestão de grupos, representantes e presença"
      className="rounded-3xl border border-[#B9A6EF]/45 bg-[#3A1A73]/55 p-5 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#00DDEB]">
            Gestão de Grupos, Representantes e Presença
          </h2>
          <p className="text-xs text-[#E7DBFD]">
            Alterações usam identificação estável por turma e aluno, sem reiniciar tentativas, prazo ou pontos.
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-[#FFE500]">
          {ehCompartilhada ? 'Resposta compartilhada' : 'Resposta individual em grupo'}
        </span>
      </div>

      {feedbackOk && (
        <p role="status" className="rounded-xl border border-emerald-400/60 bg-emerald-950/70 px-3.5 py-2 text-xs font-bold text-emerald-200">
          {feedbackOk}
        </p>
      )}
      {feedbackErro && (
        <p role="alert" className="rounded-xl border border-red-400/60 bg-red-950/70 px-3.5 py-2 text-xs font-bold text-red-200">
          {feedbackErro}
        </p>
      )}

      {ehCompartilhada && equipes.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#FFE500]">
            Representante por grupo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipes.map((eq) => {
              const membros = participantes.filter((p) => String(p.equipeId) === String(eq.id));
              const repAtual =
                membros.find((p) => String(p.id) === String(eq.representanteParticipanteId || '')) ||
                membros.find((p) => String(p.alunoId) === String(eq.representanteAlunoId || ''));
              return (
                <div
                  key={eq.id}
                  className="rounded-2xl border border-[#B9A6EF]/35 bg-[#160932]/85 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm font-black text-white">{eq.nome}</strong>
                    <span className="text-[11px] font-semibold text-[#B9EF00]">
                      Atual: {repAtual?.nomeExibicao || 'Não definido'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Representante atual de ${eq.nome}`}
                      value={repsSelecionados[eq.id] || ''}
                      onChange={(e) =>
                        setRepsOverride((prev) => ({ ...prev, [eq.id]: e.target.value }))
                      }
                      disabled={ocupado || bloqueado || membros.length === 0}
                      className="min-h-10 flex-1 rounded-xl border border-[#B9A6EF]/50 bg-[#25104A] px-2.5 text-xs font-bold text-white"
                    >
                      {membros.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nomeExibicao}
                          {turmasDistintas > 1 && m.turmaId ? ` (Turma ${m.turmaId})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={ocupado || bloqueado || !repsSelecionados[eq.id]}
                      onClick={() => salvarRepresentante(eq.id)}
                      className="min-h-10 rounded-xl bg-[#00DDEB] px-3 py-2 text-xs font-black text-[#25104A] hover:bg-[#FFE500] disabled:opacity-45"
                    >
                      Alterar representante
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {participantes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#FFE500]">
              Confirmação de presença ({presentesMarcados.size} de {participantes.length})
            </h3>
            <button
              type="button"
              disabled={ocupado || bloqueado}
              onClick={salvarPresenca}
              className="min-h-10 rounded-xl bg-[#FFE500] px-4 py-2 text-xs font-black text-[#25104A] hover:bg-[#B9EF00] disabled:opacity-45"
            >
              Confirmar presença
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {participantes.map((p) => {
              const eq = equipes.find((e) => String(e.id) === String(p.equipeId || ''));
              const marcado = presentesMarcados.has(String(p.id));
              return (
                <label
                  key={p.id}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-xs cursor-pointer ${
                    marcado
                      ? 'border-[#00DDEB]/70 bg-[#160932]'
                      : 'border-[#B9A6EF]/25 bg-[#160932]/50 opacity-80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternarPresente(p.id)}
                    disabled={ocupado || bloqueado}
                    className="mt-0.5 h-4 w-4 accent-[#00DDEB]"
                  />
                  <span className="min-w-0">
                    <strong className="block truncate text-white">{p.nomeExibicao}</strong>
                    <span className="block text-[11px] text-[#E7DBFD]">
                      {eq ? eq.nome : 'Sem grupo'}
                      {turmasDistintas > 1 && p.turmaId ? ` · Turma ${p.turmaId}` : ''} · {rotuloPresenca(p)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
