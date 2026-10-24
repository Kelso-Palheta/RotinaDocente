"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export const dynamic = "force-dynamic";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTurmas } from '@/hooks/diario/useTurmas';
import { confirmarTrocaContexto } from '@/utils/diario/confirmarTrocaContexto';
import { usePersistenciaDiario } from '@/hooks/diario/usePersistenciaDiario';
import { filtrarTurmasAno, anoLetivoTurma } from '@/dominio/diario/evolucao';
import { useAtividades } from '@/hooks/atividades/useAtividades';
import { useNotas } from '@/hooks/diario/useNotas';
import { AtividadesList } from '@/components/atividades/AtividadesList';
import { TodasAtividades } from '@/components/atividades/TodasAtividades';
import { Sidebar } from '@/components/diario/Sidebar';
import { ProfileModal } from '@/components/diario/ProfileModal';
import { ArrowLeft, GraduationCap, Layers, ExternalLink, Copy, Check, Menu, X, HeartHandshake } from 'lucide-react';

export default function AtividadesPage() {
  const { user, perfil, loading, logout } = useAuth();
  const router = useRouter();

  const persistencia = usePersistenciaDiario(user?.uid);
  const { turmas, setTurmas, addTurma, removeTurma } = useTurmas(persistencia.turmas, persistencia.persistir);
  const { addAtividade, removeAtividade, setNota } = useNotas(setTurmas);
  const baseHook = useAtividades(user?.uid);
  const { aguardarSalvamento, recarregar } = persistencia;
  const sincronizarBase = baseHook.sincronizarTodasAsNotas;
  const sincronizarConfirmado = useCallback(async (escopo) => {
    await aguardarSalvamento();
    const resultado = await sincronizarBase(escopo);
    await recarregar();
    return resultado;
  }, [aguardarSalvamento, recarregar, sincronizarBase]);
  const atividadesHook = { ...baseHook, sincronizarTodasAsNotas: sincronizarConfirmado };
  const [ano, setAno] = useState('legado');
  const [arquivadas, setArquivadas] = useState(false);
  const contextoConta = useRef(null);
  useEffect(() => {
    if (!user?.uid || persistencia.carregando || contextoConta.current === user.uid) return;
    contextoConta.current = user.uid;
    setAno(persistencia.turmas.some(t => !anoLetivoTurma(t)) ? 'legado' : String(new Date().getFullYear()));
  }, [user?.uid, persistencia.carregando, persistencia.turmas]);
  const listaContexto = filtrarTurmasAno(turmas, ano, arquivadas);
  const anos = useMemo(() => [...new Set([new Date().getFullYear(), ...turmas.map(anoLetivoTurma).filter(Boolean)])].sort(), [turmas]);
  const rotulosEstado = { salvo: 'Salvo na nuvem', salvando: 'Salvando…', pendente: 'Alterações pendentes', falha: 'Falha ao salvar', conflito: 'Conflito: revisar alterações', carregando: 'Carregando…' };
  const executar = async acao => { try { await acao(); } catch (erro) { window.alert(erro.message); } };
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);
  const [alunoLinkCopied, setAlunoLinkCopied] = useState(false);
  const alunoDropdownRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('todas'); // 'turma' | 'todas'
  const [bimestre, setBimestre] = useState(() => {
    if (typeof window !== 'undefined') { const salvo = Number(sessionStorage.getItem('atividades_bimestre')); return [1,2,3,4].includes(salvo) ? salvo : 1; }
    return 1;
  });

  const handleSetBimestre = (b) => { if (!confirmarTrocaContexto()) return; setBimestre(b); sessionStorage.setItem('atividades_bimestre', b); };
  const turmaAtual = listaContexto.find((t) => t.id === turmaSelecionada?.id) || listaContexto[0] || null;

  const handleAddTurma = (nome) => {
    if (!persistencia.podeEditar || arquivadas) return;
    const nova = addTurma(nome);
    setTurmas(atual => atual.map(t => t.id === nova.id ? { ...t, anoLetivo: ano === 'legado' ? new Date().getFullYear() : Number(ano) } : t));
    if (ano === 'legado') setAno(String(new Date().getFullYear()));
    setTurmaSelecionada(nova);
  };

  const handleRemoveTurma = (id) => {
    if (!persistencia.podeEditar || arquivadas) return;
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
  if (loading || persistencia.carregando || (!perfil && user)) {
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
          turmas={listaContexto}
          backupTurmas={turmas}
          turmaSelecionada={viewMode === 'turma' ? turmaAtual : null}
          bimestreSelecionado={bimestre}
          user={user}
          onClose={() => setSidebarOpen(false)}
          onSelectTurma={(t) => { if (!confirmarTrocaContexto()) return; setTurmaSelecionada(t); setViewMode('turma'); setSidebarOpen(false); }}
          onSelectBimestre={handleSetBimestre}
          onAddTurma={handleAddTurma}
          onRemoveTurma={handleRemoveTurma}
          onReorderTurmas={ordenadas => persistencia.podeEditar && !arquivadas && setTurmas([...turmas.filter(t => !listaContexto.some(c => c.id === t.id)), ...ordenadas])}
          onImportTurmas={(dados, meta) => persistencia.restaurar(dados, meta)}
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
              onClick={() => confirmarTrocaContexto() && router.push('/')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-[#eef0f8] hover:bg-[#dce0f0] text-[#101942] border border-[#dce0f0] transition-all shadow-2xs whitespace-nowrap"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Hub</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => confirmarTrocaContexto() && router.push('/adaptacoes')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-[#fff2f6] text-[#d40840] border border-[#fde4ec] transition-all shadow-2xs whitespace-nowrap"
              title="Criar ou Adaptar Atividades Inclusivas (DUA/PEI)"
            >
              <HeartHandshake size={16} className="text-[#f60c49]" />
              <span className="hidden sm:inline">Versão Adaptada</span>
              <span className="text-[10px] font-black uppercase bg-[#f60c49] text-white px-1.5 py-0.5 rounded-md">DUA</span>
            </button>

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
              onClick={() => confirmarTrocaContexto() && setViewMode('todas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                ${viewMode === 'todas'
                  ? 'bg-[#f60c49] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
            >
              <Layers size={13} />
              Todas as atividades
            </button>
          </div>
        </div>

        <section aria-label="Contexto das atividades" className="px-6 py-3 border-b flex gap-4 items-center flex-wrap text-xs">
          <span role="status">{rotulosEstado[persistencia.estado] || persistencia.estado}</span>
          <label>Ano letivo <select aria-label="Ano letivo" value={ano} onChange={e => { if (!confirmarTrocaContexto()) return; setAno(e.target.value); setTurmaSelecionada(null); }} className="border rounded p-2"><option value="legado">Legado — ano não informado</option>{anos.map(a => <option key={a} value={a}>{a}</option>)}</select></label>
          <label><input type="checkbox" checked={arquivadas} onChange={e => { if (!confirmarTrocaContexto()) return; setArquivadas(e.target.checked); setTurmaSelecionada(null); }} /> Ver turmas arquivadas (consulta)</label>
          <a href="/diario" className="underline font-bold">Conferir e publicar notas no Diário</a>
        </section>
        {persistencia.erro && <div role="alert" className="p-3 bg-amber-50 text-sm">{persistencia.erro} <button onClick={() => executar(persistencia.tentarNovamente)} className="underline">Tentar novamente</button> <button onClick={() => { if (confirm('Recarregar a nuvem? Preserve antes seu rascunho pelo backup.')) executar(persistencia.recarregar); }} className="underline">Recarregar nuvem</button></div>}
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-[#f7f8fc]">
          {!persistencia.podeEditar ? <p>Edição bloqueada até concluir carregamento ou revisar conflito. Seu rascunho foi preservado.</p> : <fieldset disabled={arquivadas} className="min-w-0">
          {arquivadas && <p className="mb-3 text-amber-800 text-sm">Turmas arquivadas: consulte notas e histórico no Diário.</p>}
          {viewMode === 'todas' ? (
            <TodasAtividades
              key={`${user.uid}:${ano}:${arquivadas}`}
              turmas={listaContexto}
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
                key={`${user.uid}:${turmaAtual.id}:${bimestre}`}
                user={user}
                turma={turmaAtual}
                bimestre={bimestre}
                turmas={listaContexto}
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
                <p className="text-sm mt-1 text-slate-400">Escolha uma turma na barra lateral ou use Todas as atividades.</p>
              </div>
            </div>
          )}
          </fieldset>}
        </div>
      </main>
    </div>
  );
}
