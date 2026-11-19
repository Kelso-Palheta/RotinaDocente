'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { gerarCsvRelatorio } from '@/dominio/aula-gamificada/avaliacao';
import {
  finalizarAvaliacao,
  obterRelatorioSala,
  revisarNotaAvaliacao,
  sincronizarAvaliacaoDiario,
} from './api';

export default function RelatorioAvaliacao({
  codigo,
  relatorioInicial = null,
  obterToken,
}) {
  const [relatorio, setRelatorio] = useState(relatorioInicial);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [revisandoPid, setRevisandoPid] = useState(null);
  const [notaInput, setNotaInput] = useState('');
  const [justificativaInput, setJustificativaInput] = useState('');
  const [zerarAusentes, setZerarAusentes] = useState(false);
  const [previaSync, setPreviaSync] = useState(null);
  const [reconciliarAusentes, setReconciliarAusentes] = useState(false);
  const [detalhesPid, setDetalhesPid] = useState(null);

  const carregar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await obterRelatorioSala({ codigo, obterToken });
      setRelatorio(dados);
    } catch (e) {
      setErro(e?.message || 'Não foi possível carregar o relatório.');
    } finally {
      setCarregando(false);
    }
  };

  const salvarRevisao = async (e) => {
    e.preventDefault();
    if (!revisandoPid) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await revisarNotaAvaliacao({
        codigo,
        expectedRevision: relatorio?.revision ?? 1,
        participanteId: revisandoPid,
        notaRevisada: Number(notaInput),
        justificativa: justificativaInput,
        obterToken,
      });
      setRelatorio({ ...res.relatorio, revision: res.revision });
      setRevisandoPid(null);
      setNotaInput('');
      setJustificativaInput('');
      setMensagem('Nota revisada e auditada com sucesso.');
    } catch (err) {
      setErro(err?.message || 'Erro ao revisar nota.');
    } finally {
      setCarregando(false);
    }
  };

  const handleFinalizar = async (publicarPortal = false) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await finalizarAvaliacao({
        codigo,
        expectedRevision: relatorio?.revision ?? 1,
        zerarAusentes,
        publicarPortal,
        obterToken,
      });
      setRelatorio({ ...res.relatorio, revision: res.revision });
      setMensagem(
        publicarPortal
          ? 'Avaliação finalizada e disponibilizada no Portal do Aluno.'
          : 'Avaliação finalizada.',
      );
    } catch (err) {
      setErro(err?.message || 'Erro ao finalizar avaliação.');
    } finally {
      setCarregando(false);
    }
  };

  const handlePreviaSync = async () => {
    setCarregando(true);
    setErro(null);
    setReconciliarAusentes(false);
    try {
      const res = await sincronizarAvaliacaoDiario({
        codigo,
        expectedRevision: relatorio?.revision ?? 1,
        dryRun: true,
        obterToken,
      });
      setPreviaSync({ ...res.previa, salaRevision: relatorio?.revision ?? 1 });
    } catch (err) {
      setErro(err?.message || 'Erro ao gerar prévia de sincronização.');
    } finally {
      setCarregando(false);
    }
  };

  const handleConfirmarSync = async (confirmarSobrescrita = false) => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await sincronizarAvaliacaoDiario({
        codigo,
        expectedRevision: previaSync?.salaRevision ?? relatorio?.revision ?? 1,
        diarioRevisionEsperada: previaSync?.diarioRevision,
        dryRun: false,
        confirmarSobrescrita: confirmarSobrescrita || reconciliarAusentes,
        reconciliarAusentes,
        obterToken,
      });
      setPreviaSync(null);
      setReconciliarAusentes(false);
      const pendencias = res.pendencias ?? res.sincronizacao?.pendencias ?? [];
      setMensagem(
        pendencias.length || res.sincronizacao?.status === 'pendente'
          ? `Sincronização com pendências (${res.sincronizadas} lançamentos; ${pendencias.length} ${pendencias.length === 1 ? 'pendência' : 'pendências'}). Confira o relatório antes de concluir.`
          : `Sincronização concluída (${res.sincronizadas} lançamentos no Diário).`,
      );
      await carregar();
    } catch (err) {
      setErro(err?.message || 'Erro ao sincronizar com o Diário.');
    } finally {
      setCarregando(false);
    }
  };

  const exportarCsv = () => {
    if (!relatorio) return;
    const csv = gerarCsvRelatorio(relatorio);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${relatorio.sala?.codigo || 'sala'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPdf = () => {
    if (!relatorio) return;
    const cfgDoc = relatorio.configuracaoCongelada;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text(
      doc.splitTextToSize(`Relatório Individual/Turma — ${cfgDoc?.tituloAtividade || relatorio.sala?.titulo || relatorio.sala?.codigo}`, 180),
      14,
      16,
    );
    doc.setFontSize(10);
    const resumoDoc = relatorio.resumoTurma || {};
    const contextoLinha = [
      `Sala: ${relatorio.sala?.codigo || '-'}`,
      `Modalidade: ${relatorio.sala?.modalidade || '-'}`,
      `Formato: ${relatorio.sala?.formatoParticipacao || 'individual'}${relatorio.sala?.modoRespostaGrupo ? ` (${relatorio.sala.modoRespostaGrupo})` : ''}`,
      `Finalidade: ${relatorio.sala?.finalidade || 'revisao'}`,
      cfgDoc ? `Ano/Bim: ${cfgDoc.anoLetivo}/${cfgDoc.bimestre}º | Máx: ${cfgDoc.valorMaximo}` : '',
      cfgDoc?.criterioHerois ? `Critério Heróis: ${cfgDoc.criterioHerois}` : '',
      cfgDoc?.criterioColetivo ? `Critério Coletivo: ${cfgDoc.criterioColetivo}` : '',
      `Presentes: ${resumoDoc.presentes ?? 0}`,
      typeof resumoDoc.respostasUnicasGrupos === 'number'
        ? `Respostas únicas de grupos: ${resumoDoc.respostasUnicasGrupos}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');
    const ctxPartes = doc.splitTextToSize(contextoLinha, 180);
    doc.text(ctxPartes, 14, 28);
    let y = 28 + ctxPartes.length * 5 + 4;
    for (const a of relatorio.alunos || []) {
      const nota = typeof a.notaFinal === 'number' ? a.notaFinal.toFixed(2) : '-';
      const calc = typeof a.notaCalculada === 'number' ? a.notaCalculada.toFixed(2) : '-';
      const rev = typeof a.notaRevisada === 'number' ? a.notaRevisada.toFixed(2) : '-';
      const aprov = typeof a.aproveitamento === 'number' ? `${(a.aproveitamento * 100).toFixed(1)}%` : '-';
      const origem = a.origemColetiva
        ? `Coletiva (${a.criterioColetivo || 'atribuir_presentes'})`
        : a.equipeId
          ? 'Grupo (individual)'
          : 'Individual';
      const autoria = a.autoresGrupo?.length ? a.autoresGrupo.join(', ') : a.representanteNome || '';
      const bloco = [
        `Aluno: ${a.nome}${a.equipeNome ? ` | Grupo: ${a.equipeNome}` : ''} | Presença: ${a.presencaStatus || '-'} | Origem: ${origem}${autoria ? ` | Rep./Autoria: ${autoria}` : ''}`,
        `Situação: ${a.situacao} | Questões: ${a.respondidas}/${a.elegiveis} | Aproveit.: ${aprov} | Calculada: ${calc} | Revisada: ${rev} | Final: ${nota}${a.justificativaRevisao ? ` | Justificativa: ${a.justificativaRevisao}` : ''}`,
      ];
      for (const texto of bloco) {
        const partes = doc.splitTextToSize(texto, 180);
        if (y + partes.length * 5 > 282) {
          doc.addPage();
          y = 16;
        }
        doc.text(partes, 14, y);
        y += partes.length * 5;
      }
      y += 3;
    }
    doc.save(`relatorio-${relatorio.sala?.codigo || 'sala'}.pdf`);
  };

  if (!relatorio) {
    return (
      <div className="rounded-2xl border border-[#E2D9F7] bg-white p-5 space-y-3">
        <p className="text-sm font-bold text-[#25104A]">Relatório da sala {codigo}</p>
        <button
          type="button"
          disabled={carregando}
          onClick={carregar}
          className="min-h-10 rounded-xl bg-[#6315D9] px-4 py-2 text-xs font-extrabold text-white"
        >
          {carregando ? 'Carregando...' : 'Carregar relatório'}
        </button>
        {erro && <p role="alert" className="text-xs font-bold text-red-700">{erro}</p>}
      </div>
    );
  }

  const cfg = relatorio.configuracaoCongelada;
  const ehAvaliativa = relatorio.sala?.finalidade === 'avaliativa';

  return (
    <section className="rounded-3xl border-2 border-[#6315D9] bg-white p-5 sm:p-6 space-y-5 text-[#25104A]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#FFE500] px-2.5 py-0.5 text-xs font-black uppercase">
              {ehAvaliativa ? 'Avaliativa' : 'Revisão'}
            </span>
            <span className="text-xs font-bold text-[#5B4B86]">
              Sala {relatorio.sala?.codigo} · {relatorio.sala?.modalidade}
              {relatorio.sala?.formatoParticipacao ? ` · Formato: ${relatorio.sala.formatoParticipacao}` : ''}
              {relatorio.sala?.modoRespostaGrupo ? ` (${relatorio.sala.modoRespostaGrupo})` : ''}
            </span>
          </div>
          <h3 className="font-head text-xl font-black">
            {cfg?.tituloAtividade || relatorio.sala?.titulo}
          </h3>
          {cfg && (
            <p className="text-xs font-semibold text-[#5B4B86]">
              {cfg.disciplina} · Ano {cfg.anoLetivo} · {cfg.bimestre}º Bimestre · Valor máx: {cfg.valorMaximo}
              {relatorio.sala?.modalidade === 'herois' && ` · Critério: ${cfg.criterioHerois}`}
              {relatorio.sala?.modoRespostaGrupo === 'compartilhada' && cfg.criterioColetivo && (
                <> · Critério coletivo: {cfg.criterioColetivo}</>
              )}
            </p>
          )}
          {typeof relatorio.resumoTurma?.respostasUnicasGrupos === 'number' && (
            <p className="text-[11px] font-bold text-[#6315D9]">
              Pessoas presentes: {relatorio.resumoTurma?.presentes ?? 0} · Respostas únicas de grupos: {relatorio.resumoTurma.respostasUnicasGrupos}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            className="min-h-10 rounded-xl border border-[#6315D9] bg-white px-3 py-1.5 text-xs font-extrabold text-[#6315D9] hover:bg-[#F3EDFF]"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={exportarPdf}
            className="min-h-10 rounded-xl border border-[#6315D9] bg-white px-3 py-1.5 text-xs font-extrabold text-[#6315D9] hover:bg-[#F3EDFF]"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {Array.isArray(relatorio.limitacoes) && relatorio.limitacoes.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          {relatorio.limitacoes.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}

      {erro && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800">
          {erro}
        </p>
      )}
      {mensagem && (
        <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
          {mensagem}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="rounded-xl bg-[#F3EDFF] p-3">
          <span className="block text-[11px] font-bold text-[#5B4B86]">Elegíveis</span>
          <strong className="text-lg font-black">{relatorio.resumoTurma?.totalElegiveis ?? 0}</strong>
        </div>
        <div className="rounded-xl bg-[#F3EDFF] p-3">
          <span className="block text-[11px] font-bold text-[#5B4B86]">Presentes</span>
          <strong className="text-lg font-black">{relatorio.resumoTurma?.presentes ?? 0}</strong>
        </div>
        <div className="rounded-xl bg-[#F3EDFF] p-3">
          <span className="block text-[11px] font-bold text-[#5B4B86]">Ausentes</span>
          <strong className="text-lg font-black">{relatorio.resumoTurma?.ausentes ?? 0}</strong>
        </div>
        <div className="rounded-xl bg-[#F3EDFF] p-3">
          <span className="block text-[11px] font-bold text-[#5B4B86]">Média</span>
          <strong className="text-lg font-black">
            {typeof relatorio.resumoTurma?.mediaNota === 'number'
              ? relatorio.resumoTurma.mediaNota.toFixed(2)
              : '-'}
          </strong>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-[#E2D9F7] text-[#4A3B7C]">
              <th className="py-2 pr-3">Aluno</th>
              <th className="py-2 pr-3">Grupo / Origem</th>
              <th className="py-2 pr-3">Situação / Presença</th>
              <th className="py-2 pr-3">Resp./Eleg.</th>
              <th className="py-2 pr-3">Aproveit.</th>
              <th className="py-2 pr-3">Calculada</th>
              <th className="py-2 pr-3">Final</th>
              {ehAvaliativa && <th className="py-2">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {(relatorio.alunos || []).map((a) => (
              <tr key={a.participanteId} className="border-b border-[#F3EDFF]">
                <td className="py-2 pr-3 font-bold">{a.nome}</td>
                <td className="py-2 pr-3">
                  <span className="block font-semibold">{a.equipeNome || (a.equipeId ? a.equipeId : 'Individual')}</span>
                  <span className="block text-[10px] text-[#5B4B86]">
                    {a.origemColetiva
                      ? `Nota coletiva${a.representanteNome ? ` · Rep.: ${a.representanteNome}` : ''}`
                      : a.equipeId
                        ? 'Grupo (individual)'
                        : 'Individual'}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <span className="block">{a.situacao}</span>
                  {a.presencaStatus && (
                    <span className="block text-[10px] text-[#5B4B86]">{a.presencaStatus}</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  {a.respondidas}/{a.elegiveis}
                </td>
                <td className="py-2 pr-3">
                  {typeof a.aproveitamento === 'number'
                    ? `${(a.aproveitamento * 100).toFixed(1)}%`
                    : '-'}
                </td>
                <td className="py-2 pr-3">
                  {typeof a.notaCalculada === 'number' ? a.notaCalculada.toFixed(2) : '-'}
                </td>
                <td className="py-2 pr-3 font-black">
                  {typeof a.notaFinal === 'number' ? a.notaFinal.toFixed(2) : '-'}
                </td>
                <td className="py-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setDetalhesPid((p) => (p === a.participanteId ? null : a.participanteId))}
                    className="text-xs font-bold text-[#4A3B7C] hover:underline"
                  >
                    {detalhesPid === a.participanteId ? 'Ocultar detalhes' : 'Detalhes'}
                  </button>
                  {ehAvaliativa && (
                    <button
                      type="button"
                      onClick={() => {
                        setRevisandoPid(a.participanteId);
                        setNotaInput(typeof a.notaFinal === 'number' ? String(a.notaFinal) : '0');
                        setJustificativaInput(a.justificativaRevisao || '');
                      }}
                      className="text-xs font-extrabold text-[#6315D9] hover:underline"
                    >
                      Revisar nota
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalhesPid && (() => {
        const alvo = (relatorio.alunos || []).find((x) => x.participanteId === detalhesPid);
        if (!alvo) return null;
        return (
          <div className="rounded-2xl border border-[#E2D9F7] bg-[#F8F5FF] p-4 space-y-2 text-xs">
            <h4 className="font-black text-[#25104A]">Detalhes individuais — {alvo.nome}</h4>
            {alvo.justificativaRevisao && (
              <p className="font-bold text-[#6315D9]">Justificativa da revisão: {alvo.justificativaRevisao}</p>
            )}
            <ul className="space-y-2">
              {(alvo.detalhesQuestoes || []).map((q) => (
                <li key={q.rodada} className="rounded-xl border border-[#E2D9F7] bg-white p-2.5 space-y-0.5">
                  <strong>Questão {q.rodada}: {q.enunciado || '(sem enunciado)'}</strong>
                  <p>Status: {q.status} · Tentativas: {q.tentativas ?? 0} · Gabarito: {JSON.stringify(q.respostaCorreta)}</p>
                  {q.correcaoManual && <p className="text-[#25104A] font-bold">Correção docente: {q.correcaoManual.correta ? 'correta' : 'incorreta'} · {q.correcaoManual.justificativa}</p>}
                  {q.respostaFinal?.texto && <p>Resposta enviada: {q.respostaFinal.texto}</p>}
                  {q.explicacao && <p className="text-[#5B4B86]">Devolutiva: {q.explicacao}</p>}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {revisandoPid && (
        <form onSubmit={salvarRevisao} className="rounded-2xl border border-[#6315D9] bg-[#F3EDFF] p-4 space-y-3">
          <h4 className="text-xs font-black uppercase text-[#25104A]">Revisão auditada de nota</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              max={cfg?.valorMaximo || 10}
              aria-label="Nova nota"
              value={notaInput}
              onChange={(e) => setNotaInput(e.target.value)}
              className="min-h-10 rounded-xl border border-[#E2D9F7] bg-white px-3 text-sm"
              required
            />
            <input
              type="text"
              aria-label="Justificativa da revisão"
              placeholder="Justificativa obrigatória"
              value={justificativaInput}
              onChange={(e) => setJustificativaInput(e.target.value)}
              className="sm:col-span-2 min-h-10 rounded-xl border border-[#E2D9F7] bg-white px-3 text-sm"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={carregando}
              className="min-h-10 rounded-xl bg-[#6315D9] px-4 py-1.5 text-xs font-extrabold text-white"
            >
              Salvar revisão
            </button>
            <button
              type="button"
              onClick={() => setRevisandoPid(null)}
              className="min-h-10 rounded-xl border border-[#E2D9F7] bg-white px-3 py-1.5 text-xs font-bold"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {ehAvaliativa && (
        <div className="rounded-2xl border border-[#E2D9F7] bg-[#F8F5FF] p-4 space-y-3">
          <label className="flex items-center gap-2 text-xs font-bold text-[#25104A]">
            <input
              type="checkbox"
              checked={zerarAusentes}
              onChange={(e) => setZerarAusentes(e.target.checked)}
              className="accent-[#6315D9]"
            />
            Atribuir 0 aos alunos com situação nao_participou (decisão docente explícita)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={carregando}
              onClick={() => handleFinalizar(false)}
              className="min-h-10 rounded-xl bg-[#25104A] px-4 py-2 text-xs font-extrabold text-white"
            >
              Confirmar finalização
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={() => handleFinalizar(true)}
              className="min-h-10 rounded-xl bg-[#6315D9] px-4 py-2 text-xs font-extrabold text-white"
            >
              Publicar no Portal do Aluno
            </button>
            <button
              type="button"
              disabled={carregando}
              onClick={handlePreviaSync}
              className="min-h-10 rounded-xl border border-[#6315D9] bg-white px-4 py-2 text-xs font-extrabold text-[#6315D9]"
            >
              Prévia e sincronizar com Diário
            </button>
          </div>

          {previaSync && (
            <div className="rounded-xl border border-[#6315D9] bg-white p-3 space-y-2 text-xs">
              <p className="font-black">
                Prévia de sincronização ({previaSync.bimestre}º Bimestre):{' '}
                {previaSync.alteracoes?.length || 0} lançamentos previstos
              </p>
              {Array.isArray(previaSync.linhasDetalhadas) && previaSync.linhasDetalhadas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2D9F7] text-[#4A3B7C]">
                        <th className="py-1 pr-2">Aluno</th>
                        <th className="py-1 pr-2">Turma</th>
                        <th className="py-1 pr-2">Coluna (Máx)</th>
                        <th className="py-1 pr-2">Atual</th>
                        <th className="py-1">Nova</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previaSync.linhasDetalhadas.map((ln) => (
                        <tr key={`${ln.turmaId}_${ln.alunoId}`} className="border-b border-[#F3EDFF]">
                          <td className="py-1 pr-2 font-bold">{ln.alunoNome}</td>
                          <td className="py-1 pr-2">{ln.turmaNome}</td>
                          <td className="py-1 pr-2">{ln.colunaNome} ({ln.valorMaximoColuna})</td>
                          <td className="py-1 pr-2">{ln.notaAtual ?? '-'}</td>
                          <td className="py-1 font-black">{ln.notaNova ?? 'Sem nota'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {previaSync.conflitos?.length > 0 && (
                <p className="font-bold text-amber-800">
                  Atenção: {previaSync.conflitos.length} notas existentes divergem nesta coluna.
                </p>
              )}
              {previaSync.pendencias?.some((p) => p.tipo === 'divergencia_diario_sem_nota') && (
                <label className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={reconciliarAusentes}
                    onChange={(e) => setReconciliarAusentes(e.target.checked)}
                    disabled={carregando}
                    className="mt-0.5 accent-[#6315D9]"
                  />
                  Autorizo retirar apenas as notas anteriores desta atividade para os alunos sem nota, conforme a prévia. As demais notas serão preservadas.
                </label>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() => handleConfirmarSync(previaSync.conflitos?.length > 0)}
                  className="min-h-9 rounded-lg bg-[#6315D9] px-3 py-1.5 text-xs font-extrabold text-white"
                >
                  {reconciliarAusentes
                    ? 'Confirmar retirada e sincronização'
                    : previaSync.conflitos?.length > 0
                    ? 'Confirmar sobrescrita no Diário'
                    : 'Confirmar sincronização no Diário'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviaSync(null)}
                  className="min-h-9 rounded-lg border px-3 py-1.5 text-xs font-bold"
                >
                  Fechar prévia
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
