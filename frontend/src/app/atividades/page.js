"use client";

import { useState, useRef, useEffect } from 'react';

export const dynamic = "force-dynamic";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTurmas } from '@/hooks/diario/useTurmas';
import { turmasIniciais } from '@/data/diario/turmasIniciais';
import { useAtividades } from '@/hooks/atividades/useAtividades';
import { useNotas } from '@/hooks/diario/useNotas';
import { AtividadesList } from '@/components/atividades/AtividadesList';
import { TodasAtividades } from '@/components/atividades/TodasAtividades';
import { Sidebar } from '@/components/diario/Sidebar';
import { ProfileModal } from '@/components/diario/ProfileModal';
import { ArrowLeft, GraduationCap, Layers, ExternalLink, Copy, Check, Menu, X } from 'lucide-react';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY = 'diario_turmas';
const USER_KEY = 'diario_userId';

const carregarLocal = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignora */ }
  return null;
};

const salvarLocal = (turmas, timestamp = null) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turmas));
    sessionStorage.setItem(STORAGE_KEY + '_lastUpdated', String(timestamp || Date.now()));
  } catch { /* ignora */ }
};

export default function AtividadesPage() {
  const { user, perfil, loading, logout } = useAuth();
  const router = useRouter();

  const [initialTurmas, setInitialTurmas] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });
  const [loadingTurmas, setLoadingTurmas] = useState(true);

  // Carrega do Firestore se sessionStorage estiver vazio, ou sync em background
  useEffect(() => {
    if (loading) return; // Aguarda o carregamento do estado de autenticação
    if (!user) {
      setLoadingTurmas(false);
      return;
    }

    (async () => {
      try {
        const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem(USER_KEY) : null;
        const isSameUser = storedUserId === user.uid;
        const local = isSameUser ? carregarLocal() : null;

        const ref = doc(db, 'professores', user.uid, 'turmas', 'data');
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().turmas?.length > 0) {
          const cloud = snap.data().turmas;
          const cloudTime = snap.data().lastUpdated || 0;
          const localTime = typeof window !== 'undefined' ? Number(sessionStorage.getItem(STORAGE_KEY + '_lastUpdated')) || 0 : 0;

          if (cloudTime >= localTime || !local) {
            setInitialTurmas(cloud);
            salvarLocal(cloud, cloudTime);
          } else {
            setInitialTurmas(local);
            await setDoc(ref, { turmas: local, lastUpdated: localTime }, { merge: true });
          }
          if (typeof window !== 'undefined') sessionStorage.setItem(USER_KEY, user.uid);
        } else {
          // Sem dados no Firestore nem sessionStorage: migra do caminho antigo ou usa padrão
          const oldRef = doc(db, 'users', user.uid, 'turmas', 'data');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().turmas?.length > 0) {
            const oldData = oldSnap.data().turmas;
            await setDoc(ref, { turmas: oldData, lastUpdated: Date.now() }, { merge: true });
            setInitialTurmas(oldData);
            salvarLocal(oldData);
          } else {
            // Tenta do outro caminho antigo (campo turmas no próprio perfil do professor)
            const profRef = doc(db, 'professores', user.uid);
            const profSnap = await getDoc(profRef);
            if (profSnap.exists() && profSnap.data().turmas?.length > 0) {
              const oldData = profSnap.data().turmas;
              await setDoc(ref, { turmas: oldData, lastUpdated: Date.now() }, { merge: true });
              setInitialTurmas(oldData);
              salvarLocal(oldData);
            } else if (local && local.length > 0) {
              setInitialTurmas(local);
            } else {
              setInitialTurmas([]);
              salvarLocal([]);
            }
          }
          if (typeof window !== 'undefined') sessionStorage.setItem(USER_KEY, user.uid);
        }
      } catch (e) {
        console.error('Erro ao carregar turmas:', e);
        // Fallback local caso haja falha de rede/conexão para o mesmo usuário
        const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem(USER_KEY) : null;
        if (storedUserId === user.uid) {
          const local = carregarLocal();
          if (local) setInitialTurmas(local);
        }
      } finally {
        setLoadingTurmas(false);
      }
    })();
  }, [user, loading]);

  // Persiste no Firestore (subcoleção isolada) + sessionStorage
  const persistir = (novasTurmas) => {
    if (loadingTurmas) return; // CRÍTICO: Não persiste enquanto estiver carregando os dados iniciais do Firestore!
    const nowTime = Date.now();
    salvarLocal(novasTurmas, nowTime);
    setInitialTurmas(novasTurmas);
    if (typeof window !== 'undefined' && user) sessionStorage.setItem(USER_KEY, user.uid);
    if (!user) return;
    const ref = doc(db, 'professores', user.uid, 'turmas', 'data');
    setDoc(ref, { turmas: novasTurmas, lastUpdated: nowTime }, { merge: true }).catch((e) => {
      console.error('Erro ao salvar turmas:', e);
    });
  };

  const { turmas, setTurmas, addTurma, removeTurma, addAlunos } = useTurmas(initialTurmas || [], persistir);
  const { addAtividade, removeAtividade, setNota } = useNotas(setTurmas);
  const atividadesHook = useAtividades(user?.uid);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);
  const [alunoLinkCopied, setAlunoLinkCopied] = useState(false);
  const alunoDropdownRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('todas'); // 'turma' | 'todas'
  const [bimestre, setBimestre] = useState(() => {
    if (typeof window !== 'undefined') return Number(sessionStorage.getItem('atividades_bimestre')) || 1;
    return 1;
  });

  const handleSetBimestre = (b) => { setBimestre(b); sessionStorage.setItem('atividades_bimestre', b); };
  const turmaAtual = turmas.find((t) => t.id === turmaSelecionada?.id) || turmas[0] || null;

  const handleAddTurma = (nome) => {
    const nova = addTurma(nome);
    setTurmaSelecionada(nova);
  };

  const handleRemoveTurma = (id) => {
    removeTurma(id);
    if (turmaSelecionada?.id === id) {
      const restantes = turmas.filter((t) => t.id !== id);
      setTurmaSelecionada(restantes[0] || null);
    }
  };

  // Fecha dropdown do aluno ao clicar fora
  useEffect(() => {
    const handleClick = (e) => {
      if (alunoDropdownRef.current && !alunoDropdownRef.current.contains(e.target)) {
        setShowAlunoDropdown(false);
      }
    };
    if (showAlunoDropdown) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showAlunoDropdown]);

  // Auth guard
  if (loading || loadingTurmas || (!perfil && user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-3 border-[#f60c49] border-t-transparent animate-spin" />
          <p className="text-sm text-[#6070a0]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  if (
    !perfil?.modulos_permitidos?.includes('gerador-atividades') &&
    !perfil?.modulos_permitidos?.includes('diario-planejamento')
  ) {
    router.replace('/');
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Off-canvas on mobile */}
      <div className={`fixed inset-y-0 left-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 md:w-auto h-full bg-white border-r border-[#dce0f0]`}>
        <Sidebar
          turmas={turmas}
          turmaSelecionada={viewMode === 'turma' ? turmaAtual : null}
          bimestreSelecionado={bimestre}
          user={user}
          onClose={() => setSidebarOpen(false)}
          onSelectTurma={(t) => { setTurmaSelecionada(t); setViewMode('turma'); setSidebarOpen(false); }}
          onSelectBimestre={handleSetBimestre}
          onAddTurma={handleAddTurma}
          onRemoveTurma={handleRemoveTurma}
          onReorderTurmas={setTurmas}
          onLogout={() => router.push('/')}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-2.5 border-b border-[#dce0f0] bg-white flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-[#eef0f8] hover:bg-[#dce0f0] text-[#101942] border border-[#dce0f0] transition-all shadow-2xs whitespace-nowrap"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Hub</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={alunoDropdownRef}>
              <button
                onClick={() => setShowAlunoDropdown(!showAlunoDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#fff2f6] hover:bg-[#ffe5ec] text-[#f60c49] border border-[#fde4ec] transition-all shadow-2xs"
              >
                <GraduationCap size={16} />
                Portal do Aluno
                <ExternalLink size={12} className="opacity-40" />
              </button>

              {showAlunoDropdown && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#dce0f0] rounded-xl shadow-lg z-40 overflow-hidden animate-card-in">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/aluno`);
                      setAlunoLinkCopied(true);
                      setTimeout(() => setAlunoLinkCopied(false), 2000);
                      setShowAlunoDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#101942] hover:bg-[#f7f8fc] transition-colors"
                  >
                    {alunoLinkCopied ? <Check size={15} className="text-[#16a34a]" /> : <Copy size={15} />}
                    {alunoLinkCopied ? 'Copiado!' : 'Copiar link'}
                  </button>
                  <div className="border-t border-slate-100" />
                  <a
                    href="/aluno"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#101942] hover:bg-[#f7f8fc] transition-colors"
                  >
                    <ExternalLink size={15} />
                    Abrir em nova aba
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewMode('todas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                ${viewMode === 'todas'
                  ? 'bg-[#f60c49] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Layers size={13} />
              Banco Completo
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#f7f8fc]">
          {viewMode === 'todas' ? (
            <TodasAtividades
              turmas={turmas}
              user={user}
              useAtividadesHook={atividadesHook}
              onAddAtv={addAtividade}
              onRemoveAtv={removeAtividade}
              onSetNota={setNota}
            />
          ) : turmaAtual ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#fff2f6] border border-[#fde4ec] rounded-full text-[10px] font-bold uppercase tracking-wider text-[#f60c49]">
                  {bimestre}º Bimestre
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#101942] tracking-tight mb-6">
                Turma {turmaAtual.nome}
                <span className="text-xs text-[#6070a0] font-mono ml-2">({turmaAtual.alunos.length} alunos)</span>
              </h1>
              <AtividadesList
                turma={turmaAtual}
                bimestre={bimestre}
                turmas={turmas}
                useAtividadesHook={atividadesHook}
                onAddAtv={addAtividade}
                onRemoveAtv={removeAtividade}
                onSetNota={setNota}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-20">📝</div>
                <p className="text-slate-800 font-semibold text-lg">Selecione uma turma</p>
                <p className="text-sm mt-1 text-slate-400">Escolha uma turma na barra lateral ou use o Banco Completo.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
