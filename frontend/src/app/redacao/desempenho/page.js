"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { gerarLoginKey, resolverLoginsAlunos } from '@/utils/diario/loginAluno';
import { ArrowLeft, BarChart3, Users, TrendingUp, Award, Trash2, Search, ExternalLink, Link2, Shield, AlertCircle, MoreVertical, Eye, Copy, Check, GraduationCap } from 'lucide-react';

export default function DesempenhoPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();

  const [corrections, setCorrections] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [claimLogin, setClaimLogin] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [viewingCorrection, setViewingCorrection] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [toast, setToast] = useState('');
  const [selectedTurma, setSelectedTurma] = useState('all');
  const [selectedBimestre, setSelectedBimestre] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const handleClose = () => setActiveMenu(null);
    if (activeMenu) {
      window.addEventListener('click', handleClose);
    }
    return () => window.removeEventListener('click', handleClose);
  }, [activeMenu]);

  const handleCopyLink = (c) => {
    const link = `${window.location.origin}/redacao/aluno/${c.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setToast('Link de acesso copiado!');
    }).catch(() => {
      setToast('Erro ao copiar link');
    });
  };

  const handleCopyLogin = (c) => {
    const login = c.loginAluno || c.id.substring(0, 8);
    navigator.clipboard.writeText(login).then(() => {
      setToast('Login do aluno copiado!');
    }).catch(() => {
      setToast('Erro ao copiar login');
    });
  };

  // 1. Carrega as turmas do diário
  useEffect(() => {
    if (!user) return;
    const loadTurmas = async () => {
      try {
        // Tenta carregar do subdocumento 'turmas/data' (onde o diário salva de fato)
        const refSub = doc(db, 'professores', user.uid, 'turmas', 'data');
        const snapSub = await getDoc(refSub);
        if (snapSub.exists() && snapSub.data().turmas) {
          setTurmas(snapSub.data().turmas);
          return;
        }
        // Fallback para o documento raiz
        const ref = doc(db, 'professores', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().turmas) {
          setTurmas(snap.data().turmas);
        }
      } catch (err) {
        console.error('Erro ao carregar turmas no desempenho:', err);
      }
    };
    loadTurmas();
  }, [user]);

  // 2. Carrega as correções
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, 'professores', user.uid, 'correcoes'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ ...d.data(), _firestoreId: d.id }));
        list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        setCorrections(list);
      } catch (err) {
        console.error('Erro ao carregar correções:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // 3. Sincroniza logins automaticamente com base nas datas de nascimento do Diário Pedagógico
  useEffect(() => {
    if (!user || loading || turmas.length === 0 || corrections.length === 0) return;

    const migrarLogins = async () => {
      let mudou = false;
      const novasCorrecoes = [...corrections];
      setSyncStatus('Sincronizando logins...');

      for (let i = 0; i < novasCorrecoes.length; i++) {
        const c = novasCorrecoes[i];
        let alunoEncontrado = null;
        let turmaDoAluno = null;

        // Encontra o aluno correspondente nas turmas do diário (busca por nome exato)
        for (const t of turmas) {
          const al = t.alunos?.find(a => a.nome.trim().toLowerCase() === c.studentName.trim().toLowerCase());
          if (al) {
            alunoEncontrado = al;
            turmaDoAluno = t;
            break;
          }
        }

        if (alunoEncontrado && alunoEncontrado.dataNascimento) {
          const resolvidos = resolverLoginsAlunos(turmaDoAluno.alunos || []);
          const alvo = resolvidos.find((r) => r.aluno.id === alunoEncontrado.id);
          const targetLogin = alvo?.login || '';
          if (!targetLogin) continue;
          const targetKey = await gerarLoginKey(targetLogin);

          // Se o login ou ID da correção for diferente do esperado
          if (c.loginAluno !== targetLogin || c.id !== targetKey) {
            try {
              const oldId = c._firestoreId || c.id;
              const newCorrData = {
                ...c,
                id: targetKey,
                loginAluno: targetLogin,
                studentClass: turmaDoAluno.nome,
                _firestoreId: targetKey
              };

              // Salva com a nova chave e atualiza
              await setDoc(doc(db, 'professores', user.uid, 'correcoes', targetKey), newCorrData);

              // Remove o documento sob o ID antigo
              if (oldId !== targetKey) {
                await deleteDoc(doc(db, 'professores', user.uid, 'correcoes', oldId));
              }

              // Cria ou atualiza o vínculo de login do aluno
              await setDoc(doc(db, 'alunoLogin', targetKey, 'vinculos', user.uid), {
                professorUid: user.uid,
                turmaId: turmaDoAluno.id || 'N/A',
                turmaNome: turmaDoAluno.nome || 'N/A',
                modulo: 'redacao',
                nomeProfessor: perfil?.nome || user?.displayName || 'Professor'
              }, { merge: true });

              novasCorrecoes[i] = newCorrData;
              mudou = true;
            } catch (err) {
              console.error('Erro ao sincronizar login:', err);
            }
          }
        }
      }

      if (mudou) {
        setCorrections(novasCorrecoes);
      }
      setSyncStatus('');
    };

    migrarLogins();
  }, [user, turmas, corrections, loading, perfil]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir as ${selectedIds.size} redações selecionadas? Essa ação apagará essas correções definitivamente do seu histórico e não poderá ser desfeita.`)) return;

    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(async (id) => {
        const c = corrections.find(x => x.id === id);
        const fbId = c?._firestoreId || id;
        await deleteDoc(doc(db, 'professores', user.uid, 'correcoes', fbId));
        await deleteDoc(doc(db, 'alunoLogin', id, 'vinculos', user.uid));
      }));

      setCorrections(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      setToast(`${selectedIds.size} redações excluídas.`);
    } catch (err) {
      console.error('Erro na exclusão em lote:', err);
      setToast('Erro ao excluir redações.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleClaim = async () => {
    const login = claimLogin.trim().toLowerCase();
    if (!login) return;
    setClaiming(true);
    setClaimMsg('');

    try {
      const loginKey = await gerarLoginKey(login);

      // Busca em todos os professores
      const professoresSnap = await getDocs(collection(db, 'professores'));
      let found = null;
      let foundProfessorUid = null;

      for (const profDoc of professoresSnap.docs) {
        const corrRef = doc(db, 'professores', profDoc.id, 'correcoes', loginKey);
        const corrSnap = await getDoc(corrRef);
        if (corrSnap.exists()) {
          found = corrSnap.data();
          foundProfessorUid = profDoc.id;
          break;
        }
      }

      if (!found) {
        // Tenta buscar por loginAluno (formato antigo)
        for (const profDoc of professoresSnap.docs) {
          const qSnap = await getDocs(query(
            collection(db, 'professores', profDoc.id, 'correcoes'),
            where('loginAluno', '==', login)
          ));
          if (!qSnap.empty) {
            const docData = qSnap.docs[0].data();
            found = docData;
            foundProfessorUid = profDoc.id;
            break;
          }
        }
      }

      if (!found) {
        setClaimMsg('Correção não encontrada. Verifique o login do aluno.');
      } else if (foundProfessorUid === user.uid) {
        setClaimMsg('Esta correção já está no seu histórico.');
      } else {
        // Copia para o professor atual
        const corrData = { ...found, userId: user.uid, id: loginKey };
        await setDoc(doc(db, 'professores', user.uid, 'correcoes', loginKey), corrData);

        // Cria vínculo
        await setDoc(doc(db, 'alunoLogin', loginKey, 'vinculos', user.uid), {
          professorUid: user.uid,
          turmaId: found.studentClass || 'N/A',
          modulo: 'redacao',
          nomeProfessor: perfil?.nome || user?.displayName || 'Professor'
        }, { merge: true });

        setClaimMsg(`✅ Correção de "${found.studentName}" vinculada com sucesso!`);
        setClaimLogin('');
        
        // Recarrega a lista
        const q = query(collection(db, 'professores', user.uid, 'correcoes'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ ...d.data(), _firestoreId: d.id }));
        list.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        setCorrections(list);
      }
    } catch (err) {
      setClaimMsg('Erro: ' + err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (authLoading || (!perfil && user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f60c49] to-[#d40840] animate-pulse shadow-2xl shadow-[#f60c49]/20" />
      </div>
    );
  }

  if (!user) {
    router.replace('/');
    return null;
  }

  const filtered = corrections.filter(c =>
    (!search || c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    c.studentClass?.toLowerCase().includes(search.toLowerCase()) ||
    c.essayTheme?.toLowerCase().includes(search.toLowerCase()) ||
    c.id?.toLowerCase().includes(search.toLowerCase())) &&
    (Number(c.bimestre) || 1) === selectedBimestre
  );

  const bimestreCorrections = corrections.filter(c => (Number(c.bimestre) || 1) === selectedBimestre);
  const total = bimestreCorrections.length;
  const avgScore = total > 0 ? Math.round(bimestreCorrections.reduce((s, c) => s + (c.totalScore || 0), 0) / total) : 0;
  const maxScore = total > 0 ? Math.max(...bimestreCorrections.map(c => c.totalScore || 0)) : 0;

  const formatarData = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta correção permanentemente?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'professores', user.uid, 'correcoes', id));
      setCorrections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const getTurmaRows = () => {
    if (selectedTurma === 'all') return [];
    const currentTurma = turmas.find(t => t.id === selectedTurma);
    if (!currentTurma) return [];

    const queryStr = search.toLowerCase().trim();
    const students = currentTurma.alunos || [];

    const loginsPorId = new Map(
      resolverLoginsAlunos(students).map((r) => [r.aluno.id, r.login])
    );

    const rows = [];
    students.forEach(al => {
      const login = loginsPorId.get(al.id) || '';
      
      // Busca correções deste aluno
      const studentCorrections = corrections.filter(c => 
        c.studentName?.trim().toLowerCase() === al.nome.trim().toLowerCase() &&
        (Number(c.bimestre) || 1) === selectedBimestre
      );

      // Filtro de busca simples
      const matchesSearch = !queryStr || 
        al.nome.toLowerCase().includes(queryStr) ||
        login.toLowerCase().includes(queryStr) ||
        studentCorrections.some(c => 
          c.essayTheme?.toLowerCase().includes(queryStr) || 
          String(c.totalScore).includes(queryStr)
        );

      if (!matchesSearch) return;

      if (studentCorrections.length === 0) {
        rows.push({
          id: `no-corr-${al.id}`,
          alunoNome: al.nome,
          login: login,
          hasCorrection: false,
          correction: null
        });
      } else {
        studentCorrections.forEach((c, idx) => {
          rows.push({
            id: `${c.id || c._firestoreId}-${idx}`,
            alunoNome: al.nome,
            login: login,
            hasCorrection: true,
            correction: c
          });
        });
      }
    });

    return rows;
  };

  const turmaRows = getTurmaRows();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans"
      style={{
        backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99,102,241,0.06), transparent), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(99,102,241,0.03), transparent)',
      }}
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm overflow-x-auto no-scrollbar gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/redacao')}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-[#fff2f6] hover:bg-[#fde4ec] text-[#f60c49] border border-[#f60c49]/30 hover:border-[#f60c49]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight whitespace-nowrap">
            <BarChart3 size={18} className="text-[#f60c49]" /> Minhas Correções
          </h1>
        </div>
        {syncStatus && (
          <span className="text-[10px] sm:text-xs text-[#f60c49] bg-[#fff2f6] border border-[#fde4ec] px-2 sm:px-3 py-1 rounded-full animate-pulse font-medium whitespace-nowrap">
            🔄 {syncStatus}
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Stats Panel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-5">
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:justify-start justify-center gap-1.5 sm:gap-4 transition-transform duration-300 hover:-translate-y-0.5 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center border border-blue-100"><Users className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-blue-500" /></div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5 sm:mb-0 truncate" title="Total Corrigido">Total</p>
              <p className="text-lg sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">{total}</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:justify-start justify-center gap-1.5 sm:gap-4 transition-transform duration-300 hover:-translate-y-0.5 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-50 flex flex-shrink-0 items-center justify-center border border-amber-100"><TrendingUp className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-amber-500" /></div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5 sm:mb-0 truncate" title="Média Geral">Média</p>
              <p className="text-lg sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">{avgScore}</p>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:justify-start justify-center gap-1.5 sm:gap-4 transition-transform duration-300 hover:-translate-y-0.5 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 flex flex-shrink-0 items-center justify-center border border-emerald-100"><Award className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-emerald-500" /></div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5 sm:mb-0 truncate" title="Maior Nota">Maior</p>
              <p className="text-lg sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight">{maxScore}</p>
            </div>
          </div>
        </div>

        {/* Vincular Correção & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vincular */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-[#fff2f6] rounded-lg"><Link2 size={16} className="text-[#f60c49]" /></div>
              <h3 className="text-sm font-bold text-slate-800">Vincular Correção</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Vincule a correção de um aluno informando o login cadastrado (Ex: nome + data de nascimento).</p>
            <div className="space-y-2">
              <input
                value={claimLogin}
                onChange={e => { setClaimLogin(e.target.value); setClaimMsg(''); }}
                onKeyDown={e => e.key === 'Enter' && handleClaim()}
                placeholder="Ex: maria0704"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/50 transition-all font-mono"
              />
              <button onClick={handleClaim} disabled={claiming || !claimLogin.trim()}
                className="w-full py-2.5 bg-[#f60c49] hover:bg-[#d40840] disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-white text-xs font-bold transition-all shadow-sm">
                {claiming ? 'Vinculando...' : 'Vincular à Conta'}
              </button>
            </div>
            {claimMsg && (
              <div className={`p-3 rounded-xl border text-xs flex gap-2 items-start ${claimMsg.startsWith('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span className="font-medium">{claimMsg}</span>
              </div>
            )}
          </div>

          {/* Lista & Busca */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4 md:col-span-2 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#fff2f6] rounded-lg"><Search size={16} className="text-[#f60c49]" /></div>
                <h3 className="text-sm font-bold text-slate-800">Filtrar Histórico</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {selectedTurma === 'all' ? `${filtered.length} redações` : `${turmaRows.length} registros`}
              </span>
            </div>

            {/* Seletor de Turmas */}
            {turmas.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 pb-1 border-b border-slate-100/80">
                <button
                  onClick={() => setSelectedTurma('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedTurma === 'all'
                      ? 'bg-[#f60c49] border-[#f60c49] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Todas as Turmas
                </button>
                {turmas.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTurma(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedTurma === t.id
                        ? 'bg-[#f60c49] border-[#f60c49] text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.nome}
                  </button>
                ))}
              </div>
            )}

            {/* Seletor de Bimestres */}
            <div className="flex flex-wrap gap-2 pt-1 pb-1 border-b border-slate-100/80">
              {[1, 2, 3, 4].map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBimestre(b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedBimestre === b
                      ? 'bg-[#f60c49] border-[#f60c49] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {b}º Bimestre
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={selectedTurma === 'all' ? "Buscar por nome do aluno, turma, tema ou ID..." : "Buscar aluno nesta turma..."}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/50 transition-all" />
            </div>

            <div className="flex-1 overflow-hidden min-h-[300px] flex flex-col justify-between">
              {loading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100/65 rounded-xl animate-pulse" />)}
                </div>
              ) : (selectedTurma === 'all' ? filtered.length === 0 : turmaRows.length === 0) ? (
                <div className="text-center py-16 flex-1 flex flex-col items-center justify-center">
                  <div className="text-4xl mb-2 opacity-30">📂</div>
                  <p className="text-slate-400 text-sm font-medium">{search ? 'Nenhum resultado encontrado.' : 'Nenhuma redação ou aluno encontrado.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                  
                  {/* Bulk Actions Header */}
                  {selectedIds.size > 0 && selectedTurma === 'all' && (
                    <div className="bg-[#fff2f6]/80 px-4 py-3 border-b border-[#fde4ec] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#101942] flex items-center gap-2">
                        <Check size={16} className="text-[#f60c49]" />
                        {selectedIds.size} redaç{selectedIds.size === 1 ? 'ão' : 'ões'} selecionada{selectedIds.size === 1 ? '' : 's'}
                      </span>
                      <button
                        onClick={handleBulkDelete}
                        disabled={bulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                      >
                        {bulkDeleting ? <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" /> : <Trash2 size={14} />}
                        Excluir Selecionadas
                      </button>
                    </div>
                  )}

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75">
                        {selectedTurma === 'all' && (
                          <th className="text-left px-4 py-3.5 w-10">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded text-[#f60c49] focus:ring-[#f60c49] border-slate-300 cursor-pointer"
                              checked={filtered.length > 0 && selectedIds.size === filtered.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(new Set(filtered.map(c => c.id)));
                                } else {
                                  setSelectedIds(new Set());
                                }
                              }}
                            />
                          </th>
                        )}
                        <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aluno</th>
                        <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                        {selectedTurma === 'all' && (
                          <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Turma</th>
                        )}
                        <th className="text-left px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tema</th>
                        <th className="text-center px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nota</th>
                        <th className="text-center px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Login</th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTurma === 'all' ? (
                        filtered.map(c => (
                          <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(c.id) ? 'bg-[#fff2f6]/70' : ''}`}>
                            <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-[#f60c49] focus:ring-[#f60c49] border-slate-300 cursor-pointer"
                                checked={selectedIds.has(c.id)}
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  if (e.target.checked) next.add(c.id);
                                  else next.delete(c.id);
                                  setSelectedIds(next);
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{c.studentName}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 font-medium">{formatarData(c.createdAt)}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 font-medium">{c.studentClass}</td>
                            <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[160px]" title={c.essayTheme}>{c.essayTheme}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex font-mono font-bold text-xs px-2.5 py-1 rounded-lg border shadow-sm
                                ${(c.totalScore || 0) >= 600
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                  : (c.totalScore || 0) >= 400
                                    ? 'bg-amber-50 border-amber-100 text-amber-600'
                                    : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                                {c.totalScore || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span 
                                onClick={() => {
                                  const loginVal = c.loginAluno || c.id.substring(0, 8);
                                  navigator.clipboard.writeText(loginVal);
                                  setToast('Login do aluno copiado!');
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#f60c49] bg-[#fff2f6] hover:bg-[#fde4ec] border border-[#fde4ec] px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                                title="Clique para copiar"
                              >
                                <Shield size={10} /> {c.loginAluno || c.id.substring(0, 8)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity relative">
                                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === c.id ? null : c.id); }}
                                  className="p-2 text-slate-400 hover:bg-slate-100 hover:text-[#f60c49] rounded-xl transition-all"
                                  title="Ações"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {activeMenu === c.id && (
                                  <div className="absolute right-9 top-0 w-48 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                    <button onClick={() => { setViewingCorrection(c); setActiveMenu(null); }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                      <Eye size={12} className="text-slate-400" />
                                      Ver relatório
                                    </button>
                                    <button onClick={() => { handleCopyLink(c); setActiveMenu(null); }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                      <Link2 size={12} className="text-slate-400" />
                                      Copiar link
                                    </button>
                                    <button onClick={() => { handleCopyLogin(c); setActiveMenu(null); }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                      <Shield size={12} className="text-slate-400" />
                                      Copiar login
                                    </button>
                                    <a href={`/redacao/aluno/${c.id}`} target="_blank" rel="noopener noreferrer" onClick={() => setActiveMenu(null)}
                                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                      <ExternalLink size={12} className="text-slate-400" />
                                      Abrir em nova aba
                                    </a>
                                  </div>
                                )}

                                <button onClick={() => handleDelete(c._firestoreId || c.id)} disabled={deleting === c.id}
                                  className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        turmaRows.map(row => {
                          const { alunoNome, login, hasCorrection, correction, id } = row;
                          const displayLogin = login || correction?.loginAluno || correction?.id?.substring(0, 8);

                          return (
                            <tr key={id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 py-3 font-semibold text-slate-800">{alunoNome}</td>
                              <td className="px-4 py-3 text-xs text-slate-500 font-medium">
                                {hasCorrection ? formatarData(correction.createdAt) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[200px]" title={hasCorrection ? correction.essayTheme : ''}>
                                {hasCorrection ? correction.essayTheme : <span className="text-slate-300 italic">Nenhuma redação corrigida</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {hasCorrection ? (
                                  <span className={`inline-flex font-mono font-bold text-xs px-2.5 py-1 rounded-lg border shadow-sm
                                    ${(correction.totalScore || 0) >= 600
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                      : (correction.totalScore || 0) >= 400
                                        ? 'bg-amber-50 border-amber-100 text-amber-600'
                                        : 'bg-rose-50 border-rose-100 text-rose-500'}`}>
                                    {correction.totalScore || 0}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {displayLogin ? (
                                  <span 
                                    onClick={() => {
                                      navigator.clipboard.writeText(displayLogin);
                                      setToast('Login do aluno copiado!');
                                    }}
                                    className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#f60c49] bg-[#fff2f6] hover:bg-[#fde4ec] border border-[#fde4ec] px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                                    title="Clique para copiar"
                                  >
                                    <Shield size={10} /> {displayLogin}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-300 italic">Sem data</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {hasCorrection ? (
                                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity relative">
                                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === id ? null : id); }}
                                      className="p-2 text-slate-400 hover:bg-slate-100 hover:text-[#f60c49] rounded-xl transition-all"
                                      title="Ações"
                                    >
                                      <MoreVertical size={14} />
                                    </button>

                                    {activeMenu === id && (
                                      <div className="absolute right-9 top-0 w-48 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                                        <button onClick={() => { setViewingCorrection(correction); setActiveMenu(null); }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                          <Eye size={12} className="text-slate-400" />
                                          Ver relatório
                                        </button>
                                        <button onClick={() => { handleCopyLink(correction); setActiveMenu(null); }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                          <Link2 size={12} className="text-slate-400" />
                                          Copiar link
                                        </button>
                                        {displayLogin && (
                                          <button onClick={() => { handleCopyLogin(correction); setActiveMenu(null); }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                            <Shield size={12} className="text-slate-400" />
                                            Copiar login
                                          </button>
                                        )}
                                        <a href={`/redacao/aluno/${correction.id}`} target="_blank" rel="noopener noreferrer" onClick={() => setActiveMenu(null)}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#f60c49] flex items-center gap-2 transition-all">
                                          <ExternalLink size={12} className="text-slate-400" />
                                          Abrir em nova aba
                                        </a>
                                      </div>
                                    )}

                                    <button onClick={() => handleDelete(correction._firestoreId || correction.id)} disabled={deleting === correction.id}
                                      className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                                      title="Excluir"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Modal de visualização da correção */}
      {viewingCorrection && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-10 px-4 overflow-y-auto"
          onClick={() => setViewingCorrection(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-card-in my-8"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{viewingCorrection.studentName}</h2>
                <p className="text-xs text-slate-400">
                  Turma {viewingCorrection.studentClass} • Tema: {viewingCorrection.essayTheme}
                  {viewingCorrection.loginAluno && <span className="ml-2 font-mono text-[#f60c49]">({viewingCorrection.loginAluno})</span>}
                </p>
              </div>
              <button onClick={() => setViewingCorrection(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">✕</button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Score */}
              {viewingCorrection.totalScore != null && (
                <div className="text-center py-4 bg-gradient-to-br from-[#fff2f6] to-[#eef0f8] rounded-2xl">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Nota Final</p>
                  <span className={`text-6xl font-black tracking-tighter tabular-nums ${viewingCorrection.totalScore >= 600 ? 'text-green-500' : viewingCorrection.totalScore >= 400 ? 'text-blue-500' : 'text-red-500'}`}>
                    {viewingCorrection.totalScore}
                  </span>
                  <span className="text-xl text-slate-400 font-bold ml-1">/ 1000</span>
                </div>
              )}

              {/* Competency scores */}
              {viewingCorrection.scoreData?.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {viewingCorrection.scoreData.map((item, i) => {
                    const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6'];
                    const labels = ['C1','C2','C3','C4','C5'];
                    return (
                      <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">{labels[i]}</p>
                        <span className="text-lg font-black tabular-nums" style={{color: colors[i]}}>{item.A || 0}</span>
                        <span className="text-[10px] text-slate-400 block">/200</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Feedback text */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Análise Pedagógica</h3>
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {viewingCorrection.result}
                </div>
              </div>

              {/* Student link */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">O aluno acessa esta correção pelo login:</p>
                <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-[#f60c49] bg-[#fff2f6] px-3 py-1.5 rounded-xl">
                  <Shield size={14} />
                  {viewingCorrection.loginAluno || viewingCorrection.id?.substring(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check size={14} className="text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
