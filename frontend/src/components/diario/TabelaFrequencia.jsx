"use client";
import { dataLocalISO } from '@/utils/diario/datas';

import { useState, useMemo, useEffect } from 'react';
import { Check, AlertTriangle, ShieldAlert, Sparkles, Save, Calendar } from 'lucide-react';
import {
  marcarPresencaTodos,
  consolidarFrequenciaTurma
} from '@/dominio/diario/frequenciaEscolar';

import { sugerirChamada } from '@/dominio/diario/acompanhamento';
import { carregarContextoChamada } from '@/infraestrutura/diario/ContextoChamadaRepository';

export function TabelaFrequencia({ turma, onSalvarFrequencia, user }) {
  const hojeIso = dataLocalISO();
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const utc = new Date().toISOString().slice(0, 10);
    // Registros antigos usavam a data UTC. Abra o registro legado sem movê-lo silenciosamente.
    if (!turma.frequencias?.[hojeIso] && turma.frequencias?.[utc] && !turma.frequencias[utc].atualizadoEm) return utc;
    return hojeIso;
  });
  const [quantidadeAulasDia, setQuantidadeAulasDia] = useState(() => turma.frequencias?.[dataSelecionada]?.quantidadeAulas || 1);
  const [contexto, setContexto] = useState({});
  const [rascunhoEditado, setRascunhoEditado] = useState(false);
  const [justificativa, setJustificativa] = useState(() => turma.frequencias?.[dataSelecionada]?.justificativaExcecao || '');
  const [salvando, setSalvando] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Registro de chamadas acumuladas na turma
  const frequenciasTurma = useMemo(() => turma.frequencias || {}, [turma.frequencias]);

  // Estado local das presenças do dia selecionado
  const [presencasDoDia, setPresencasDoDia] = useState(() => {
    const reg = frequenciasTurma[dataSelecionada];
    if (reg?.presencas) return { ...reg.presencas };
    return {};
  });

  const sugestao = sugerirChamada({turma, data: dataSelecionada, ...contexto});
  useEffect(() => {
    if (!user?.uid) return;
    let ativo = true;
    carregarContextoChamada(user.uid, turma.id, Number(turma.anoLetivo || turma.ano || hojeIso.slice(0,4))).then(resultado => {
      if (ativo) setContexto(resultado);
    }).catch(() => { if (ativo) setContexto({aviso:'Sugestões indisponíveis. Confira as aulas.'}); });
    return () => { ativo = false; };
  }, [user?.uid, turma.id, turma.anoLetivo, turma.ano, hojeIso]);

  const handleMudarData = (novaData) => {
    if (salvando) return;
    if (rascunhoEditado && !confirm('Há alterações não salvas nesta chamada. Deseja descartá-las e trocar a data?')) return;
    const registro = sugerirChamada({turma, data:novaData, ...contexto});
    setDataSelecionada(novaData);
    setQuantidadeAulasDia(registro.quantidadeAulas);
    setPresencasDoDia(registro.presencas);
    setRascunhoEditado(false);
    setJustificativa(registro.justificativaExcecao || '');
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Alterna o status de um aluno no dia selecionado ('P' | 'F' | 'FJ')
  const handleSetStatus = (alunoId, novoStatus) => {
    if (salvando) return;
    setRascunhoEditado(true);
    setPresencasDoDia((prev) => ({
      ...prev,
      [alunoId]: novoStatus
    }));
  };

  // Marca todos com o mesmo status em 1 clique
  const handleMarcarTodos = (status) => {
    if (salvando) return;
    if (!confirm('Confirma que conferiu todos os alunos e deseja marcar todos como presentes?')) return;
    setRascunhoEditado(true);
    setPresencasDoDia(marcarPresencaTodos(turma.alunos || [], status));
    showToast(`Todos marcados como ${status === 'P' ? 'Presentes' : status === 'F' ? 'Ausentes' : 'Justificados'}!`);
  };

  // Salva a chamada do dia
  const handleSalvarChamada = async () => {
    if (salvando) return;
    if (!(turma.alunos || []).length || (turma.alunos || []).some(a => !['P','F','FJ'].includes(presencasDoDia[a.id]))) { showToast('Confirme a presença de todos os alunos antes de salvar.'); return; }
    if (sugestao.exigeJustificativa && !justificativa.trim()) { showToast('Informe a justificativa para registrar chamada nesta data.'); return; }
    if (!dataSelecionada || !Number.isInteger(Number(quantidadeAulasDia)) || Number(quantidadeAulasDia) < 1) { showToast('Confira a data e a quantidade de aulas.'); return; }
    if (frequenciasTurma[dataSelecionada] && !confirm('Chamada existente: revise quantidade e presenças. Confirma substituir o registro deste dia?')) return;
    setSalvando(true);
    try {
      const novoRegistro = {
        quantidadeAulas: Number(quantidadeAulasDia) || 1,
        presencas: presencasDoDia,
        atualizadoEm: new Date().toISOString(),
        ...(justificativa.trim() ? {justificativaExcecao:justificativa.trim()} : {}),
        origem: sugestao.origem
      };

      const novasFrequencias = {
        ...frequenciasTurma,
        [dataSelecionada]: novoRegistro
      };

      if (!onSalvarFrequencia) throw new Error('Salvamento indisponível.');
      await onSalvarFrequencia(turma.id, novasFrequencias);
      setRascunhoEditado(false);
      showToast('Chamada registrada com sucesso!');
    } catch (err) {
      alert('Erro ao salvar chamada: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  // Consolidação de toda a turma para as métricas da LDB
  const dadosConsolidados = useMemo(() => {
    return consolidarFrequenciaTurma(turma.alunos || [], frequenciasTurma);
  }, [turma.alunos, frequenciasTurma]);

  // Estatísticas gerais da turma
  const totalAulasGerais = Object.values(frequenciasTurma).reduce((acc, curr) => acc + (Number(curr.quantidadeAulas) || 1), 0);
  const totalAlunos = turma.alunos?.length || 0;
  const regulares = dadosConsolidados.filter((a) => a.statusLdb === 'regular').length;
  const alertas = dadosConsolidados.filter((a) => a.statusLdb === 'alerta').length;
  const criticos = dadosConsolidados.filter((a) => a.statusLdb === 'critico').length;

  return (
    <div data-diario-rascunho={rascunhoEditado ? 'true' : 'false'} data-diario-salvando={salvando ? 'true' : 'false'} className="flex-1 flex flex-col overflow-hidden bg-[#F3EDFF]">
      {/* Toast flutuante */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#25104a] text-white px-4 py-2 rounded-xl shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-3">
          {toastMsg}
        </div>
      )}

      {dataSelecionada !== hojeIso && frequenciasTurma[dataSelecionada] && <p className="p-3 text-xs bg-[#F3EDFF] text-[#25104A]">Chamada existente de {dataSelecionada.split('-').reverse().join('/')}. Confira a data; “Hoje” abre o dia local. Os registros anteriores não foram movidos.</p>}
      {/* Barra de Ações da Chamada */}
      <div className="bg-white border-b border-[#e2d9f7] p-4 sm:p-5 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5b4b86] mb-1">Data da Aula</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  disabled={salvando}
                  value={dataSelecionada}
                  onChange={(e) => handleMudarData(e.target.value)}
                  className="bg-[#f3edff] border border-[#e2d9f7] rounded-xl px-3 py-1.5 text-xs text-[#25104a] font-bold outline-none focus:ring-1 focus:ring-[#6315d9]"
                />
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => handleMudarData(hojeIso)}
                  className="px-2.5 py-1.5 bg-[#f3edff] hover:bg-[#E2D9F7] border border-[#e2d9f7] rounded-xl text-[11px] font-semibold text-[#5b4b86] transition-colors"
                >
                  Hoje
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5b4b86] mb-1">Aulas no Dia</label>
              <select
                disabled={salvando}
                value={quantidadeAulasDia}
                onChange={(e) => { setQuantidadeAulasDia(Number(e.target.value)); setRascunhoEditado(true); }}
                className="bg-[#f3edff] border border-[#e2d9f7] rounded-xl px-3 py-1.5 text-xs text-[#25104a] font-bold outline-none focus:ring-1 focus:ring-[#6315d9]"
              >
                <option value={1}>1 aula</option>
                <option value={2}>2 aulas (geminadas)</option>
                <option value={3}>3 aulas</option>
                <option value={4}>4 aulas</option>
                {[5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} aulas</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={salvando}
              onClick={() => handleMarcarTodos('P')}
              className="px-3 py-2 bg-[#F3EDFF] hover:bg-[#E7DBFD] border border-[#E2D9F7] text-[#5411B8] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Confirmar todos presentes
            </button>

            <button
              type="button"
              onClick={handleSalvarChamada}
              disabled={salvando}
              className="btn-brand-primary px-4 py-2 text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {salvando ? 'Salvando...' : 'Salvar Chamada do Dia'}
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-[#5B4B86] space-y-2">
          <p>{frequenciasTurma[dataSelecionada] ? 'Chamada já registrada. Revise antes de substituir.' : 'Nova chamada: marque cada aluno ou confirme todos presentes.'}</p>
          {contexto.aviso && <p role="status">{contexto.aviso}</p>}
          {sugestao.origem !== 'manual' && sugestao.origem !== 'registro' && <p>Sugestão do {sugestao.origem === 'horario' ? 'Meu Horário' : 'Calendário'}: {sugestao.quantidadeAulas} aula(s). <button type="button" disabled={salvando} className="underline font-bold" onClick={() => {setQuantidadeAulasDia(sugestao.quantidadeAulas);setRascunhoEditado(true);}}>Usar quantidade sugerida</button></p>}
          {sugestao.exigeJustificativa && <label className="block text-[#25104A]">{sugestao.aviso} Justificativa da exceção<input disabled={salvando} aria-label="Justificativa da exceção" className="block border rounded p-2 w-full" value={justificativa} onChange={e=>{setJustificativa(e.target.value);setRascunhoEditado(true);}} /></label>}
        </div>
        {/* Cards de Resumo LDB */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div className="bg-[#f3edff] border border-[#e2d9f7] rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#25104a]/10 text-[#25104a] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5b4b86]">Aulas Dadas</p>
              <p className="text-base font-extrabold text-[#25104a] font-mono">{totalAulasGerais}</p>
            </div>
          </div>

          <div className="bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6315D9] text-white flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#25104A]">Regulares (&ge;80%)</p>
              <p className="text-base font-extrabold text-[#5411B8] font-mono">{regulares} / {totalAlunos}</p>
            </div>
          </div>

          <div className="bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6315D9] text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#25104A]">Alerta LDB (20-25%)</p>
              <p className="text-base font-extrabold text-[#5411B8] font-mono">{alertas}</p>
            </div>
          </div>

          <div className="bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6315D9] text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#25104A]">Crítico (&ge;25% falta)</p>
              <p className="text-base font-extrabold text-[#5411B8] font-mono">{criticos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Chamada e Acumulado */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-[#e2d9f7] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f3edff] border-b border-[#e2d9f7] text-[#5b4b86] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-12 text-center">Nº</th>
                <th className="py-3 px-4">Estudante</th>
                <th className="py-3 px-4 text-center">Chamada ({dataSelecionada})</th>
                <th className="py-3 px-4 text-center">Presenças</th>
                <th className="py-3 px-4 text-center">Faltas</th>
                <th className="py-3 px-4 text-center">Justificadas</th>
                <th className="py-3 px-4 text-center">% Frequência</th>
                <th className="py-3 px-4 text-center">Status LDB (Art. 24)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2d9f7]">
              {(turma.alunos || []).map((aluno, idx) => {
                const statusHoje = presencasDoDia[aluno.id];
                const consolidado = dadosConsolidados.find((c) => c.alunoId === aluno.id) || {
                  totalAulas: 0,
                  presencas: 0,
                  faltas: 0,
                  faltasJustificadas: 0,
                  percentual: 100,
                  statusLdb: 'regular'
                };

                return (
                  <tr key={aluno.id} className="hover:bg-[#F3EDFF]/80 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-[#5b4b86] font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-[#25104a]">
                      {aluno.nome}
                    </td>

                    {/* Botões Rápidos de Chamada do Dia */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex rounded-lg border border-[#e2d9f7] p-0.5 bg-[#f3edff]">
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => handleSetStatus(aluno.id, 'P')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                            statusHoje === 'P'
                              ? 'bg-[#6315D9] text-white shadow-xs'
                              : 'text-[#5B4B86] hover:text-[#5411B8]'
                          }`}
                          title="Presente"
                        >
                          P
                        </button>
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => handleSetStatus(aluno.id, 'F')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                            statusHoje === 'F'
                              ? 'bg-[#6315D9] text-white shadow-xs'
                              : 'text-[#5B4B86] hover:text-[#5411B8]'
                          }`}
                          title="Falta"
                        >
                          F
                        </button>
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => handleSetStatus(aluno.id, 'FJ')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                            statusHoje === 'FJ'
                              ? 'bg-[#6315D9] text-white shadow-xs'
                              : 'text-[#5B4B86] hover:text-[#5411B8]'
                          }`}
                          title="Falta Justificada (Atestado)"
                        >
                          FJ
                        </button>
                      </div>
                    </td>

                    {/* Acumulado */}
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-[#5411B8]">
                      {consolidado.presencas}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono font-bold text-[#5411B8]">
                      {consolidado.faltas}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono text-[#5411B8] font-medium">
                      {consolidado.faltasJustificadas}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono font-extrabold text-[#25104a]">
                      {consolidado.percentual}%
                    </td>

                    {/* Badge LDB */}
                    <td className="py-2.5 px-4 text-center">
                      {consolidado.statusLdb === 'regular' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7DBFD] text-[#25104A] border border-[#E2D9F7]">
                          <Check className="w-3 h-3" /> Regular
                        </span>
                      )}
                      {consolidado.statusLdb === 'alerta' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7DBFD] text-[#25104A] border border-[#B9A6EF] animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Alerta LDB
                        </span>
                      )}
                      {consolidado.statusLdb === 'critico' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7DBFD] text-[#25104A] border border-[#B9A6EF]">
                          <ShieldAlert className="w-3 h-3" /> Risco Reprovação
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
