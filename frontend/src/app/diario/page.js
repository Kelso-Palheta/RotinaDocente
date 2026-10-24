'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/diario/Sidebar';
import { TurmaView } from '@/components/diario/TurmaView';
import { ProfileModal } from '@/components/diario/ProfileModal';
import { PublicarNotasModal } from '@/components/diario/PublicarNotasModal';
import { ContextoAnoDiario } from '@/components/diario/ContextoAnoDiario';
import { useTurmas } from '@/hooks/diario/useTurmas';
import { useNotas } from '@/hooks/diario/useNotas';
import { usePersistenciaDiario } from '@/hooks/diario/usePersistenciaDiario';
import { dadosIguais } from '@/dominio/diario/comparacao';
import { migrarCriteriosTurmas } from '@/dominio/diario/criterios';
import { filtrarTurmasAno, copiarTurmaParaAno, assinaturaPublicacao, anoLetivoTurma, resumirAssinatura } from '@/dominio/diario/evolucao';
import { confirmarTrocaContexto } from '@/utils/diario/confirmarTrocaContexto';
import { guardarResultadoPublicacao, lerResultadoPublicacao } from '@/infraestrutura/diario/ResultadoPublicacaoRepository';
import { criarBackupVersionado } from '@/dominio/diario/backupTurmas';
import { ArrowLeft, GraduationCap, Award, Menu, BarChart3 } from 'lucide-react';

const ROTULOS_ESTADO = { carregando: 'Carregando', salvando: 'Salvando…', salvo: 'Salvo na nuvem', pendente: 'Pendente', falha: 'Falha ao salvar', conflito: 'Conflito entre versões' };
function baixarJSON(dados, nome) {
  const link = document.createElement('a');
  link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dados, null, 2));
  link.download = nome; link.click();
}

export default function DiarioPage() {
  const { user, perfil, loading } = useAuth();
  const router = useRouter();
  const persistencia = usePersistenciaDiario(user?.uid);
  // Migração somente em memória. Personalizações ficam intactas; nenhum salvamento ao abrir a página.
  const initialTurmas = useMemo(() => migrarCriteriosTurmas(persistencia.turmas), [persistencia.turmas]);
  const { turmas, setTurmas, addTurma, removeTurma, addAlunos, addAlunoManual, removeAluno, removeAlunos,
    setRecuperacao, updateAluno, salvarFrequenciasTurma, salvarOcorrenciasTurma } = useTurmas(initialTurmas, persistencia.persistir);
  const notas = useNotas(setTurmas);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [arquivadas, setArquivadas] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [bimestre, setBimestre] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [publicacao, setPublicacao] = useState(null);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const rascunhoAnterior = useMemo(() => {
    if (!user?.uid || persistencia.carregando) return null;
    try {
      if (sessionStorage.getItem('diario_userId') !== user?.uid) return null;
      const anterior = JSON.parse(sessionStorage.getItem('diario_turmas') || 'null');
      return Array.isArray(anterior) && !dadosIguais(anterior, persistencia.turmas) ? anterior : null;
    } catch { return null; }
  }, [user, persistencia.carregando, persistencia.turmas]);
  const contextoConta = useRef(null);
  const contextoUid = useRef(null);
  const listaContexto = filtrarTurmasAno(turmas, ano, arquivadas);
  const turmaAtual = listaContexto.find(t => t.id === turmaSelecionada) || listaContexto[0] || null;

  useEffect(() => {
    if (!user?.uid || persistencia.carregando || contextoConta.current === user.uid) return;
    contextoConta.current = user.uid;
    let contexto = {};
    try { contexto = JSON.parse(localStorage.getItem(`diario_contexto_${user.uid}`) || '{}'); } catch { /* Preferência inválida não altera dados. */ }
    setAno(contexto.ano || (persistencia.turmas.some(t => !anoLetivoTurma(t)) ? 'legado' : String(new Date().getFullYear())));
    setBimestre([1, 2, 3, 4].includes(contexto.bimestre) ? contexto.bimestre : 1);
    if (contextoUid.current !== user.uid) { setUltimoResultado(null); setPublicacao(null); setShowHistorico(false); setTurmaSelecionada(null); }
    contextoUid.current = user.uid;
  }, [user?.uid, persistencia.carregando, persistencia.turmas]);

  useEffect(() => {
    if (loading) return;
    if (!user || (perfil && !perfil.modulos_permitidos?.includes('diario-planejamento'))) router.replace('/');
  }, [user, perfil, loading, router]);

  useEffect(() => {
    if (user?.uid && contextoConta.current === user.uid) setUltimoResultado(lerResultadoPublicacao(localStorage, user.uid, ano));
  }, [user?.uid, ano]);

  // A navegação iniciada no Meu Horário continua selecionando/criando a turma solicitada.
  useEffect(() => {
    if (persistencia.carregando || !persistencia.podeEditar || !user?.uid) return;
    let ativo = true;
    queueMicrotask(() => {
      if (!ativo) return;
      const nome = new URLSearchParams(window.location.search).get('turma');
      if (!nome) return;
      const encontrada = turmas.find(t => t.nome.trim().toLocaleLowerCase('pt-BR') === nome.trim().toLocaleLowerCase('pt-BR'));
      if (encontrada) { setTurmaSelecionada(encontrada.id); setAno(anoLetivoTurma(encontrada) ? String(anoLetivoTurma(encontrada)) : 'legado'); setArquivadas(Boolean(encontrada.arquivada)); }
      else {
        const nova = addTurma(nome);
        const destino = new Date().getFullYear();
        setTurmas(atual => atual.map(t => t.id === nova.id ? { ...t, anoLetivo: destino } : t), { origem: 'horario', descricao: 'Criar turma a partir do Meu Horário' });
        setTurmaSelecionada(nova.id); setAno(String(destino)); setArquivadas(false);
      }
      window.history.replaceState(null, '', '/diario');
    });
    return () => { ativo = false; };
  }, [persistencia.carregando, persistencia.podeEditar, user?.uid, turmas, addTurma, setTurmas]);

  const contexto = (campo, valor) => {
    if (!confirmarTrocaContexto()) return;
    if (campo === 'ano') { setAno(String(valor)); setTurmaSelecionada(null); }
    else setBimestre(Number(valor));
    try { localStorage.setItem(`diario_contexto_${user.uid}`, JSON.stringify({ ano, bimestre, [campo]: valor })); } catch { /* Preferência não é dado acadêmico. */ }
  };
  const executar = async operacao => { setErroAcao(''); try { return await operacao(); } catch (error) { setErroAcao(error.message); } };

  const handleAddTurma = nome => {
    if (!persistencia.podeEditar) return;
    const nova = addTurma(nome);
    const destino = ano === 'legado' ? new Date().getFullYear() : Number(ano);
    setTurmas(atual => atual.map(t => t.id === nova.id ? { ...t, anoLetivo: destino } : t), { origem: 'cadastro', descricao: `Criar turma ${nome} em ${destino}` });
    setAno(String(destino)); setArquivadas(false); setTurmaSelecionada(nova.id);
  };
  const limparAcessosRemovidos = async (proximas, removidos) => {
    if (!removidos.length) return;
    const { limparVinculosOrfaos } = await import('@/lib/firebase-aluno');
    await limparVinculosOrfaos(user.uid, proximas, removidos);
  };
  const handleRemoveTurma = id => executar(async () => {
    const removida = turmas.find(t => t.id === id);
    await removeTurma(id);
    await limparAcessosRemovidos(turmas.filter(t => t.id !== id), removida?.alunos || []);
  });
  const handleRemoveAluno = (turmaId, alunoId) => executar(async () => {
    const removido = turmas.find(t => t.id === turmaId)?.alunos.find(a => a.id === alunoId);
    await removeAluno(turmaId, alunoId);
    await limparAcessosRemovidos(turmas.map(t => t.id === turmaId ? { ...t, alunos: t.alunos.filter(a => a.id !== alunoId) } : t), removido ? [removido] : []);
  });
  const handleRemoveAlunos = (turmaId, ids) => executar(async () => {
    const removidos = turmas.find(t => t.id === turmaId)?.alunos.filter(a => ids.includes(a.id)) || [];
    await removeAlunos(turmaId, ids);
    await limparAcessosRemovidos(turmas.map(t => t.id === turmaId ? { ...t, alunos: t.alunos.filter(a => !ids.includes(a.id)) } : t), removidos);
  });
  const handleReordenar = recorte => setTurmas(atual => {
    const ids = new Set(recorte.map(t => t.id)); let index = 0;
    return atual.map(t => ids.has(t.id) ? recorte[index++] : t);
  }, { origem: 'organizacao', descricao: 'Reordenar turmas deste ano' });

  const publicar = async ({ turmas: selecionadas, periodo, alvos, resultadoAnterior }) => {
    await persistencia.aguardarSalvamento();
    if (contextoUid.current !== user.uid) throw new Error('A conta mudou. Reabra a publicação na conta correta.');
    const token = await user.getIdToken();
    const response = await fetch('/api/publicar-notas', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: user.uid, nomeProfessor: perfil?.nome || user.displayName || 'Professor', turmas: selecionadas, periodo, alvos }) });
    const data = await response.json();
    if (contextoUid.current !== user.uid) throw new Error('A conta mudou. Reabra a publicação na conta correta.');
    if (!response.ok) throw new Error(data.error || 'Não foi possível publicar.');
    const novos = data.resultados || [];
    const anteriores = resultadoAnterior?.resultados || [];
    const resultados = alvos ? [...anteriores.filter(a => !novos.some(n => n.turmaId === a.turmaId && n.alunoId === a.alunoId)), ...novos] : novos;
    const resultado = { ...data, periodo, resultados, turmaIds: selecionadas.map(t => t.id), em: new Date().toISOString() };
    setUltimoResultado(resultado);
    try {
      await setTurmas(atual => atual.map(t => {
        if (!selecionadas.some(s => s.id === t.id) || (alvos && !alvos.some(a => a.turmaId === t.id))) return t;
        const individuais = resultados.filter(r => r.turmaId === t.id);
        return { ...t, publicacoes: { ...(t.publicacoes || {}), [periodo]: { periodo, em: resultado.em, assinatura: resumirAssinatura(assinaturaPublicacao(t, periodo)), estado: individuais.length && individuais.every(r => r.status === 'ok') ? 'completa' : 'parcial' } } };
      }), { origem: 'publicacao', descricao: `Registrar publicação: ${periodo === 'ano' ? 'ano completo' : periodo + 'º bimestre'}` });
    } catch (error) { resultado.aviso = `As notas foram enviadas, mas o registro de publicação ficou pendente: ${error.message}`; }
    if (!guardarResultadoPublicacao(localStorage, user.uid, ano, resultado)) resultado.aviso = 'Publicação concluída; o resumo não pôde ser guardado neste navegador.';
    return resultado;
  };

  if (loading || persistencia.carregando || (user && !perfil)) return <div className="h-screen flex items-center justify-center text-sm">Carregando Diário…</div>;
  if (!user || !perfil?.modulos_permitidos?.includes('diario-planejamento')) return null;
  return <div className="flex h-screen overflow-hidden bg-white text-[#101942]">
    {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <div className={`fixed inset-y-0 left-0 z-50 w-64 lg:relative lg:translate-x-0 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <Sidebar key={user.uid} turmas={listaContexto} backupTurmas={turmas} turmaSelecionada={turmaAtual} bimestreSelecionado={bimestre} user={user}
        onSelectTurma={t => { if (!confirmarTrocaContexto()) return; setTurmaSelecionada(t.id); setSidebarOpen(false); }} onSelectBimestre={b => { contexto('bimestre', b); setSidebarOpen(false); }}
        onAddTurma={handleAddTurma} onRemoveTurma={handleRemoveTurma} onReorderTurmas={handleReordenar}
        onImportTurmas={(dados, meta) => persistencia.restaurar(dados, meta)} onLogout={() => confirmarTrocaContexto() && router.push('/')} onOpenProfile={() => setShowProfile(true)} onClose={() => setSidebarOpen(false)} />
    </div>
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-3 py-3 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><button type="button" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden"><Menu size={20} /></button><button type="button" onClick={() => confirmarTrocaContexto() && router.push('/')} className="btn-brand-navy p-2 text-xs flex gap-1 items-center"><ArrowLeft size={16} /> Hub</button><span role="status" className={`text-xs font-bold ${persistencia.estado === 'salvo' ? 'text-green-700' : 'text-blue-700'}`}>{ROTULOS_ESTADO[persistencia.estado]}</span></div>
        <div className="flex items-center gap-2 text-xs"><button type="button" onClick={() => setShowHistorico(true)} className="border rounded-xl p-2">Histórico / desfazer</button><button type="button" onClick={() => confirmarTrocaContexto() && router.push('/analytics')} className="btn-brand-navy p-2 flex items-center gap-1"><BarChart3 size={15} /> Analytics</button><button type="button" disabled={!listaContexto.length || !persistencia.podeEditar || arquivadas} onClick={() => setPublicacao({ turmaInicialId: turmaAtual?.id })} className="btn-brand-primary p-2 flex items-center gap-1 disabled:opacity-40"><Award size={15} /> Conferir e publicar</button><a href="/aluno" target="_blank" rel="noopener noreferrer" className="border rounded-xl p-2 flex items-center gap-1"><GraduationCap size={15} /> Portal do Aluno</a></div>
      </header>
      <ContextoAnoDiario turmas={turmas} turmaAtual={turmaAtual} ano={ano} onAno={a => contexto('ano', a)} arquivadas={arquivadas} onArquivadas={valor => { if (confirmarTrocaContexto()) setArquivadas(valor); }}
        onArquivar={() => executar(async () => { if (!confirm(`${turmaAtual.arquivada ? 'Reativar' : 'Arquivar'} a turma ${turmaAtual.nome}? Notas e histórico serão preservados.`)) return; await setTurmas(atual => atual.map(t => t.id === turmaAtual.id ? { ...t, arquivada: !t.arquivada } : t), { origem: 'organizacao', descricao: 'Alterar arquivo da turma' }); })}
        onCopiar={async dados => { const nova = copiarTurmaParaAno(turmaAtual, dados); await setTurmas(atual => [...atual, nova], { origem: 'promocao', descricao: `Copiar alunos para ${dados.anoLetivo} — ${dados.nome}` }); setAno(String(dados.anoLetivo)); setArquivadas(false); setTurmaSelecionada(nova.id); }}
        onAtribuirAno={() => executar(async () => { const destino = prompt('Ano letivo desta turma legada: confirme o ano dos registros existentes.', String(new Date().getFullYear())); if (destino === null) return; const numero = Number(destino); if (!Number.isInteger(numero) || numero < 1900 || numero > 2200) throw new Error('Ano inválido.'); if (!confirm(`Atribuir todos os registros da turma ${turmaAtual.nome} ao ano ${numero}? Nenhuma nota será copiada ou apagada.`)) return; await setTurmas(atual => atual.map(t => t.id === turmaAtual.id ? { ...t, anoLetivo: numero } : t), { origem: 'organizacao', descricao: `Identificar ano letivo ${numero}` }); setAno(String(numero)); })} />
      {(persistencia.erro || erroAcao) && <div role="alert" className="p-3 bg-amber-50 text-amber-900 text-xs flex flex-wrap gap-3 items-center"><span>{erroAcao || persistencia.erro}</span><button type="button" onClick={() => executar(persistencia.tentarNovamente)} className="underline font-bold">Tentar novamente</button><button type="button" onClick={() => baixarJSON(criarBackupVersionado(turmas), 'diario-rascunho.json')} className="underline font-bold">Baixar rascunho</button><button type="button" onClick={() => executar(async () => { if (confirm('Recarregar a versão da nuvem? Baixe antes o rascunho para preservar alterações pendentes.')) await persistencia.recarregar(); })} className="underline font-bold">Recarregar nuvem</button></div>}
      {rascunhoAnterior && <div className="p-3 bg-blue-50 text-blue-900 text-xs flex flex-wrap gap-3"><p>Há dados de uma sessão anterior desta conta diferentes da nuvem. Baixe para conferir e, se necessário, use Restaurar backup. Eles não foram aplicados automaticamente.</p><button type="button" className="underline font-bold" onClick={() => baixarJSON({ formato: 'rotina-docente-turmas', versao: 1, criadoEm: new Date().toISOString(), turmas: rascunhoAnterior }, 'diario-rascunho-anterior.json')}>Baixar rascunho anterior</button></div>}
      {ultimoResultado && <div className="p-2 border-b bg-slate-50 text-xs flex justify-between gap-2"><span>Última publicação: {ultimoResultado.resultados.filter(r => r.status === 'ok').length} publicados · {ultimoResultado.resultados.filter(r => r.status === 'error').length} falhas · {ultimoResultado.resultados.filter(r => r.status === 'semData').length} sem nascimento</span><button type="button" onClick={() => setPublicacao({ turmaInicialId: 'todas', resultadoInicial: ultimoResultado })} className="underline">Ver resultado / repetir falhas</button></div>}
      {!persistencia.podeEditar ? <div className="p-6 text-sm">Edição bloqueada até revisar o carregamento ou conflito. Seu rascunho permanece preservado.</div> : turmaAtual ? <div className="flex-1 flex flex-col overflow-hidden">{turmaAtual.arquivada && <p className="p-2 bg-amber-50 text-xs">Turma arquivada. Reative em “Organizar turma” para editar.</p>}<fieldset disabled={Boolean(turmaAtual.arquivada)} className="flex-1 flex flex-col min-h-0 min-w-0">
        <TurmaView key={`${user.uid}-${turmaAtual.id}-${bimestre}`} turma={turmaAtual} turmas={turmas} bimestre={bimestre} user={user}
          onPublicar={() => setPublicacao({ turmaInicialId: turmaAtual.id })}
          onSetNota={notas.setNota} onImportarSimulado={notas.importarSimulado} onAddAtv={notas.addAtividade} onRemoveAtv={notas.removeAtividade} onUpdateAtvMax={notas.updateAtividadeMax}
          onAddAlunos={addAlunos} onRemoveAluno={handleRemoveAluno} onRemoveAlunos={handleRemoveAlunos} onUpdateConfig={notas.updateConfig} onSetRecuperacao={setRecuperacao}
          onClearAtividadesNota={notas.clearAtividadesNota} onClearAtividadesTurma={notas.clearAtividadesTurma} onClearSimuladoNota={notas.clearSimuladoNota} onClearSimuladoTurma={notas.clearSimuladoTurma}
          onAddAlunoManual={addAlunoManual} onUpdateAluno={updateAluno} onRemoveTurma={handleRemoveTurma} onSalvarFrequencia={salvarFrequenciasTurma} onSalvarOcorrencias={salvarOcorrenciasTurma} />
      </fieldset></div> : <div className="flex-1 flex items-center justify-center text-sm p-5">Nenhuma turma neste ano/filtro. Selecione outro ano ou cadastre uma turma na lateral.</div>}
    </main>
    {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    {publicacao && <PublicarNotasModal turmas={listaContexto} turmaInicialId={publicacao.turmaInicialId} bimestre={bimestre} resultadoInicial={publicacao.resultadoInicial} onPublicar={publicar} onClose={() => setPublicacao(null)} />}
    {showHistorico && <div className="fixed inset-0 z-[100] bg-slate-950/50 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Histórico do Diário" className="bg-white rounded-2xl p-5 w-full max-w-3xl max-h-[90vh] overflow-auto"><div className="flex justify-between"><h2 className="font-bold">Histórico e desfazer</h2><button type="button" onClick={() => setShowHistorico(false)} className="border rounded p-2 text-xs">Fechar</button></div><p className="text-xs text-slate-600 my-3">Últimas 20 alterações feitas neste navegador, isoladas por conta. Desfazer só aplica quando os campos continuam iguais aos valores registrados.</p>{[...persistencia.historico].reverse().map(r => <div key={r.id} className="border rounded-xl p-3 my-2 text-xs"><p className="font-bold">{r.descricao}</p><p>{new Date(r.criadoEm).toLocaleString('pt-BR')} · {r.origem} · {r.autor}</p><details><summary>Ver valores anteriores e novos</summary><pre className="whitespace-pre-wrap break-all max-h-48 overflow-auto">{JSON.stringify(r.alteracoes, null, 2)}</pre></details><button type="button" onClick={() => executar(async () => { if (confirm('Desfazer esta alteração? Campos modificados depois serão protegidos.')) await persistencia.desfazer(r); })} className="underline mt-2">Desfazer alteração</button></div>)}{!persistencia.historico.length && <p className="text-sm">Nenhuma alteração neste navegador.</p>}</section></div>}
  </div>;
}
