"use client";

import { useState } from 'react';
import { TabelaNotas } from '@/components/diario/TabelaNotas';
import { TabelaFrequencia } from '@/components/diario/TabelaFrequencia';
import { DiarioDeBordo } from '@/components/diario/DiarioDeBordo';
import { ImportarSimuladoModal } from '@/components/diario/ImportarSimuladoModal';
import { ImportModal } from '@/components/diario/ImportModal';
import { confirmarTrocaContexto } from '@/utils/diario/confirmarTrocaContexto';
import { VisaoGeralTurma } from '@/components/diario/VisaoGeralTurma';
import { faixaNotaBimestral } from '@/utils/diario/coresNota';
import { MapaAnual } from '@/components/diario/MapaAnual';
import { SeletorNecessidadesDiario, alternarNecessidade } from '@/components/diario/SeletorNecessidadesDiario';
import { CamposPerfilInclusivo } from '@/components/diario/CamposPerfilInclusivo';
import { calcTotal, fmt, round2, somaMaxAtv, temNota, statusColor } from '@/utils/diario/calculos';
import { generateCadernetaPDF, exportCadernetaCSV, generateRelatorioBimestrePDF, exportBimestreCSV } from '@/lib/diario/caderneta-export';
import { Download, FileSpreadsheet, Plus, Upload, Trash2, Calendar } from 'lucide-react';

const statsByBimestre = (turma, bimestre) => {
  const b = turma.bimestres[String(bimestre)] || {};
  const { atividades = [], notas = {}, config } = b;
  const contagem = { aprovados: 0, excelentes: 0, abaixo: 0, semNota: 0 };
  turma.alunos.forEach(aluno => {
    const nota = notas[aluno.id];
    const faixa = temNota(nota, atividades) ? faixaNotaBimestral(calcTotal(nota.simulado, atividades, nota, config), config) : 'sem_nota';
    const chave = { aprovado: 'aprovados', excelente: 'excelentes', abaixo: 'abaixo', sem_nota: 'semNota' }[faixa];
    contagem[chave]++;
  });
  return contagem;
};

const StatChip = ({ label, value, color }) => (
  <div className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1 ${color}`}>
    <dt className="text-[10px] font-bold uppercase leading-4 tracking-wide opacity-80">{label}</dt>
    <dd className="order-first font-mono text-base font-bold leading-6 tracking-tight tabular-nums">{value}</dd>
  </div>
);

export const TurmaView = ({
  turma, turmas, bimestre, user, onSetNota, onImportarSimulado, onAddAtv, onRemoveAtv, onUpdateAtvMax,
  onAddAlunos, onRemoveAluno, onRemoveAlunos, onUpdateConfig, onSetRecuperacao,
  onClearAtividadesNota, onClearAtividadesTurma, onAddAlunoManual, onUpdateAluno, onRemoveTurma,
  onClearSimuladoNota, onClearSimuladoTurma, onSalvarFrequencia, onSalvarOcorrencias, onPublicar
}) => {
  const [showImport, setShowImport] = useState(false);
  const [showImportSimulado, setShowImportSimulado] = useState(false);
  const [view, setView] = useState('bimestre');
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualNome, setManualNome] = useState('');
  const [manualData, setManualData] = useState('');
  const [manualNec, setManualNec] = useState([]);
  const [manualNivel, setManualNivel] = useState(1);
  const [manualHiperfoco, setManualHiperfoco] = useState('');
  const [manualObservacoes, setManualObservacoes] = useState('');

  const stats = statsByBimestre(turma, bimestre);

  const handleSetNota = (alunoId, campo, valor) => onSetNota(turma.id, bimestre, alunoId, campo, valor);
  const handleAddAtv = (nome, max) => onAddAtv(turma.id, bimestre, nome, max);
  const handleRemoveAtv = (atvId) => onRemoveAtv(turma.id, bimestre, atvId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <section aria-label="Cabeçalho da turma" className="shrink-0 border-b border-[#dce0f0] bg-white px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#101942] tracking-tight font-head">Turma {turma.nome}</h1>
              <span className="text-xs text-[#6070a0] font-mono font-semibold">({turma.alunos.length} alunos)</span>
              {view === 'bimestre' && (
                <span className="px-2.5 py-0.5 bg-[#fff2f6] border border-[#fde4ec] rounded-full text-[10px] font-extrabold uppercase tracking-wider text-[#d40840]">{bimestre}º Bimestre</span>
              )}
              {view === 'anual' && (
                <span className="px-2.5 py-0.5 bg-[#fff2f6] border border-[#fde4ec] rounded-full text-[10px] font-extrabold uppercase tracking-wider text-[#d40840]">Mapa Anual</span>
              )}
              {view === 'frequencia' && (
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Frequência Escolar & LDB</span>
              )}
              {view === 'ocorrencias' && (
                <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-purple-700">Diário de Bordo & Ocorrências</span>
              )}
            </div>
            <nav aria-label="Áreas da turma" className="flex min-w-0 flex-wrap items-center bg-[#f7f8fc] p-1 rounded-xl border border-[#dce0f0] shadow-2xs">
              <button 
                onClick={() => confirmarTrocaContexto() && setView('bimestre')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'bimestre' ? 'bg-[#101942] text-white shadow-2xs' : 'text-[#6070a0] hover:text-[#101942]'
                }`}
              >
                Notas
              </button>
              <button 
                onClick={() => confirmarTrocaContexto() && setView('frequencia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'frequencia' ? 'bg-[#101942] text-white shadow-2xs' : 'text-[#6070a0] hover:text-[#101942]'
                }`}
              >
                Frequência
              </button>
              <button 
                onClick={() => confirmarTrocaContexto() && setView('ocorrencias')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'ocorrencias' ? 'bg-[#101942] text-white shadow-2xs' : 'text-[#6070a0] hover:text-[#101942]'
                }`}
              >
                Ocorrências
              </button>
              <button 
                onClick={() => confirmarTrocaContexto() && setView('anual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  view === 'anual' ? 'bg-[#101942] text-white shadow-2xs' : 'text-[#6070a0] hover:text-[#101942]'
                }`}
              >
                Resumo anual
              </button>
            </nav>
        </div>
        <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {view === 'bimestre' && (
              <dl aria-label="Resumo de desempenho" className="flex flex-wrap items-center gap-1.5">
                <StatChip label="Excelentes" value={stats.excelentes} color="border-green-200 text-green-700 bg-green-50" />
                <StatChip label="Aprovados" value={stats.aprovados} color="border-blue-200 text-blue-700 bg-blue-50" />
                <StatChip label="Abaixo da média" value={stats.abaixo} color="border-[#fecaca] text-[#991b1b] bg-[#fef2f2]" />
                {stats.semNota > 0 && <StatChip label="Sem nota" value={stats.semNota} color="border-[#dce0f0] text-[#6070a0] bg-[#f7f8fc]" />}
              </dl>
            )}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Botões de Exportação */}
            {view === 'bimestre' && <details className="relative text-xs"><summary className="cursor-pointer border rounded-xl p-2 font-bold">Relatório do {bimestre}º bimestre</summary><div className="absolute top-full right-0 z-30 w-52 bg-white border rounded-xl shadow p-3 space-y-3"><p>Somente turma {turma.nome}, {bimestre}º bimestre.</p><button type="button" onClick={() => generateRelatorioBimestrePDF(turma, bimestre, user?.email)} className="block underline">Baixar PDF do bimestre</button><button type="button" onClick={() => exportBimestreCSV(turma, bimestre)} className="block underline">Baixar CSV do bimestre</button></div></details>}

            <button
              onClick={() => generateCadernetaPDF(turma, user?.email)}
              className="btn-brand-ghost px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Baixar Caderneta Oficial em PDF"
            >
              <Download size={13} className="text-[#f60c49]" />
              <span>Caderneta anual PDF</span>
            </button>

            <button
              onClick={() => exportCadernetaCSV(turma)}
              className="btn-brand-ghost px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Exportar notas em planilha Excel/CSV"
            >
              <FileSpreadsheet size={13} className="text-[#166534]" />
              <span>CSV anual</span>
            </button>

            <button 
              onClick={() => setShowImport(true)}
              className="btn-brand-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Upload size={13} />
              <span>Importar Alunos</span>
            </button>

            {view === 'bimestre' && onImportarSimulado && (
              <button type="button" onClick={() => setShowImportSimulado(true)} className="btn-brand-navy px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Upload size={13} />
                <span>Importar Simulado</span>
              </button>
            )}

            {onRemoveTurma && (
              <button 
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja remover a turma ${turma.nome}?`)) onRemoveTurma(turma.id);
                }}
                className="p-2 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] rounded-xl transition-all"
                title="Remover turma"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <VisaoGeralTurma turma={turma} bimestre={bimestre} onAbrir={area => confirmarTrocaContexto() && (area === 'publicar' ? onPublicar?.() : setView(area))} />
        {turma.alunos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center max-w-md mx-auto">
            <div className="text-6xl opacity-20">📃</div>
            <p className="text-slate-400">Nenhum aluno cadastrado nesta turma.</p>
            {!showAddManual ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button onClick={() => setShowImport(true)} className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 rounded-xl text-white text-sm font-medium transition-all">
                  Importar lista de alunos
                </button>
                <button onClick={() => setShowAddManual(true)} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-all">
                  Cadastrar manualmente
                </button>
              </div>
            ) : (
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-2 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-slate-950 text-left">Cadastrar Aluno</h3>
                <div className="flex flex-col gap-2">
                  <input
                    value={manualNome}
                    onChange={(e) => setManualNome(e.target.value)}
                    placeholder="Nome completo do aluno"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all"
                  />
                  <input
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Data de nascimento (ddMM)"
                    maxLength={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all font-mono text-center"
                  />
                  <SeletorNecessidadesDiario
                    selecionadas={manualNec}
                    onToggle={(id) => setManualNec((prev) => alternarNecessidade(prev, id))}
                    idPrefix="manual-nec"
                  />
                  <CamposPerfilInclusivo
                    nivelSuporte={manualNivel}
                    onChangeNivel={setManualNivel}
                    hiperfoco={manualHiperfoco}
                    onChangeHiperfoco={setManualHiperfoco}
                    observacoes={manualObservacoes}
                    onChangeObservacoes={setManualObservacoes}
                    idPrefix="manual-perfil"
                  />
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => {
                      setShowAddManual(false);
                      setManualNome('');
                      setManualData('');
                      setManualNec([]);
                      setManualNivel(1);
                      setManualHiperfoco('');
                      setManualObservacoes('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-medium transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (!manualNome.trim()) return;
                      const birth = manualData.replace(/\D/g, '').slice(0, 4);
                      onAddAlunoManual(turma.id, {
                        nome: manualNome.trim(),
                        ...(birth.length === 4 ? { dataNascimento: birth } : {}),
                        ...(manualNec.length > 0 ? { necessidades: manualNec } : {}),
                        nivelSuporte: manualNivel,
                        ...(manualHiperfoco.trim() ? { hiperfoco: manualHiperfoco.trim() } : {}),
                        ...(manualObservacoes.trim() ? { observacoes: manualObservacoes.trim() } : {})
                      });
                      setManualNome('');
                      setManualData('');
                      setManualNec([]);
                      setManualNivel(1);
                      setManualHiperfoco('');
                      setManualObservacoes('');
                      setShowAddManual(false);
                    }}
                    disabled={!manualNome.trim()}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-medium transition-all"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : view === 'frequencia' ? (
          <TabelaFrequencia
            turma={turma}
            user={user}
            onSalvarFrequencia={onSalvarFrequencia}
          />
        ) : view === 'ocorrencias' ? (
          <DiarioDeBordo
            turma={turma}
            onSalvarOcorrencias={onSalvarOcorrencias}
          />
        ) : view === 'anual' ? (
          <MapaAnual turma={turma} onSetRecuperacao={onSetRecuperacao} />
        ) : (
          <TabelaNotas
            turma={turma} bimestre={bimestre} onSetNota={handleSetNota}
            onAddAtv={handleAddAtv} onRemoveAtv={handleRemoveAtv}
            onRemoveAluno={onRemoveAluno} onRemoveAlunos={onRemoveAlunos}
            onAddAlunoManual={(dados) => onAddAlunoManual(turma.id, dados)}
            onUpdateAluno={onUpdateAluno}
            onImportarSimulado={onImportarSimulado}
            onUpdateConfig={(cfg) => onUpdateConfig(turma.id, bimestre, cfg)}
            onClearAtividadesNota={onClearAtividadesNota}
            onClearAtividadesTurma={onClearAtividadesTurma}
            onClearSimuladoNota={onClearSimuladoNota}
            onClearSimuladoTurma={onClearSimuladoTurma}
            user={user}
          />
        )}
      </div>

      {showImportSimulado && (
        <ImportarSimuladoModal key={`${turma.id}-${bimestre}`} turma={turma} bimestre={bimestre}
          onConfirm={registros => onImportarSimulado(turma.id, bimestre, registros)}
          onClose={() => setShowImportSimulado(false)} />
      )}
      {showImport && (
        <ImportModal turma={turma} onConfirm={(nomes) => onAddAlunos(turma.id, nomes)} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
};
