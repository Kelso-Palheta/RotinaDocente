"use client";

import { useState } from 'react';
import { anoLetivoDaTurma } from '@/dominio/atividades/recuperacaoSemestral';

const anoInicialDaTurma = (turma, ano) => {
  const canonico = turma ? anoLetivoDaTurma(turma) : null;
  if (canonico != null) return String(canonico);
  // Turma legada continua legada: nunca substituir pelo ano do relógio.
  return ano && String(ano) !== 'todos' ? String(ano) : 'legado';
};

export function CriacaoConjunto({ turmas, ano, onCancelar, onCriar }) {
  const turmasDisponiveis = turmas || [];
  const [turmaId, setTurmaId] = useState(turmasDisponiveis[0]?.id || '');
  const [anoLetivo, setAnoLetivo] = useState(() => anoInicialDaTurma(turmasDisponiveis[0], ano));
  const [semestre, setSemestre] = useState('1');
  const [destinatarios, setDestinatarios] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const turma = turmasDisponiveis.find(t => t.id === turmaId);

  const alternar = (alunoId) => setDestinatarios(prev => prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]);

  const trocarTurma = (novoId) => {
    const novaTurma = turmasDisponiveis.find(t => t.id === novoId);
    setTurmaId(novoId);
    setAnoLetivo(anoInicialDaTurma(novaTurma, ano));
    setDestinatarios([]);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onCriar({ turmaId, anoLetivo: String(anoLetivo), semestre, destinatariosIds: destinatarios }, turma?.alunos || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="bg-white border border-[#dce0f0] rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-[#101942]">Novo conjunto de recuperação semestral</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-semibold text-[#101942]">Turma
          <select aria-label="Turma da recuperação" value={turmaId} onChange={e => trocarTurma(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm font-normal">
            {turmasDisponiveis.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#101942]">Ano letivo
          <input aria-label="Ano letivo da recuperação" value={anoLetivo} readOnly title="O ano é o da turma selecionada" className="mt-1 w-full border rounded-lg p-2 text-sm font-normal bg-slate-50 text-[#6070a0]" />
        </label>
        <label className="text-xs font-semibold text-[#101942]">Semestre
          <select aria-label="Semestre da recuperação" value={semestre} onChange={e => setSemestre(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm font-normal">
            <option value="1">1º semestre</option>
            <option value="2">2º semestre</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold text-[#101942] mb-2">Alunos em recuperação ({destinatarios.length})</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-auto border border-[#dce0f0] rounded-xl p-2">
          {(turma?.alunos || []).map(aluno => (
            <label key={aluno.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-slate-50">
              <input type="checkbox" checked={destinatarios.includes(aluno.id)} onChange={() => alternar(aluno.id)} />
              {aluno.nome}
            </label>
          ))}
          {!turma?.alunos?.length && <p className="text-xs text-slate-500 p-2">Turma sem alunos.</p>}
        </div>
      </fieldset>

      <p className="text-xs text-[#6070a0]">O conjunto nasce vazio. Você distribui os 10 pontos entre uma ou várias atividades depois. Nenhum aluno é matriculado automaticamente na recuperação.</p>
      {erro && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded p-2">{erro}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className="flex-1 py-2 bg-slate-50 border rounded-xl text-sm">Cancelar</button>
        <button type="submit" disabled={salvando || !turmaId || !destinatarios.length} className="flex-1 py-2 bg-[#f60c49] text-white rounded-xl text-sm font-semibold disabled:bg-slate-200">
          {salvando ? 'Criando...' : 'Criar conjunto'}
        </button>
      </div>
    </form>
  );
}
