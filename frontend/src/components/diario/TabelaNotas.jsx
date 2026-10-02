"use client";

import { useState, useEffect } from 'react';
import { NumCell } from '@/components/diario/NumCell';
import { BadgeNecessidades, SeletorNecessidadesDiario, alternarNecessidade } from '@/components/diario/SeletorNecessidadesDiario';
import { CamposPerfilInclusivo } from '@/components/diario/CamposPerfilInclusivo';
import { calcTotal, fmt, statusColor, somaMaxAtv, round2, temNota, titleCase } from '@/utils/diario/calculos';
import { gerarLoginAluno, selecionarLoginExibido } from '@/utils/diario/loginAluno';
import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const STATUS_STYLES = {
  good: 'text-[#101942] bg-[#eef0f8] border border-[#dce0f0] font-bold',
  warn: 'text-[#d40840] bg-[#fff2f6] border border-[#fde4ec] font-bold',
  bad:  'text-red-600 bg-red-50 border border-red-200 font-bold'
};

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
    <div className="flex flex-col gap-2 sm:gap-3 mt-3 pt-3 border-t border-[#dce0f0]">
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          value={nome} onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Nome completo do aluno"
          className="flex-1 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#101942] placeholder-[#9098c0] outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all"
        />
        <input
          value={data} onChange={(e) => setData(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="ddMM (Nascimento)" maxLength={4}
          className="w-24 sm:w-36 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#101942] placeholder-[#9098c0] outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all font-mono text-center"
        />
        <button
          onClick={() => setShowNec((v) => !v)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            nec.length > 0
              ? 'bg-[#fff2f6] border-[#f60c49] text-[#d40840]'
              : 'bg-[#f7f8fc] border-[#dce0f0] text-[#6070a0] hover:border-[#f60c49]/40'
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

  const submit = () => {
    const m = parseFloat(max.replace(',', '.'));
    if (!nome.trim() || isNaN(m) || m <= 0) return;
    onAdd(nome.trim(), m);
    setNome('');
    setMax('');
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 mt-4">
      <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da atividade"
        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all" />
      <input value={max} onChange={(e) => setMax(e.target.value)} placeholder={`máx: ${fmt(dispLeft)}`}
        className="w-20 sm:w-40 bg-slate-50 border border-slate-200 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all text-center" />
      <button onClick={submit}
        className="px-3 sm:px-5 py-1.5 sm:py-2 bg-violet-500 hover:bg-violet-400 hover:scale-[1.03] active:scale-[0.97] rounded-lg text-xs sm:text-sm text-white font-semibold transition-all whitespace-nowrap">
        + Adicionar
      </button>
    </div>
  );
};

export const TabelaNotas = ({
  turma, bimestre, onSetNota, onAddAtv, onRemoveAtv, onRemoveAluno, onRemoveAlunos,
  onUpdateConfig, onClearAtividadesNota, onClearAtividadesTurma, onUpdateAluno, onAddAlunoManual,
  onClearSimuladoNota, onClearSimuladoTurma, user
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(null);
  const [editingNeeds, setEditingNeeds] = useState(null);
  const [needsDraft, setNeedsDraft] = useState([]);
  const [nivelDraft, setNivelDraft] = useState(1);
  const [hiperfocoDraft, setHiperfocoDraft] = useState('');
  const [observacoesDraft, setObservacoesDraft] = useState('');
  const [loginsArmazenados, setLoginsArmazenados] = useState({});

  const handleExportFicha360 = async (aluno) => {
    try {
      await generateFichaAluno360PDF({
        aluno,
        turma,
        frequenciasTurma: turma?.frequencias,
        professorNome: user?.displayName || user?.email || 'Professor(a)',
      });
    } catch (err) {
      console.error('Erro ao emitir Ficha 360 do aluno:', err);
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

  const somaMaxima = somaMaxAtv(atividades);
  const atvMax = config?.atividadesMaxFinal !== undefined ? Number(config.atividadesMaxFinal) : 5;
  const excede = somaMaxima > atvMax;

  const totaisTurma = turma.alunos
    .filter((al) => temNota(notas[al.id], atividades))
    .map((al) => { const nota = notas[al.id] || {}; return calcTotal(nota.simulado, atividades, nota, config); });

  const media = totaisTurma.length > 0 ? round2(totaisTurma.reduce((a, b) => a + b, 0) / totaisTurma.length) : null;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === turma.alunos.length) setSelectedIds([]);
    else setSelectedIds(turma.alunos.map((al) => al.id));
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
    const parseVal = (val, fallback) => { const p = parseFloat(String(val).replace(',', '.')); return isNaN(p) ? fallback : p; };
    onUpdateConfig({
      simuladoMaxLanca: parseVal(cfgSimLanca, 5), simuladoMaxFinal: parseVal(cfgSimFinal, 5),
      atividadesMaxFinal: parseVal(cfgAtvFinal, 5), mediaAprovacao: parseVal(cfgAprov, 5), mediaRecuperacao: parseVal(cfgRecup, 4.99)
    });
    setShowConfig(false);
  };

  return (
    <div>
      {/* Cabeçalho bimestre */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500">
            Soma máx. atividades: <span className={`font-mono font-semibold ${excede ? 'text-red-500' : 'text-slate-900'}`}>{fmt(somaMaxima)} / {fmt(atvMax)}</span>
          </span>
          {excede && <span className="text-xs bg-red-50 border border-red-200 text-red-600 rounded-full px-2 py-0.5 font-semibold">⚠ excede {fmt(atvMax)} pts</span>}
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-400 text-white text-xs px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium">
              🗑 Excluir selecionados ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 transition-colors font-medium">
            ⚙ Critérios
          </button>
          {turma.alunos.length > 0 && atividades.length > 0 && (
            <button onClick={handleClearBulkActivities} className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs transition-colors font-medium">
              🧹 Limpar Atividades
            </button>
          )}
          {turma.alunos.length > 0 && (
            <button onClick={handleClearBulkSimulado} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 hover:text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs transition-colors font-medium">
              🧪 Limpar Simulados
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {media !== null && (
            <div className="text-sm text-slate-500">
              Média turma: <span className={`font-mono font-bold ${STATUS_STYLES[statusColor(media, config)].split(' ')[0]}`}>{fmt(media)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Painel de Configurações */}
      {showConfig && (
        <div className="glass-panel border border-slate-200 rounded-2xl p-5 mb-5 grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Simulado Máx (Lançamento)</label>
            <input type="text" value={cfgSimLanca} onChange={(e) => setCfgSimLanca(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Peso Simulado Final</label>
            <input type="text" value={cfgSimFinal} onChange={(e) => setCfgSimFinal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Peso Atividades Final</label>
            <input type="text" value={cfgAtvFinal} onChange={(e) => setCfgAtvFinal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50 transition-all font-mono" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Média Aprovação (Verde)</label>
            <input type="text" value={cfgAprov} onChange={(e) => setCfgAprov(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50 transition-all font-mono" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Média Recup. (Amarelo)</label>
              <input type="text" value={cfgRecup} onChange={(e) => setCfgRecup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50 transition-all font-mono" />
            </div>
            <button onClick={handleSaveConfig} className="bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-all h-[32px] self-end">
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 text-center w-10">
                <input type="checkbox" checked={turma.alunos.length > 0 && selectedIds.length === turma.alunos.length}
                  onChange={handleToggleSelectAll} className="rounded border-slate-300 text-violet-500 focus:ring-violet-400" />
              </th>
              <th className="hidden sm:table-cell sticky left-10 z-20 bg-slate-50 px-3 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider w-8">#</th>
              <th className="sticky left-10 sm:left-[72px] z-20 bg-slate-50 px-3 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider min-w-[180px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">Aluno</th>
              <th className="px-3 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider text-center w-28">
                Simulado<br /><span className="text-slate-400 font-normal font-mono normal-case tracking-normal">(0–{fmt(config?.simuladoMaxLanca ?? 10)})</span>
              </th>
              {atividades.map((atv) => (
                <th key={atv.id} className="px-2 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider text-center group">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>{atv.nome}</span>
                    <span className="text-slate-400 font-normal font-mono normal-case tracking-normal">(0–{fmt(atv.max)})</span>
                    <button onClick={() => onRemoveAtv(atv.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 text-[10px] leading-none mt-0.5 transition-opacity" title="Remover atividade">✕</button>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider text-center w-20">Total</th>
              <th className="px-3 py-3 text-xs text-slate-500 font-bold uppercase tracking-wider text-center w-20">Ações</th>
            </tr>
          </thead>
          <tbody>
            {turma.alunos.map((al, idx) => {
              const nota = notas[al.id] || {};
              const total = calcTotal(nota.simulado, atividades, nota, config);
              const sc = statusColor(total, config);
              const temNotaAluno = temNota(nota, atividades);

              return (
                <tr key={al.id} className={`border-b border-slate-100 transition-all duration-300 ${idx % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'} hover:bg-slate-100`}>
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-center">
                    <input type="checkbox" checked={selectedIds.includes(al.id)} onChange={() => handleToggleSelect(al.id)} className="rounded border-slate-300 text-violet-500 focus:ring-violet-400" />
                  </td>
                  <td className="hidden sm:table-cell sticky left-10 z-10 bg-inherit px-3 py-1.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="sticky left-10 sm:left-[72px] z-10 bg-inherit px-2 sm:px-3 py-1.5 text-slate-900 font-medium shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-[11px] sm:text-sm leading-tight max-w-[100px] sm:max-w-none break-words">{titleCase(al.nome)}</span>
                      {editingBirthday === al.id ? (
                        <input autoFocus type="text" maxLength={4} placeholder="ddMM" defaultValue={al.dataNascimento || ''}
                          className="w-16 px-1.5 py-0.5 text-xs font-mono bg-slate-100 border border-violet-400 rounded text-slate-900 focus:outline-none"
                          onBlur={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length === 4 && onUpdateAluno) onUpdateAluno(turma.id, al.id, { dataNascimento: v }); setEditingBirthday(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingBirthday(null); }} />
                      ) : (
                        <button onClick={() => setEditingBirthday(al.id)} className="text-[10px] font-mono transition-colors px-1 rounded" style={{ color: al.dataNascimento ? '#6b7280' : '#7c3aed' }} title="Data de nascimento (ddMM)">
                          {al.dataNascimento || '+ data'}
                        </button>
                      )}
                      {al.dataNascimento ? (
                        <span className="hidden sm:inline text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200" title="Login do aluno no Portal">
                          🔑 {selecionarLoginExibido(loginsArmazenados[al.nome] || [], al) || gerarLoginAluno(al.nome, al.dataNascimento)}
                        </span>
                      ) : (
                        <span className="hidden sm:inline text-[9px] text-amber-500 font-medium" title="Sem data = sem login no Portal do Aluno">
                          ⚠ sem login
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <BadgeNecessidades necessidades={al.necessidades} />
                    </div>
                  </td>
                  <td className="px-2 py-1"><NumCell value={nota.simulado ?? ''} min={0} max={config?.simuladoMaxLanca !== undefined ? Number(config.simuladoMaxLanca) : 10} onChange={(v) => onSetNota(al.id, 'simulado', v)} /></td>
                  {atividades.map((atv) => (
                    <td key={atv.id} className="px-2 py-1"><NumCell value={nota[atv.id] ?? ''} min={0} max={atv.max} onChange={(v) => onSetNota(al.id, atv.id, v)} /></td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    {temNotaAluno ? <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${STATUS_STYLES[sc]}`}>{fmt(total)}</span> : <span className="text-slate-400 text-xs font-mono">—</span>}
                  </td>
                  <td className="px-3 py-1.5 text-center flex items-center justify-center gap-1">
                    {atividades.length > 0 && (
                      <button onClick={() => handleClearSingleActivities(al.id, al.nome)} className="text-slate-400 hover:text-cyan-500 transition-colors p-1" title="Limpar notas de atividades">🧹</button>
                    )}
                    <button onClick={() => handleClearSingleSimulado(al.id, al.nome)} className="text-slate-400 hover:text-amber-500 transition-colors p-1" title="Limpar nota do simulado">🧪</button>
                    <button
                      onClick={() => {
                        setEditingNeeds(al.id);
                        setNeedsDraft(Array.isArray(al.necessidades) ? [...al.necessidades] : []);
                        setNivelDraft(Number.isInteger(al.nivelSuporte) && [1, 2, 3].includes(al.nivelSuporte) ? al.nivelSuporte : 1);
                        setHiperfocoDraft(typeof al.hiperfoco === 'string' ? al.hiperfoco : '');
                        setObservacoesDraft(typeof al.observacoes === 'string' ? al.observacoes : '');
                      }}
                      className={`transition-colors p-1 ${al.necessidades?.length ? 'text-[#d40840] hover:text-[#f60c49]' : 'text-slate-400 hover:text-[#f60c49]'}`}
                      title="Perfil inclusivo do aluno (necessidades, nível de suporte, âncora)"
                    >🏷</button>
                    <button
                      onClick={() => handleExportFicha360(al)}
                      className="text-slate-400 hover:text-[#101942] transition-colors p-1"
                      title="Emitir Ficha Pedagógica 360º em PDF (Reunião de Pais e Conselho de Classe)"
                    >📋</button>
                    <button onClick={() => handleRemoveSingle(al.id, al.nome)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Excluir aluno">🗑</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onAddAlunoManual && <AddAlunoForm onAdd={onAddAlunoManual} />}
      <AddAtvForm onAdd={onAddAtv} somaAtual={somaMaxima} maxAtv={atvMax} />

      {/* Modal de Necessidades / PCD (RN-43) */}
      {editingNeeds && (() => {
        const alunoEdit = turma.alunos.find((al) => al.id === editingNeeds);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101942]/40 backdrop-blur-sm"
            onClick={() => setEditingNeeds(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Editar perfil inclusivo do aluno"
          >
            <div
              className="bg-white rounded-2xl border border-[#dce0f0] shadow-xl p-5 w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-extrabold text-[#101942] mb-1">
                Perfil Inclusivo — {alunoEdit ? titleCase(alunoEdit.nome) : ''}
              </h3>
              <p className="text-[11px] text-[#6070a0] mb-4 leading-relaxed">
                Necessidades DUA, nível de suporte, âncora de engajamento e observações (RN-43/RN-46).
                Dados sensíveis conforme LGPD: visíveis apenas para o professor, nunca enviados ao Portal do Aluno.
              </p>
              <div className="space-y-4">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
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
                  className="px-4 py-2 bg-[#f7f8fc] hover:bg-[#eef0f8] border border-[#dce0f0] rounded-xl text-[#101942] text-xs font-bold transition-all"
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
    </div>
  );
};
