"use client";

import { useState, useEffect } from 'react';
import { PerfilAlunoDiario } from '@/components/diario/PerfilAlunoDiario';
import { NumCell } from '@/components/diario/NumCell';
import { BadgeNecessidades, SeletorNecessidadesDiario, alternarNecessidade } from '@/components/diario/SeletorNecessidadesDiario';
import { CamposPerfilInclusivo } from '@/components/diario/CamposPerfilInclusivo';
import { calcTotal, fmt, somaMaxAtv, round2, temNota, titleCase } from '@/utils/diario/calculos';
import { estiloNotaBimestral } from '@/utils/diario/coresNota';
import { gerarLoginAluno, selecionarLoginExibido } from '@/utils/diario/loginAluno';
import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';
import { carregarHistoricoFeedbackAluno } from '@/infraestrutura/atividades/historicoFeedback';
import { validarCriterios, lerNumeroNota, prepararColagemSimulado } from '@/dominio/diario/criterios';
import { prepararImportacaoSimulado } from '@/dominio/diario/importacaoSimulado';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AddAlunoForm = ({ onAdd }) => {
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [nec, setNec] = useState([]);
  const [showNec, setShowNec] = useState(false);

  const submit = () => {
    if (!nome.trim()) return;
    const dataNascimento = data.replace(/\D/g, '').slice(0, 4);
    onAdd({
      nome: nome.trim(),
      ...(dataNascimento.length === 4 ? { dataNascimento } : {}),
      ...(nec.length > 0 ? { necessidades: nec } : {})
    });
    setNome('');
    setData('');
    setNec([]);
    setShowNec(false);
  };

  return (
    <div className="flex flex-col gap-2 sm:gap-3 mt-3 pt-3 border-t border-[#d5e3dc]">
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          value={nome} onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Nome completo do aluno"
          className="flex-1 bg-[#f3f7f5] border border-[#d5e3dc] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#123c3a] placeholder-[#566f65] outline-none focus:bg-white focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e] transition-all"
        />
        <input
          value={data} onChange={(e) => setData(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="ddMM (Nascimento)" maxLength={4}
          className="w-24 sm:w-36 bg-[#f3f7f5] border border-[#d5e3dc] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#123c3a] placeholder-[#566f65] outline-none focus:bg-white focus:ring-2 focus:ring-[#0f766e]/30 focus:border-[#0f766e] transition-all font-mono text-center"
        />
        <button
          onClick={() => setShowNec((v) => !v)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            nec.length > 0
              ? 'bg-[#f3f8f5] border-[#0f766e] text-[#0b5f59]'
              : 'bg-[#f3f7f5] border-[#d5e3dc] text-[#4f6b63] hover:border-[#0f766e]/40'
          }`}
          title="Necessidades / PCD do aluno"
        >
          🏷{nec.length > 0 ? ` ${nec.length}` : ''}
        </button>
        <button
          onClick={submit} disabled={!nome.trim()}
          className="px-4 py-2 btn-brand-primary disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs sm:text-sm font-bold transition-all whitespace-nowrap shadow-xs"
        >
          + Adicionar Aluno
        </button>
      </div>
      {showNec && (
        <SeletorNecessidadesDiario
          selecionadas={nec}
          onToggle={(id) => setNec((prev) => alternarNecessidade(prev, id))}
          idPrefix="quick-nec"
        />
      )}
    </div>
  );
};

const AddAtvForm = ({ onAdd, somaAtual, maxAtv }) => {
  const [nome, setNome] = useState('');
  const [max, setMax] = useState('');
  const dispLeft = round2(maxAtv - somaAtual);
  const [erro, setErro] = useState('');

  const submit = () => {
    if (!nome.trim()) return;
    let m;
    try { m = lerNumeroNota(max, 0.01, maxAtv); if (m === '') throw new Error('Informe a nota máxima.'); } catch (error) { setErro(error.message); return; }
    onAdd(nome.trim(), m); setErro('');
    setNome('');
    setMax('');
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 mt-4">
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da atividade"
        className="flex-1 bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-[#123C3A] placeholder-[#566F65] outline-none focus:bg-white focus:ring-1 focus:ring-[#0F766E]/50 transition-all" />
      <input value={max} onChange={(e) => setMax(e.target.value)} placeholder={`máx: ${fmt(dispLeft)}`}
        className="w-20 sm:w-40 bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-mono text-[#123C3A] placeholder-[#566F65] outline-none focus:bg-white focus:ring-1 focus:ring-[#0F766E]/50 transition-all text-center" />
      <button onClick={submit}
        className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[#0F766E] hover:bg-[#0B5F59] hover:scale-[1.03] active:scale-[0.97] rounded-lg text-xs sm:text-sm text-white font-semibold transition-all whitespace-nowrap">
        + Adicionar
      </button>
      {erro && <span role="alert" className="text-xs text-[#0B5F59]">{erro}</span>}
    </div>
  );
};

export const TabelaNotas = ({
  turma, bimestre, onSetNota, onAddAtv, onRemoveAtv, onRemoveAluno, onRemoveAlunos,
  onUpdateConfig, onClearAtividadesNota, onClearAtividadesTurma, onUpdateAluno, onAddAlunoManual,
  onClearSimuladoNota, onClearSimuladoTurma, onImportarSimulado, user, alunoInicialId
}) => {
  const [cadastro, setCadastro] = useState(null);
  const [erroCadastro, setErroCadastro] = useState('');
  const [busca, setBusca] = useState(() => turma.alunos?.find(a => a.id === alunoInicialId)?.nome || '');
  const [filtro, setFiltro] = useState('todos');
  const [showAvancadas, setShowAvancadas] = useState(false);
  const [erroConfig, setErroConfig] = useState('');
  const [previaConfig, setPreviaConfig] = useState(null);
  const [showColagem, setShowColagem] = useState(false);
  const [colagem, setColagem] = useState('');
  const [previaColagem, setPreviaColagem] = useState(null);
  const [erroColagem, setErroColagem] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(null);
  const [editingNeeds, setEditingNeeds] = useState(null);
  const [needsDraft, setNeedsDraft] = useState([]);
  const [nivelDraft, setNivelDraft] = useState(1);
  const [hiperfocoDraft, setHiperfocoDraft] = useState('');
  const [observacoesDraft, setObservacoesDraft] = useState('');
  const [loginsArmazenados, setLoginsArmazenados] = useState({});

  const [historicoFicha, setHistoricoFicha] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [alunoFichaModal, setAlunoFichaModal] = useState(null);
  const [incluirCIDNaExportacao, setIncluirCIDNaExportacao] = useState(false);
  const [erroFichaPDF, setErroFichaPDF] = useState('');
  const [gerandoFichaPDF, setGerandoFichaPDF] = useState(false);

  useEffect(() => {
    if (!alunoFichaModal) return;
    let ativo = true;
    carregarHistoricoFeedbackAluno(user?.uid, turma.id, alunoFichaModal.id)
      .then(historico => { if (ativo) setHistoricoFicha(historico); })
      .catch(() => { if (ativo) setErroFichaPDF('Falha ao carregar feedback. A exportação tentará carregar novamente.'); })
      .finally(() => { if (ativo) setCarregandoHistorico(false); });
    return () => { ativo = false; };
  }, [alunoFichaModal, user?.uid, turma.id]);

  const handleConfirmarExportFicha360 = async (incluirCID) => {
    if (!alunoFichaModal) return;
    setGerandoFichaPDF(true);
    setErroFichaPDF('');
    try {
      const historicoAtividades = await carregarHistoricoFeedbackAluno(user?.uid, turma.id, alunoFichaModal.id);
      await generateFichaAluno360PDF({
        historicoAtividades,
        aluno: alunoFichaModal,
        turma,
        frequenciasTurma: turma?.frequencias,
        professorNome: user?.displayName || user?.email || 'Professor(a)',
        incluirDiagnosticoClinico: incluirCID,
      });
      setAlunoFichaModal(null);
    } catch (err) {
      console.error('Erro ao emitir Ficha 360 do aluno:', err);
      setErroFichaPDF('Não foi possível carregar o relatório completo. Tente novamente.');
    } finally {
      setGerandoFichaPDF(false);
    }
  };


  // RN-45 — exibidor canônico: busca os logins ARMAZENADOS no Firestore por nome,
  // para exibir exatamente o que a rota de login aceita (inclusive legados).
  useEffect(() => {
    let cancelado = false;
    const carregarLogins = async () => {
      const nomes = [...new Set((turma?.alunos || []).map((al) => al.nome).filter(Boolean))];
      if (nomes.length === 0) {
        if (!cancelado) setLoginsArmazenados({});
        return;
      }
      const mapa = {};
      for (let i = 0; i < nomes.length; i += 30) {
        const lote = nomes.slice(i, i + 30);
        const snap = await getDocs(query(collection(db, 'alunoLogin'), where('nome', 'in', lote)));
        snap.forEach((d) => {
          const v = d.data();
          if (v?.nome && v?.login) {
            if (!mapa[v.nome]) mapa[v.nome] = [];
            mapa[v.nome].push(v.login);
          }
        });
      }
      if (!cancelado) setLoginsArmazenados(mapa);
    };
    carregarLogins().catch(() => { /* offline/erro: exibe o login canônico calculado */ });
    return () => { cancelado = true; };
  }, [turma?.alunos]);

  const bData = turma.bimestres[String(bimestre)] || { atividades: [], notas: {}, config: {} };
  const { atividades, notas, config = {} } = bData;

  const [cfgSimLanca, setCfgSimLanca] = useState(config?.simuladoMaxLanca ?? 5);
  const [cfgSimFinal, setCfgSimFinal] = useState(config?.simuladoMaxFinal ?? 5);
  const [cfgAtvFinal, setCfgAtvFinal] = useState(config?.atividadesMaxFinal ?? 5);
  const [cfgAprov, setCfgAprov] = useState(config?.mediaAprovacao ?? 5);
  const [cfgRecup, setCfgRecup] = useState(config?.mediaRecuperacao ?? 4.99);

  const alunosVisiveis = turma.alunos.filter(al => {
    const nome = al.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const texto = busca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!nome.includes(texto)) return false;
    const nota = notas[al.id] || {};
    const pendente = nota.simulado == null || nota.simulado === '' || atividades.some(a => nota[a.id] == null || nota[a.id] === '');
    return filtro === 'pendentes' ? pendente : filtro === 'abaixo' ? temNota(nota, atividades) && calcTotal(nota.simulado, atividades, nota, config) < Number(config.mediaAprovacao ?? 5) : true;
  });
  const somaMaxima = somaMaxAtv(atividades);
  const atvMax = config?.atividadesMaxFinal !== undefined ? Number(config.atividadesMaxFinal) : 5;
  const excede = somaMaxima > atvMax;

  const totaisTurma = turma.alunos
    .filter((al) => temNota(notas[al.id], atividades))
    .map((al) => { const nota = notas[al.id] || {}; return calcTotal(nota.simulado, atividades, nota, config); });

  const media = totaisTurma.length > 0 ? round2(totaisTurma.reduce((a, b) => a + b, 0) / totaisTurma.length) : null;

  const handleToggleSelectAll = () => {
    const ids = alunosVisiveis.map(al => al.id);
    if (ids.every(id => selectedIds.includes(id))) setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    else setSelectedIds(prev => [...new Set([...prev, ...ids])]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleRemoveSingle = (alunoId, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o aluno ${titleCase(nome)}?`)) {
      onRemoveAluno(turma.id, alunoId);
      setSelectedIds((prev) => prev.filter((id) => id !== alunoId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Tem certeza que deseja excluir os ${selectedIds.length} alunos selecionados?`)) {
      onRemoveAlunos(turma.id, selectedIds);
      setSelectedIds([]);
    }
  };

  const safeClear = (fn, ...args) => {
    try { fn(...args); } catch (e) { console.error('Erro ao limpar:', e); }
  };

  const handleClearSingleActivities = (alunoId, nome) => {
    if (window.confirm(`Apagar apenas as notas de atividades do aluno ${titleCase(nome)}?`)) {
      safeClear(onClearAtividadesNota, turma.id, bimestre, alunoId);
    }
  };

  const handleClearBulkActivities = () => {
    if (window.confirm("Apagar notas de TODAS as atividades de TODOS os alunos neste bimestre?")) {
      safeClear(onClearAtividadesTurma, turma.id, bimestre);
    }
  };

  const handleClearSingleSimulado = (alunoId, nome) => {
    if (window.confirm(`Apagar apenas a nota do simulado do aluno ${titleCase(nome)}?`)) {
      safeClear(onClearSimuladoNota, turma.id, bimestre, alunoId);
    }
  };

  const handleClearBulkSimulado = () => {
    if (window.confirm("Apagar as notas de SIMULADO de TODOS os alunos neste bimestre?")) {
      safeClear(onClearSimuladoTurma, turma.id, bimestre);
    }
  };

  const handleSaveConfig = () => {
    try {
      const next = validarCriterios({ ...config, simuladoMaxLanca: cfgSimLanca, simuladoMaxFinal: cfgSimFinal, atividadesMaxFinal: cfgAtvFinal, mediaAprovacao: cfgAprov, mediaRecuperacao: cfgRecup });
      setPreviaConfig(next); setErroConfig('');
    } catch (error) { setErroConfig(error.message); setPreviaConfig(null); }
  };
  const conferirColagem = () => {
    try { setPreviaColagem(prepararImportacaoSimulado(prepararColagemSimulado(colagem), turma, bimestre)); setErroColagem(''); }
    catch (error) { setErroColagem(error.message); setPreviaColagem(null); }
  };
  const aplicarColagem = async () => {
    try {
      const registros = previaColagem.filter(l => l.situacao === 'pronto').map(l => ({ nome: l.nome, nota: l.nota }));
      await onImportarSimulado(turma.id, bimestre, registros);
      setShowColagem(false); setPreviaColagem(null); setColagem('');
    } catch { setErroColagem('Não foi possível salvar a colagem. Confira o salvamento e tente novamente.'); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <label className="text-xs">Buscar aluno<input aria-label="Buscar aluno" value={busca} onChange={e => setBusca(e.target.value)} className="block rounded-lg border p-2" placeholder="Nome do aluno" /></label>
        <label className="text-xs">Filtrar notas<select aria-label="Filtrar notas" value={filtro} onChange={e => setFiltro(e.target.value)} className="block rounded-lg border p-2"><option value="todos">Todos</option><option value="pendentes">Notas incompletas</option><option value="abaixo">Abaixo da média</option></select></label>
        {onImportarSimulado && <button className="border rounded-lg p-2 text-xs font-semibold" onClick={() => setShowColagem(v => !v)}>Colar notas do simulado</button>}
        <button className="border rounded-lg p-2 text-xs" onClick={() => setShowAvancadas(v => !v)}>Opções avançadas</button>
      </div>
      <p className="text-xs mb-3" aria-label="Legenda de notas"><span className="text-[#0F766E]">Vermelho: abaixo de {fmt(config.mediaAprovacao ?? 5)}</span> · <span className="text-[#0F766E]">Azul: a partir da média, abaixo de 8</span> · <span className="text-[#0F766E]">Verde: a partir de {fmt(Math.max(8, Number(config.mediaAprovacao ?? 5)))}</span>. Situação semestral/anual disponível no Resumo anual.</p>
      {showColagem && <section className="border rounded-xl p-4 mb-4 space-y-3" aria-label="Colar notas">
        <p className="text-sm">{turma.nome} · {bimestre}º bimestre · Somente simulado. Nome completo e nota separados por tabulação ou ponto e vírgula. Notas existentes são preservadas.</p>
        <textarea aria-label="Nomes e notas" className="w-full border rounded p-2" value={colagem} onChange={e => { setColagem(e.target.value); setPreviaColagem(null); }} placeholder={'Ana Lima\t4,50'} />
        <button className="border rounded px-3 py-2" onClick={conferirColagem}>Conferir colagem</button>
        {erroColagem && <p role="alert" className="text-[#0B5F59]">{erroColagem}</p>}
        {previaColagem && <><ul>{previaColagem.map((l, i) => <li key={i}>{l.alunoNome || l.nome} — {fmt(l.nota)} — {({ pronto: 'Pronto para importar', nota_existente: 'Nota existente preservada', ambiguo: 'Nome ambíguo', duplicado: 'Nome duplicado', nao_encontrado: 'Nome não encontrado', nota_invalida: 'Nota inválida', fora_da_escala: 'Fora da escala' })[l.situacao]}</li>)}</ul><button disabled={!previaColagem.some(l => l.situacao === 'pronto')} className="border rounded px-3 py-2 disabled:opacity-50" onClick={aplicarColagem}>Aplicar {previaColagem.filter(l => l.situacao === 'pronto').length} nota(s)</button></>}
      </section>}
      {/* Cabeçalho bimestre */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-[#566F65]">
            Soma máx. atividades: <span className={`font-mono font-semibold ${excede ? 'text-[#0F766E]' : 'text-[#123C3A]'}`}>{fmt(somaMaxima)} / {fmt(atvMax)}</span>
          </span>
          {excede && <span className="text-xs bg-[#F3F8F5] border border-[#D5E3DC] text-[#0F766E] rounded-full px-2 py-0.5 font-semibold">⚠ excede {fmt(atvMax)} pts</span>}
          {showAvancadas && selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-[#0F766E] hover:bg-[#0F766E] text-white text-xs px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium">
              🗑 Excluir selecionados ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F8F5] hover:bg-[#F3F7F5] border border-[#D5E3DC] rounded-lg text-xs text-[#4F6B63] transition-colors font-medium">
            ⚙ Critérios
          </button>
          {showAvancadas && turma.alunos.length > 0 && atividades.length > 0 && (
            <button onClick={handleClearBulkActivities} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F8F5] text-[#0F766E] hover:text-[#0F766E] border border-[#D5E3DC] hover:bg-[#DAEBE5] rounded-lg text-xs transition-colors font-medium">
              🧹 Limpar Atividades
            </button>
          )}
          {showAvancadas && turma.alunos.length > 0 && (
            <button onClick={handleClearBulkSimulado} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F3F8F5] text-[#0F766E] hover:text-[#0B5F59] border border-[#D5E3DC] hover:bg-[#DAEBE5] rounded-lg text-xs transition-colors font-medium">
              🧪 Limpar Simulados
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {media !== null && (
            <div className="text-sm text-[#566F65]">
              Média turma: <span className={`font-mono font-bold ${estiloNotaBimestral(media, config).split(' ')[0]}`}>{fmt(media)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Painel de Configurações */}
      {showConfig && (
        <div className="glass-panel border border-[#D5E3DC] rounded-2xl p-5 mb-5 grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="cfgSimLanca" className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Simulado Máx (Lançamento)</label>
            <input id="cfgSimLanca" type="text" value={cfgSimLanca} onChange={(e) => { setCfgSimLanca(e.target.value); setPreviaConfig(null); }}
              className="w-full bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-3 py-1.5 text-xs text-[#123C3A] outline-none focus:ring-1 focus:ring-[#0F766E]/50 transition-all font-mono" />
          </div>
          <div>
            <label htmlFor="cfgSimFinal" className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Peso Simulado Final</label>
            <input id="cfgSimFinal" type="text" value={cfgSimFinal} onChange={(e) => { setCfgSimFinal(e.target.value); setPreviaConfig(null); }}
              className="w-full bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-3 py-1.5 text-xs text-[#123C3A] outline-none focus:ring-1 focus:ring-[#0F766E]/50 transition-all font-mono" />
          </div>
          <div>
            <label htmlFor="cfgAtvFinal" className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Peso Atividades Final</label>
            <input id="cfgAtvFinal" type="text" value={cfgAtvFinal} onChange={(e) => { setCfgAtvFinal(e.target.value); setPreviaConfig(null); }}
              className="w-full bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-3 py-1.5 text-xs text-[#123C3A] outline-none focus:ring-1 focus:ring-[#0F766E]/50 transition-all font-mono" />
          </div>
          <div>
            <label htmlFor="cfgAprov" className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Média para aprovação</label>
            <input id="cfgAprov" type="text" value={cfgAprov} onChange={(e) => { setCfgAprov(e.target.value); setPreviaConfig(null); }}
              className="w-full bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-3 py-1.5 text-xs text-[#123C3A] outline-none focus:ring-1 focus:ring-[#0F766E]/50 transition-all font-mono" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="cfgRecup" className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Limite de recuperação</label>
              <input id="cfgRecup" type="text" value={cfgRecup} onChange={(e) => { setCfgRecup(e.target.value); setPreviaConfig(null); }}
                className="w-full bg-[#F3F8F5] border border-[#D5E3DC] rounded-lg px-3 py-1.5 text-xs text-[#123C3A] outline-none focus:ring-1 focus:ring-[#0F766E]/50 transition-all font-mono" />
            </div>
            <button onClick={handleSaveConfig} className="bg-[#0F766E] hover:bg-[#0B5F59] text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-all h-[32px] self-end">
              Conferir critérios
            </button>
          </div>
          {erroConfig && <p role="alert" className="col-span-full text-[#0B5F59] text-sm">{erroConfig}</p>}
          <p className="col-span-full text-xs">Simulado: nota ÷ escala × peso. Atividades: soma das notas, limitada ao teto; não são proporcionalizadas.</p>
          {previaConfig && <div className="col-span-full border rounded-xl p-3 text-sm space-y-2">
            <p>Prévia: metade do simulado ({fmt(previaConfig.simuladoMaxLanca / 2)}) contribui {fmt(previaConfig.simuladoMaxFinal / 2)}; atividades somam até {fmt(previaConfig.atividadesMaxFinal)}. Total máximo: {fmt(previaConfig.simuladoMaxFinal + previaConfig.atividadesMaxFinal)}.</p>
            <p>{turma.alunos.filter(al => temNota(notas[al.id], atividades) && calcTotal(notas[al.id]?.simulado, atividades, notas[al.id], config) !== calcTotal(notas[al.id]?.simulado, atividades, notas[al.id], previaConfig)).length} aluno(s) terão o total recalculado. Lançamentos existentes serão preservados.</p>
            {turma.alunos.some(al => Number(notas[al.id]?.simulado) > previaConfig.simuladoMaxLanca) && <p className="text-[#0B5F59]">Há notas existentes acima da nova escala. Revise antes de aplicar.</p>}
            <button className="rounded border p-2 font-semibold" onClick={async () => { try { await onUpdateConfig(previaConfig); setShowConfig(false); setPreviaConfig(null); } catch { setErroConfig('Não foi possível salvar os critérios. Tente novamente.'); } }}>Aplicar critérios</button>
          </div>}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-[#D5E3DC] bg-white/80 backdrop-blur-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F3F8F5] border-b border-[#D5E3DC] text-left">
              <th className="sticky left-0 z-20 bg-[#F3F8F5] px-3 py-3 text-center w-10">
                <input type="checkbox" checked={alunosVisiveis.length > 0 && alunosVisiveis.every(al => selectedIds.includes(al.id))}
                  onChange={handleToggleSelectAll} className="rounded border-[#B7D3C8] text-[#0F766E] focus:ring-[#0F766E]" />
              </th>
              <th className="hidden sm:table-cell sticky left-10 z-20 bg-[#F3F8F5] px-3 py-3 text-xs text-[#566F65] font-bold uppercase tracking-wider w-8">#</th>
              <th className="sticky left-10 sm:left-[72px] z-20 bg-[#F3F8F5] px-3 py-3 text-xs text-[#566F65] font-bold uppercase tracking-wider min-w-[180px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">Aluno</th>
              <th className="px-3 py-3 text-xs text-[#566F65] font-bold uppercase tracking-wider text-center w-28">
                Simulado<br /><span className="text-slate-400 font-normal font-mono normal-case tracking-normal">(0–{fmt(config?.simuladoMaxLanca ?? 5)})</span>
              </th>
              {atividades.map((atv) => (
                <th key={atv.id} className="px-2 py-3 text-xs text-[#566F65] font-bold uppercase tracking-wider text-center group">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{atv.nome}</span>
                    <span className="text-slate-400 font-normal font-mono normal-case tracking-normal">(0–{fmt(atv.max)})</span>
                    <button onClick={() => onRemoveAtv(atv.id)} className="opacity-0 group-hover:opacity-100 text-[#0F766E] hover:text-[#0F766E] text-[10px] leading-none mt-0.5 transition-opacity" title="Remover atividade">✕</button>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-xs text-[#566F65] font-bold uppercase tracking-wider text-center w-20">Total</th>
              <th className="px-3 py-3 text-xs text-[#566F65] font-bold uppercase tracking-wider text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunosVisiveis.map((al, idx) => {
              const nota = notas[al.id] || {};
              const total = calcTotal(nota.simulado, atividades, nota, config);
              const temNotaAluno = temNota(nota, atividades);

              return (
                <tr key={al.id} className={`border-b border-[#F3F7F5] transition-all duration-300 ${idx % 2 === 0 ? 'bg-[#F3F8F5]/80' : 'bg-white'} hover:bg-[#F3F7F5]`}>
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-center">
                    <input type="checkbox" checked={selectedIds.includes(al.id)} onChange={() => handleToggleSelect(al.id)} className="rounded border-[#B7D3C8] text-[#0F766E] focus:ring-[#0F766E]" />
                  </td>
                  <td className="hidden sm:table-cell sticky left-10 z-10 bg-inherit px-3 py-1.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="sticky left-10 sm:left-[72px] z-10 bg-inherit px-2 sm:px-3 py-1.5 text-[#123C3A] font-medium shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-[11px] sm:text-sm leading-tight max-w-[100px] sm:max-w-none break-words">{titleCase(al.nome)}</span>
                      {editingBirthday === al.id ? (
                        <input autoFocus type="text" maxLength={4} placeholder="ddMM" defaultValue={al.dataNascimento || ''}
                          className="w-16 px-1.5 py-0.5 text-xs font-mono bg-[#F3F7F5] border border-[#0F766E] rounded text-[#123C3A] focus:outline-none"
                          onBlur={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length === 4 && onUpdateAluno) onUpdateAluno(turma.id, al.id, { dataNascimento: v }); setEditingBirthday(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingBirthday(null); }} />
                      ) : (
                        <button onClick={() => setEditingBirthday(al.id)} className="text-[10px] font-mono transition-colors px-1 rounded" style={{ color: al.dataNascimento ? '#6b7280' : '#0f766e' }} title="Data de nascimento (ddMM)">
                          {al.dataNascimento || '+ data'}
                        </button>
                      )}
                      {al.dataNascimento ? (
                        <span className="hidden sm:inline text-[9px] font-mono text-[#0F766E] bg-[#F3F8F5] px-1 py-0.5 rounded border border-[#D5E3DC]" title="Login do aluno no Portal">
                          🔑 {selecionarLoginExibido(loginsArmazenados[al.nome] || [], al) || gerarLoginAluno(al.nome, al.dataNascimento)}
                        </span>
                      ) : (
                        <span className="hidden sm:inline text-[9px] text-[#0F766E] font-medium" title="Sem data = sem login no Portal do Aluno">
                          ⚠ sem login
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <BadgeNecessidades necessidades={al.necessidades} />
                    </div>
                  </td>
                  <td className="px-2 py-1"><NumCell label={`Simulado de ${al.nome}`} value={nota.simulado ?? ''} min={0} max={config?.simuladoMaxLanca !== undefined ? Number(config.simuladoMaxLanca) : 5} onChange={(v) => onSetNota(al.id, 'simulado', v)} /></td>
                  {atividades.map((atv) => (
                    <td key={atv.id} className="px-2 py-1"><NumCell label={`${atv.nome} de ${al.nome}`} value={nota[atv.id] ?? ''} min={0} max={atv.max} onChange={(v) => onSetNota(al.id, atv.id, v)} /></td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    {temNotaAluno ? <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${estiloNotaBimestral(total, config)}`}>{fmt(total)}</span> : <span className="text-slate-400 text-xs font-mono">—</span>}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <details className="relative"><summary className="cursor-pointer text-xs whitespace-nowrap font-semibold">Ações do aluno</summary><div className="flex flex-col items-start gap-2 bg-white border rounded-xl p-3 min-w-48">
                    <button className="text-xs" onClick={() => { setCadastro({ ...al }); setErroCadastro(''); }}>Editar cadastro</button>
                    {atividades.length > 0 && (
                      <button onClick={() => handleClearSingleActivities(al.id, al.nome)} className="text-slate-400 hover:text-[#0F766E] transition-colors p-1" title="Limpar notas de atividades">Limpar notas de atividades</button>
                    )}
                    <button onClick={() => handleClearSingleSimulado(al.id, al.nome)} className="text-slate-400 hover:text-[#0F766E] transition-colors p-1" title="Limpar nota do simulado">Limpar nota do simulado</button>
                    <button
                      onClick={() => {
                        setEditingNeeds(al.id);
                        setNeedsDraft(Array.isArray(al.necessidades) ? [...al.necessidades] : []);
                        setNivelDraft(Number.isInteger(al.nivelSuporte) && [1, 2, 3].includes(al.nivelSuporte) ? al.nivelSuporte : 1);
                        setHiperfocoDraft(typeof al.hiperfoco === 'string' ? al.hiperfoco : '');
                        setObservacoesDraft(typeof al.observacoes === 'string' ? al.observacoes : '');
                      }}
                      className={`transition-colors p-1 ${al.necessidades?.length ? 'text-[#0b5f59] hover:text-[#0f766e]' : 'text-slate-400 hover:text-[#0f766e]'}`}
                      title="Perfil inclusivo do aluno (necessidades, nível de suporte, âncora)"
                    >Editar perfil inclusivo</button>
                    <button
                      onClick={() => {
                        setIncluirCIDNaExportacao(false);
                        setHistoricoFicha([]); setCarregandoHistorico(true); setErroFichaPDF('');
                        setAlunoFichaModal(al);
                      }}
                      className="text-slate-400 hover:text-[#123c3a] transition-colors p-1"
                      title="Emitir Ficha Pedagógica 360º em PDF (Reunião de Pais e Conselho de Classe)"
                    >Relatório e perfil do aluno</button>
                    <button onClick={() => handleRemoveSingle(al.id, al.nome)} className="text-slate-400 hover:text-[#0F766E] transition-colors p-1" title="Excluir aluno">Remover aluno</button>
                    </div></details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onAddAlunoManual && <AddAlunoForm onAdd={onAddAlunoManual} />}
      <AddAtvForm onAdd={onAddAtv} somaAtual={somaMaxima} maxAtv={atvMax} />

      {cadastro && <div className="fixed inset-0 z-50 bg-[#123C3A]/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Editar cadastro do aluno">
        <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
          <h3 className="font-bold">Editar cadastro</h3>
          <label className="block text-sm">Nome completo<input aria-label="Nome completo" className="block w-full border rounded p-2" value={cadastro.nome} onChange={e => setCadastro({ ...cadastro, nome: e.target.value })} /></label>
          <label className="block text-sm">Nascimento (ddMM)<input aria-label="Nascimento (ddMM)" className="block w-full border rounded p-2" maxLength={4} value={cadastro.dataNascimento || ''} onChange={e => setCadastro({ ...cadastro, dataNascimento: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
          <p className="text-xs text-[#4F6B63]">Após alterar os dados de acesso, confira o login e publique novamente para atualizar o Portal.</p>
          {erroCadastro && <p role="alert" className="text-[#0B5F59] text-sm">{erroCadastro}</p>}
          <div className="flex justify-end gap-2"><button className="border rounded p-2" onClick={() => setCadastro(null)}>Cancelar</button><button className="border rounded p-2" onClick={async () => {
            if (!cadastro.nome.trim() || (cadastro.dataNascimento && !/^\d{4}$/.test(cadastro.dataNascimento))) { setErroCadastro('Informe o nome e uma data com quatro dígitos, ou deixe a data vazia.'); return; }
            try { await onUpdateAluno?.(turma.id, cadastro.id, { nome: cadastro.nome.trim(), dataNascimento: cadastro.dataNascimento || '' }); setCadastro(null); }
            catch { setErroCadastro('Não foi possível salvar o cadastro. Tente novamente.'); }
          }}>Salvar cadastro</button></div>
        </div>
      </div>}

      {/* Modal de Necessidades / PCD (RN-43) */}
      {editingNeeds && (() => {
        const alunoEdit = turma.alunos.find((al) => al.id === editingNeeds);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#123c3a]/40 backdrop-blur-sm"
            onClick={() => setEditingNeeds(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Editar perfil inclusivo do aluno"
          >
            <div
              className="bg-white rounded-2xl border border-[#d5e3dc] shadow-xl p-5 w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-extrabold text-[#123c3a] mb-1">
                Perfil Inclusivo — {alunoEdit ? titleCase(alunoEdit.nome) : ''}
              </h3>
              <p className="text-[11px] text-[#4f6b63] mb-4 leading-relaxed">
                Necessidades DUA, nível de suporte, âncora de engajamento e observações (RN-43/RN-46).
                Dados sensíveis conforme LGPD: visíveis apenas para o professor, nunca enviados ao Portal do Aluno.
              </p>
              <div className="space-y-4">
                <div>
                  <span className="block text-[11px] font-semibold text-[#566F65] uppercase tracking-wider mb-1.5">
                    Necessidades / PCD
                  </span>
                  <SeletorNecessidadesDiario
                    selecionadas={needsDraft}
                    onToggle={(id) => setNeedsDraft((prev) => alternarNecessidade(prev, id))}
                    idPrefix="edit-nec"
                  />
                </div>
                <CamposPerfilInclusivo
                  nivelSuporte={nivelDraft}
                  onChangeNivel={setNivelDraft}
                  hiperfoco={hiperfocoDraft}
                  onChangeHiperfoco={setHiperfocoDraft}
                  observacoes={observacoesDraft}
                  onChangeObservacoes={setObservacoesDraft}
                  idPrefix="edit-perfil"
                />
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setEditingNeeds(null)}
                  className="px-4 py-2 bg-[#f3f7f5] hover:bg-[#f3f7f5] border border-[#d5e3dc] rounded-xl text-[#123c3a] text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (onUpdateAluno) onUpdateAluno(turma.id, editingNeeds, {
                      necessidades: needsDraft,
                      nivelSuporte: nivelDraft,
                      hiperfoco: hiperfocoDraft,
                      observacoes: observacoesDraft,
                    });
                    setEditingNeeds(null);
                  }}
                  className="px-4 py-2 btn-brand-primary rounded-xl text-white text-xs font-bold transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Emissão da Ficha 360º com Sigilo LGPD (RN-62) */}
      {alunoFichaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#123c3a]/50 backdrop-blur-xs"
          onClick={() => setAlunoFichaModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-3xl border border-[#d5e3dc] shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F7F5]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#f3f8f5] border border-[#daebe5] flex items-center justify-center text-[#0f766e]">
                  📋
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#123c3a]">
                    Ficha Pedagógica 360º
                  </h3>
                  <p className="text-[11px] text-[#4f6b63] font-medium">
                    {alunoFichaModal.nome} • {turma.nome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlunoFichaModal(null)}
                className="text-slate-400 hover:text-[#4F6B63] p-1"
              >
                ✕
              </button>
            </div>

            <PerfilAlunoDiario aluno={alunoFichaModal} turma={turma} historicoAtividades={historicoFicha} carregando={carregandoHistorico} />
            <div className="space-y-3 text-xs">
              <p className="font-bold text-[#123c3a]">
                Selecione o nível de privacidade do documento (RN-62):
              </p>

              <div className="space-y-2">
                <label
                  onClick={() => setIncluirCIDNaExportacao(false)}
                  className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                    !incluirCIDNaExportacao
                      ? "border-[#0f766e] bg-[#f3f8f5]/40 text-[#123c3a]"
                      : "border-[#d5e3dc] bg-white text-[#4f6b63] hover:border-[#0f766e]/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="destino_ficha"
                      checked={!incluirCIDNaExportacao}
                      onChange={() => setIncluirCIDNaExportacao(false)}
                      className="mt-0.5 text-[#0f766e] focus:ring-[#0f766e]"
                    />
                    <div>
                      <span className="font-extrabold text-xs block text-[#123c3a]">
                        👨‍👩‍👧 Para a Família / Responsáveis (Recomendado)
                      </span>
                      <p className="text-[11px] text-[#4f6b63] mt-0.5 leading-relaxed">
                        <strong>Sigilo LGPD:</strong> Oculta códigos de CID e nomes de diagnósticos clínicos. Apresenta o parecer, notas, frequência legal e adaptações metodológicas sem estigmas.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setIncluirCIDNaExportacao(true)}
                  className={`p-3.5 rounded-2xl border cursor-pointer block transition-all ${
                    incluirCIDNaExportacao
                      ? "border-[#0f766e] bg-[#f3f8f5]/40 text-[#123c3a]"
                      : "border-[#d5e3dc] bg-white text-[#4f6b63] hover:border-[#0f766e]/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="destino_ficha"
                      checked={incluirCIDNaExportacao}
                      onChange={() => setIncluirCIDNaExportacao(true)}
                      className="mt-0.5 text-[#0f766e] focus:ring-[#0f766e]"
                    />
                    <div>
                      <span className="font-extrabold text-xs block text-[#123c3a]">
                        🏛️ Conselho de Classe / Coordenação Pedagógica
                      </span>
                      <p className="text-[11px] text-[#4f6b63] mt-0.5 leading-relaxed">
                        <strong>Dossiê Interno:</strong> Inclui as categorias completas de diagnóstico (ex: TEA, TDAH) e nível de suporte para análise colegiada.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {erroFichaPDF && <p role="alert" className="text-xs text-[#0B5F59]">{erroFichaPDF}</p>}
            <div className="pt-3 border-t border-[#F3F7F5] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAlunoFichaModal(null)}
                className="px-4 py-2 border border-[#D5E3DC] hover:bg-[#F3F8F5] text-[#35594D] rounded-xl text-xs font-bold"
                disabled={gerandoFichaPDF}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmarExportFicha360(incluirCIDNaExportacao)}
                disabled={gerandoFichaPDF}
                className="px-4 py-2 btn-brand-primary rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {gerandoFichaPDF ? "Gerando PDF..." : "Emitir Relatório em PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
