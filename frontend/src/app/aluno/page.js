"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validarLoginAluno } from '@/lib/firebase-aluno';
import { GraduationCap, ArrowLeft, ArrowRight, BookOpen, PenTool, CheckCircle2, User } from 'lucide-react';

export default function AlunoLoginPage() {
  const [login, setLogin] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [vinculos, setVinculos] = useState(null);
  const [alunoBase, setAlunoBase] = useState(null);
  const router = useRouter();

  // Carrega do sessionStorage se estiver voltando das notas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBase = sessionStorage.getItem('aluno_base');
      const storedVinculos = sessionStorage.getItem('aluno_vinculos');
      if (storedBase && storedVinculos) {
        try {
          setAlunoBase(JSON.parse(storedBase));
          setVinculos(JSON.parse(storedVinculos));
        } catch (e) {
          sessionStorage.removeItem('aluno_base');
          sessionStorage.removeItem('aluno_vinculos');
        }
      }
    }
  }, []);

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
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4 font-sans selection:bg-[#f60c49] selection:text-white relative overflow-hidden">
      {/* Elementos decorativos sutis */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#f60c49]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#101942]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#dce0f0] rounded-3xl shadow-xl p-8 z-10">
        {/* Topo / Voltar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6070a0] hover:text-[#101942] transition-colors"
          >
            <ArrowLeft size={14} /> Voltar ao Início
          </button>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f60c49] bg-[#fff2f6] border border-[#fde4ec] px-2 py-0.5 rounded-full">
            Área do Estudante
          </span>
        </div>

        {/* Logo e Cabeçalho */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-[#101942] border-2 border-[#f60c49]/20 flex items-center justify-center text-white shadow-md shadow-[#101942]/10">
            <GraduationCap size={28} className="text-[#f60c49]" />
          </div>
          <h1 className="font-head text-2xl font-extrabold text-[#101942] tracking-tight">
            Portal do Aluno
          </h1>
          <p className="text-xs text-[#6070a0] mt-1">
            Consulte seu boletim, redações corrigidas e atividades
          </p>
        </div>

        {vinculos ? (
          <div className="space-y-4">
            <div className="text-left bg-[#f7f8fc] border border-[#dce0f0] p-4 rounded-2xl">
              <span className="text-[10px] text-[#6070a0] font-bold uppercase tracking-wider block">
                Aluno(a) Identificado(a)
              </span>
              <p className="text-sm font-extrabold text-[#101942] mt-0.5 flex items-center gap-1.5">
                <User size={14} className="text-[#f60c49]" />
                {alunoBase?.nome}
              </p>
            </div>

            <p className="text-xs font-bold text-[#6070a0] uppercase tracking-wider mb-2 text-left font-head">
              Selecione o Professor / Turma:
            </p>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {vinculos.map((v) => (
                <div key={v.id || v.professorUid} className="p-4 bg-white border border-[#dce0f0] hover:border-[#f60c49]/40 rounded-2xl shadow-2xs transition-all flex flex-col gap-3">
                  <div>
                    <p className="font-extrabold text-[#101942] text-sm truncate font-head">
                      Professor(a) {v.nomeProfessor}
                    </p>
                    <p className="text-xs text-[#6070a0] mt-0.5 font-medium">
                      Turma: {v.turmaNome || v.turmaId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectVinculo(v, false)}
                      className="flex-1 bg-[#101942] hover:bg-[#090f28] text-white text-xs font-bold py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <BookOpen size={13} />
                      <span>Ver Notas</span>
                    </button>
                    <button
                      onClick={() => handleSelectVinculo(v, true)}
                      className="flex-1 bg-[#fff2f6] hover:bg-[#ffe6ee] text-[#d40840] border border-[#fde4ec] text-xs font-bold py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1"
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
              className="w-full text-center mt-3 text-xs text-[#6070a0] hover:text-[#101942] underline font-semibold"
            >
              Entrar com outro usuário
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#6070a0] uppercase tracking-wider mb-1.5 text-left font-head">
                Código de Acesso do Aluno
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => { setLogin(e.target.value); setErro(''); }}
                placeholder="Ex: maria1503 (1º nome + DDMM)"
                className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-2xl px-4 py-3.5 text-sm text-[#101942] placeholder-[#9098c0] outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all font-mono font-bold"
                autoFocus
                disabled={loading}
              />
              <p className="text-[11px] text-[#6070a0] mt-2 text-left leading-relaxed">
                Insira seus 2 primeiros nomes + dia e mês de nascimento.<br />
                Exemplo: <strong>Pedro Henrique</strong> nascido em 11/11 → <span className="font-mono text-[#101942] font-bold">pedrohenrique1111</span>
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
