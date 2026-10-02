"use client";

import { useState, useMemo } from 'react';
import { Check, X, AlertTriangle, ShieldAlert, Sparkles, Save, Calendar, Users, Award } from 'lucide-react';
import {
  marcarPresencaTodos,
  consolidarFrequenciaTurma
} from '@/dominio/diario/frequenciaEscolar';

export function TabelaFrequencia({ turma, onSalvarFrequencia, user }) {
  const hojeIso = new Date().toISOString().slice(0, 10);
  const [dataSelecionada, setDataSelecionada] = useState(hojeIso);
  const [quantidadeAulasDia, setQuantidadeAulasDia] = useState(2);
  const [salvando, setSalvando] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Registro de chamadas acumuladas na turma
  const frequenciasTurma = turma.frequencias || {};

  // Estado local das presenças do dia selecionado
  const [presencasDoDia, setPresencasDoDia] = useState(() => {
    const reg = frequenciasTurma[hojeIso];
    if (reg?.presencas) return { ...reg.presencas };
    // Por padrão, inicializa todos como presentes
    return marcarPresencaTodos(turma.alunos || [], 'P');
  });

  // Atualiza o estado local quando a data selecionada mudar
  const handleMudarData = (novaData) => {
    setDataSelecionada(novaData);
    const reg = frequenciasTurma[novaData];
    if (reg) {
      setQuantidadeAulasDia(Number(reg.quantidadeAulas) || 2);
      setPresencasDoDia(reg.presencas || {});
    } else {
      setPresencasDoDia(marcarPresencaTodos(turma.alunos || [], 'P'));
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Alterna o status de um aluno no dia selecionado ('P' | 'F' | 'FJ')
  const handleSetStatus = (alunoId, novoStatus) => {
    setPresencasDoDia((prev) => ({
      ...prev,
      [alunoId]: novoStatus
    }));
  };

  // Marca todos com o mesmo status em 1 clique
  const handleMarcarTodos = (status) => {
    setPresencasDoDia(marcarPresencaTodos(turma.alunos || [], status));
    showToast(`Todos marcados como ${status === 'P' ? 'Presentes' : status === 'F' ? 'Ausentes' : 'Justificados'}!`);
  };

  // Salva a chamada do dia
  const handleSalvarChamada = async () => {
    setSalvando(true);
    try {
      const novoRegistro = {
        quantidadeAulas: Number(quantidadeAulasDia) || 1,
        presencas: presencasDoDia,
        atualizadoEm: new Date().toISOString()
      };

      const novasFrequencias = {
        ...frequenciasTurma,
        [dataSelecionada]: novoRegistro
      };

      await onSalvarFrequencia?.(turma.id, novasFrequencias);
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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Toast flutuante */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#101942] text-white px-4 py-2 rounded-xl shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-3">
          {toastMsg}
        </div>
      )}

      {/* Barra de Ações da Chamada */}
      <div className="bg-white border-b border-[#dce0f0] p-4 sm:p-5 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6070a0] mb-1">Data da Aula</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => handleMudarData(e.target.value)}
                  className="bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-1.5 text-xs text-[#101942] font-bold outline-none focus:ring-1 focus:ring-[#f60c49]"
                />
                <button
                  type="button"
                  onClick={() => handleMudarData(hojeIso)}
                  className="px-2.5 py-1.5 bg-[#f7f8fc] hover:bg-slate-200 border border-[#dce0f0] rounded-xl text-[11px] font-semibold text-[#6070a0] transition-colors"
                >
                  Hoje
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6070a0] mb-1">Aulas no Dia</label>
              <select
                value={quantidadeAulasDia}
                onChange={(e) => setQuantidadeAulasDia(Number(e.target.value))}
                className="bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-1.5 text-xs text-[#101942] font-bold outline-none focus:ring-1 focus:ring-[#f60c49]"
              >
                <option value={1}>1 aula</option>
                <option value={2}>2 aulas (geminadas)</option>
                <option value={3}>3 aulas</option>
                <option value={4}>4 aulas</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleMarcarTodos('P')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Todos Presentes (1 clique)
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

        {/* Cards de Resumo LDB */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
          <div className="bg-[#f7f8fc] border border-[#dce0f0] rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#101942]/10 text-[#101942] flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6070a0]">Aulas Dadas</p>
              <p className="text-base font-extrabold text-[#101942] font-mono">{totalAulasGerais}</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Regulares (&ge;80%)</p>
              <p className="text-base font-extrabold text-emerald-700 font-mono">{regulares} / {totalAlunos}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Alerta LDB (20-25%)</p>
              <p className="text-base font-extrabold text-amber-700 font-mono">{alertas}</p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Crítico (&ge;25% falta)</p>
              <p className="text-base font-extrabold text-rose-700 font-mono">{criticos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Chamada e Acumulado */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-[#dce0f0] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f7f8fc] border-b border-[#dce0f0] text-[#6070a0] font-bold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-[#dce0f0]">
              {(turma.alunos || []).map((aluno, idx) => {
                const statusHoje = presencasDoDia[aluno.id] || 'P';
                const consolidado = dadosConsolidados.find((c) => c.alunoId === aluno.id) || {
                  totalAulas: 0,
                  presencas: 0,
                  faltas: 0,
                  faltasJustificadas: 0,
                  percentual: 100,
                  statusLdb: 'regular'
                };

                return (
                  <tr key={aluno.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-[#6070a0] font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-[#101942]">
                      {aluno.nome}
                    </td>

                    {/* Botões Rápidos de Chamada do Dia */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="inline-flex rounded-lg border border-[#dce0f0] p-0.5 bg-[#f7f8fc]">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(aluno.id, 'P')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                            statusHoje === 'P'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                          title="Presente"
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(aluno.id, 'F')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                            statusHoje === 'F'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                          title="Falta"
                        >
                          F
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(aluno.id, 'FJ')}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                            statusHoje === 'FJ'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                          title="Falta Justificada (Atestado)"
                        >
                          FJ
                        </button>
                      </div>
                    </td>

                    {/* Acumulado */}
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                      {consolidado.presencas}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700">
                      {consolidado.faltas}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono text-amber-700 font-medium">
                      {consolidado.faltasJustificadas}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono font-extrabold text-[#101942]">
                      {consolidado.percentual}%
                    </td>

                    {/* Badge LDB */}
                    <td className="py-2.5 px-4 text-center">
                      {consolidado.statusLdb === 'regular' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" /> Regular
                        </span>
                      )}
                      {consolidado.statusLdb === 'alerta' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Alerta LDB
                        </span>
                      )}
                      {consolidado.statusLdb === 'critico' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
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
