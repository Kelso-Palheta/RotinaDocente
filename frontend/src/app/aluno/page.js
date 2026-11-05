"use client";

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { validarLoginAluno } from '@/lib/firebase-aluno';
import { INSTRUCAO_ACESSO, EXEMPLO_ACESSO, NOTA_COLISAO } from '@/dominio/aluno/instrucaoAcesso';
import { GraduationCap, ArrowLeft, ArrowRight, BookOpen, PenTool, CheckCircle2, User } from 'lucide-react';

function observarSessaoAluno(avisar) {
  window.addEventListener('storage', avisar);
  return () => window.removeEventListener('storage', avisar);
}
function lerSessaoAluno() {
  try {
    const base = sessionStorage.getItem('aluno_base');
    const vinculos = sessionStorage.getItem('aluno_vinculos');
    return base && vinculos ? JSON.stringify([base, vinculos]) : '';
  } catch { return ''; }
}
function interpretarSessaoAluno(snapshot) {
  try {
    const [base, vinculos] = JSON.parse(snapshot);
    const aluno = JSON.parse(base);
    const lista = JSON.parse(vinculos);
    return aluno && typeof aluno === 'object' && !Array.isArray(aluno) && Array.isArray(lista) &&
      lista.every(v => v && typeof v === 'object' && !Array.isArray(v))
      ? { aluno, lista } : null;
  } catch { return null; }
}
const sessaoAlunoServidor = () => '';

export default function AlunoLoginPage() {
  const [login, setLogin] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [vinculos, setVinculos] = useState(null);
  const [alunoBase, setAlunoBase] = useState(null);
  const router = useRouter();

  // A restauração acompanha o armazenamento externo e respeita a hidratação.
  const snapshot = useSyncExternalStore(observarSessaoAluno, lerSessaoAluno, sessaoAlunoServidor);
  const [snapshotAnterior, setSnapshotAnterior] = useState('');
  if (snapshotAnterior !== snapshot) {
    setSnapshotAnterior(snapshot);
    const restaurada = interpretarSessaoAluno(snapshot);
    setAlunoBase(restaurada?.aluno ?? null);
    setVinculos(restaurada?.lista ?? null);
  }
  useEffect(() => {
    if (snapshot && !interpretarSessaoAluno(snapshot)) {
      try {
        sessionStorage.removeItem('aluno_base');
        sessionStorage.removeItem('aluno_vinculos');
      } catch { /* Armazenamento indisponível não impede novo login. */ }
    }
  }, [snapshot]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valor = login
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (!valor) return;

    setErro('');
    setLoading(true);

    try {
      const res = await fetch('/api/aluno/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: valor }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Login não encontrado. Verifique seu nome e data de nascimento.');
        setLoading(false);
        return;
      }

      const dados = data.aluno;

      if (!dados.vinculos || dados.vinculos.length === 0) {
        setErro('Nenhuma nota ou atividade vinculada a esta conta ainda.');
        setLoading(false);
        return;
      }

      // Se tiver apenas 1 vínculo (ou 1 professor com múltiplos módulos), faz login direto nele
      const uniqueProfs = [];
      const profMap = new Map();
      
      dados.vinculos.forEach(v => {
        if (!profMap.has(v.professorUid)) {
          profMap.set(v.professorUid, v);
          uniqueProfs.push(v);
        }
      });

      if (uniqueProfs.length === 1) {
        const v = uniqueProfs[0];
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('aluno_login', JSON.stringify({
            login: valor,
            nome: dados.nome,
            alunoId: v.alunoId || dados.loginKey,
            turmaId: v.turmaId,
            professorUid: v.professorUid,
            loginKey: dados.loginKey
          }));
        }
        router.push('/aluno/notas');
      } else {
        // Se tiver múltiplos professores, exibe a lista para seleção
        setAlunoBase({ login: valor, nome: dados.nome, loginKey: dados.loginKey });
        setVinculos(uniqueProfs);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('aluno_base', JSON.stringify({ login: valor, nome: dados.nome, loginKey: dados.loginKey }));
          sessionStorage.setItem('aluno_vinculos', JSON.stringify(uniqueProfs));
        }
      }
    } catch (err) {
      console.error('Erro ao validar login:', err);
      setErro('Erro ao validar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVinculo = (v, openRedacao = false) => {
    if (!alunoBase) return;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aluno_login', JSON.stringify({
        login: alunoBase.login,
        nome: alunoBase.nome,
        alunoId: v.alunoId || alunoBase.loginKey,
        turmaId: v.turmaId,
        professorUid: v.professorUid,
        loginKey: alunoBase.loginKey,
        openRedacao
      }));
    }
    router.push('/aluno/notas');
  };

  return (
    <div className="min-h-screen bg-[#f3edff] flex items-center justify-center p-4 font-sans selection:bg-[#6315d9] selection:text-white relative overflow-hidden">
      {/* Elementos decorativos sutis */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#6315d9]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#25104a]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="arte-faixa arte-composicao w-full max-w-md bg-white border border-[#e2d9f7] rounded-3xl shadow-xl p-8 z-10">
        {/* Topo / Voltar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b4b86] hover:text-[#25104a] transition-colors"
          >
            <ArrowLeft size={14} /> Voltar ao Início
          </button>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6315d9] bg-[#f3edff] border border-[#e7dbfd] px-2 py-0.5 rounded-full">
            Área do Estudante
          </span>
        </div>

        {/* Logo e Cabeçalho */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-[#25104a] border-2 border-[#6315d9]/20 flex items-center justify-center text-white shadow-md shadow-[#25104a]/10">
            <GraduationCap size={28} className="text-[#6315d9]" />
          </div>
          <h1 className="font-head text-2xl font-extrabold text-[#25104a] tracking-tight">
            Portal do Aluno
          </h1>
          <p className="text-xs text-[#5b4b86] mt-1">
            Consulte seu boletim, redações corrigidas e atividades
          </p>
        </div>

        {vinculos ? (
          <div className="space-y-4">
            <div className="text-left bg-[#f3edff] border border-[#e2d9f7] p-4 rounded-2xl">
              <span className="text-[10px] text-[#5b4b86] font-bold uppercase tracking-wider block">
                Aluno(a) Identificado(a)
              </span>
              <p className="text-sm font-extrabold text-[#25104a] mt-0.5 flex items-center gap-1.5">
                <User size={14} className="text-[#6315d9]" />
                {alunoBase?.nome}
              </p>
            </div>

            <p className="text-xs font-bold text-[#5b4b86] uppercase tracking-wider mb-2 text-left font-head">
              Selecione o Professor / Turma:
            </p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {vinculos.map((v) => (
                <div key={v.id || v.professorUid} className="p-4 bg-white border border-[#e2d9f7] hover:border-[#6315d9]/40 rounded-2xl shadow-2xs transition-all flex flex-col gap-3">
                  <div>
                    <p className="font-extrabold text-[#25104a] text-sm truncate font-head">
                      Professor(a) {v.nomeProfessor}
                    </p>
                    <p className="text-xs text-[#5b4b86] mt-0.5 font-medium">
                      Turma: {v.turmaNome || v.turmaId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectVinculo(v, false)}
                      className="flex-1 bg-[#25104a] hover:bg-[#180a30] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <BookOpen size={13} />
                      <span>Ver Notas</span>
                    </button>
                    <button
                      onClick={() => handleSelectVinculo(v, true)}
                      className="flex-1 bg-[#f3edff] hover:bg-[#e7dbfd] text-[#5411b8] border border-[#e7dbfd] text-xs font-bold py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1"
                    >
                      <PenTool size={13} />
                      <span>Redação</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setVinculos(null);
                setAlunoBase(null);
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('aluno_base');
                  sessionStorage.removeItem('aluno_vinculos');
                  sessionStorage.removeItem('aluno_login');
                }
              }} 
              className="w-full text-center mt-3 text-xs text-[#5b4b86] hover:text-[#25104a] underline font-semibold"
            >
              Entrar com outro usuário
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#5b4b86] uppercase tracking-wider mb-1.5 text-left font-head">
                Código de Acesso do Aluno
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => { setLogin(e.target.value); setErro(''); }}
                placeholder="Ex: maria1503 (1º nome + DDMM)"
                className="w-full bg-[#f3edff] border border-[#e2d9f7] rounded-2xl px-4 py-3.5 text-sm text-[#25104a] placeholder-[#6e5f94] outline-none focus:bg-white focus:ring-2 focus:ring-[#6315d9]/30 focus:border-[#6315d9] transition-all font-mono font-bold"
                autoFocus
                disabled={loading}
              />
              <p className="text-[11px] text-[#5b4b86] mt-2 text-left leading-relaxed">
                {INSTRUCAO_ACESSO}<br />
                Exemplo: <span className="font-mono text-[#25104a] font-bold">{EXEMPLO_ACESSO}</span><br />
                {NOTA_COLISAO}
              </p>
            </div>

            {erro && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-2xl text-left">
                <p className="text-xs text-[#991b1b] font-semibold">{erro}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!login.trim() || loading}
              className="w-full py-3.5 btn-brand-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verificando...' : 'Acessar Meu Boletim'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
