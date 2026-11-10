"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotasAluno, getAtividadesDoAluno, getEntregasDoAluno, getRedacaoAluno } from '@/lib/firebase-aluno';
import { AcessoRevisao } from '@/components/revisao/AcessoRevisao';
import { DevolutivasAluno } from '@/components/aluno/DevolutivasAluno';
import { montarHistoricoFeedback, rotuloPeriodo } from '@/dominio/atividades/correcaoManual';
import { BimestreCard } from '@/components/aluno/BimestreCard';
import { calcDesempenhoAnual, fmt } from '@/utils/diario/calculos';
import { ROTULOS_APROVACAO } from '@/dominio/diario/aprovacao';
import { generateBoletimPDF } from '@/lib/aluno/boletim-pdf';
import { formatarDataEntrega, interpretarDataEntrega } from '@/dominio/atividades/dataEntrega';
import { ArrowLeft, PenTool, Sparkles, Download, CheckCircle2, AlertCircle, Clock, BookOpen, User, LogOut } from 'lucide-react';


const statusAtividade = (entrega, encerrada) => {
  if (!entrega) {
    return encerrada
      ? { label: 'Encerrada', cls: 'text-[#5b4b86] bg-[#f3edff] border-[#e2d9f7]' }
      : { label: 'Pendente', cls: 'text-[#6315d9] bg-[#f3edff] border-[#e7dbfd]' };
  }
  if (entrega.status === 'corrigido' || entrega.status === 'revisado')
    return { label: 'Corrigida', cls: 'text-[#166534] bg-[#f0fdf4] border-[#bbf7d0]' };
  if (entrega.status === 'entregue')
    return { label: 'Aguardando Correção', cls: 'text-[#5411B8] bg-[#fff7ed] border-[#fed7aa]' };
  return { label: entrega.status, cls: 'text-[#5b4b86] bg-[#f3edff] border-[#e2d9f7]' };
};

const AtividadeCard = ({ atividade, entrega, token }) => {
  const prazo = interpretarDataEntrega(atividade.dataEntrega);
  const encerrada = prazo ? prazo < new Date() : false;
  const { label, cls } = statusAtividade(entrega, encerrada);
  const nota = entrega?.notaRevisada ?? entrega?.notaFinal;
  const podeClicar = token && (!entrega ? !encerrada : entrega.status === 'corrigido' || entrega.status === 'revisado');

  return (
    <div className="bg-white border border-[#e2d9f7] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
          <span className="text-[10px] text-[#5b4b86] font-semibold">{rotuloPeriodo(atividade)}</span>
          {atividade.tipoAtividade === 'adaptada' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F3EDFF] text-[#25104A] border border-[#E2D9F7]">
              ✨ Acessível DUA
            </span>
          )}
        </div>
        <p className="text-sm font-extrabold text-[#25104a] truncate font-head">{atividade.titulo}</p>
        <p className="text-xs text-[#5b4b86] mt-0.5 flex items-center gap-1">
          <Clock size={12} className="text-[#6e5f94]" />
          Prazo: {formatarDataEntrega(atividade.dataEntrega)}
        </p>
        {nota != null && (
          <p className="text-xs font-mono font-bold text-[#6315d9] mt-1.5">
            Nota: {nota.toFixed(2).replace('.', ',')} / {(atividade.notaMaxima ?? 10).toFixed(1).replace('.', ',')} pts
          </p>
        )}
      </div>
      {podeClicar && (
        <a
          href={`/aluno/atividade/${atividade.id}?token=${token}`}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
            !entrega
              ? 'btn-brand-primary'
              : 'bg-white border border-[#e2d9f7] hover:border-[#25104a] text-[#25104a]'
          }`}
        >
          {!entrega ? 'Responder' : 'Ver Feedback'}
        </a>
      )}
    </div>
  );
};

const AvisoSecao = ({ children, onRetry, tentando, rotulo = 'Tentar novamente' }) => (
  <div role="alert" className="bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl p-4 mb-4">
    <p className="text-xs">{children}</p>
    <button className="underline mt-2 text-xs" onClick={onRetry} disabled={tentando}>
      {tentando ? 'Tentando carregar novamente...' : rotulo}
    </button>
  </div>
);

export default function AlunoNotasPage() {
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [atividades, setAtividades] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [tokens, setTokens] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtv, setAbaAtv] = useState('pendentes');
  const [redacao, setRedacao] = useState(null);
  const [redacoes, setRedacoes] = useState([]);
  const [falhas, setFalhas] = useState({});
  const [recarregando, setRecarregando] = useState(false);
  const [tentativa,setTentativa]=useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('aluno_login');
    if (!raw) {
      router.push('/aluno');
      return;
    }

    let alunoData;
    try {
      alunoData = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem('aluno_login');
      router.push('/aluno');
      return;
    }

    let ativo = true;
    const aindaAtual = () => ativo && sessionStorage.getItem('aluno_login') === raw;
    const { professorUid, turmaId, alunoId } = alunoData;
    const url = `/api/aluno/boletim?professorUid=${encodeURIComponent(professorUid)}&turmaId=${encodeURIComponent(turmaId)}&alunoId=${encodeURIComponent(alunoId)}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Falha na autenticação ou permissão.');
        }
        return res.json();
      })
      .then(async (data) => {
        if (!aindaAtual()) return;
        setDados(anterior => ({ ...alunoData, notas: data.falhas?.notas ? anterior?.notas || {} : data.notas || {} }));
        setFalhas(data.falhas || {});
        if (!data.falhas?.redacoes) {
          setRedacoes(data.redacoes || (data.redacao ? [data.redacao] : []));
          setRedacao(data.redacao || null);
        }
        if (data.redacao && !data.falhas?.redacoes) {
          setRedacao(data.redacao);
          if (alunoData.openRedacao) {
            sessionStorage.setItem('redacao_aluno', JSON.stringify({ professorUid: alunoData.professorUid }));
            router.replace(`/redacao/aluno/${data.redacao.id}`);
            return;
          }
        }

        const atvsData = data.atividades || [];
        if (!data.falhas?.atividades) setAtividades(
          atvsData.sort((a, b) => {
            const pa = interpretarDataEntrega(a.dataEntrega)?.getTime() ?? Number.POSITIVE_INFINITY;
            const pb = interpretarDataEntrega(b.dataEntrega)?.getTime() ?? Number.POSITIVE_INFINITY;
            return pa - pb;
          })
        );
        if (!data.falhas?.entregas) setEntregas(data.entregas || []);
        if (!data.falhas?.tokens) setTokens(data.tokens || {});
      })
      .catch((err) => {
        if (!aindaAtual()) return;
        console.error('Erro ao carregar boletim:', err);
        setErro('Erro ao carregar dados. Tente novamente mais tarde.');
      })
      .finally(() => { if (aindaAtual()) { setLoading(false); setRecarregando(false); } });
    return () => { ativo = false; };
  }, [router,tentativa]);

  const handleLogout = async () => {
    try {
      await fetch('/api/aluno/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aluno_login');
      sessionStorage.removeItem('aluno_base');
      sessionStorage.removeItem('aluno_vinculos');
    }
    router.push('/aluno');
  };

  const recarregarSecoes = () => {
    setErro('');
    setRecarregando(true);
    setTentativa(t => t + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3edff] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#25104a] border-2 border-[#6315d9] animate-spin" />
          <span className="text-xs font-bold text-[#5b4b86]">Carregando suas notas...</span>
        </div>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-[#f3edff] flex items-center justify-center p-4 font-sans">
        <div className="text-center max-w-sm bg-white border border-[#e2d9f7] p-8 rounded-3xl shadow-lg">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f3edff] border border-[#e7dbfd] flex items-center justify-center text-[#6315d9]">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-lg font-extrabold text-[#25104a] mb-2 font-head">Não foi possível carregar</h1>
          <p className="text-xs text-[#5b4b86] mb-6">{erro}</p>
          <button onClick={handleLogout} className="btn-brand-primary px-5 py-2.5 text-xs font-bold">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  const { notas, nome, turmaId } = dados;
  const turma = { bimestres: notas.bimestres || {}, alunos: [{ id: dados.alunoId }], recuperacao: { [dados.alunoId]: notas.recuperacao || {} } };
  const alunoId = dados.alunoId;

  const historicoAtividades = montarHistoricoFeedback({ atividades, entregas, alunoId, turmaId, professorId: dados.professorUid });

  const { bimTotais, S1, S2, totalAnual, statusFinal } = calcDesempenhoAnual(turma, alunoId);
  const coresSituacao = { good: 'text-green-600', bad: 'text-red-600', warn: 'text-blue-600', none: 'text-slate-400' };

  const agora = new Date();
  const pendentes = atividades.filter(atv => {
    const prazo = interpretarDataEntrega(atv.dataEntrega);
    const entrega = entregas.find(e => e.activityId === atv.id);
    return !entrega && prazo && prazo >= agora;
  });
  const realizadas = atividades.filter(atv => {
    const entrega = entregas.find(e => e.activityId === atv.id);
    return !!entrega;
  });
  const encerradas = atividades.filter(atv => {
    const prazo = interpretarDataEntrega(atv.dataEntrega);
    const entrega = entregas.find(e => e.activityId === atv.id);
    return !entrega && prazo && prazo < agora;
  });

  const abaMap = { pendentes, realizadas, encerradas };
  const abaAtual = abaMap[abaAtv] || [];

  return (
    <div className="arte-pagina min-h-screen font-sans selection:bg-[#6315d9] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <AcessoRevisao aluno />

        {/* Header de Navegação */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <button 
            onClick={() => router.push('/aluno')} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#25104a] hover:bg-white border border-[#e2d9f7] bg-white/70 shadow-2xs transition-all"
          >
            <ArrowLeft size={14} /> Voltar ao Portal
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateBoletimPDF({
                nomeAluno: nome,
                turmaNome: turmaId || 'Turma Regular',
                bimTotais,
                bimestres: notas.bimestres || {},
                S1,
                S2,
                totalAnual,
                redacao,
                historicoAtividades
              })}
              className="btn-brand-ghost px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Baixar Boletim em PDF"
            >
              <Download size={14} className="text-[#6315d9]" />
              <span>Baixar Boletim</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-[#6e5f94] hover:text-[#5411b8] hover:bg-[#f3edff] rounded-xl transition-all"
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Card do Estudante */}
        <div className="arte-faixa arte-composicao bg-white border border-[#e2d9f7] rounded-3xl p-4 sm:p-6 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#25104a] text-[#00ddeb] flex items-center justify-center">
              <User size={22} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5b4b86] block">
                Boletim de Desempenho
              </span>
              <h1 className="font-head text-xl sm:text-2xl font-extrabold text-[#25104a] leading-tight [overflow-wrap:anywhere]">
                {nome}
              </h1>
              <p className="text-xs text-[#5b4b86] mt-0.5">
                Turma: <span className="font-semibold text-[#25104a]">{turmaId}</span>
              </p>
            </div>
          </div>

          <div aria-label="Situação anual" className="p-3 rounded-2xl bg-[#f3edff]">
            <span className="text-[11px] font-bold text-[#5b4b86] block">Situação anual</span>
            <span className={`text-sm font-extrabold ${coresSituacao[statusFinal]}`}>{ROTULOS_APROVACAO[statusFinal]}</span>
          </div>
        </div>

        {erro && dados && <AvisoSecao onRetry={recarregarSecoes} tentando={recarregando}>Algumas informações não foram atualizadas agora. A versão anterior continua na tela; pode estar desatualizada.</AvisoSecao>}
        {falhas.tokens && <AvisoSecao onRetry={recarregarSecoes} tentando={recarregando}>Não foi possível carregar os acessos às atividades. Tente novamente para abrir tarefas e devolutivas.</AvisoSecao>}
        {falhas.notas && <AvisoSecao onRetry={recarregarSecoes} tentando={recarregando}>Não foi possível carregar suas notas. Isso não significa que você não tenha nota publicada.</AvisoSecao>}
        {falhas.atividades && <AvisoSecao onRetry={recarregarSecoes} tentando={recarregando}>Não foi possível carregar suas atividades. Isso não significa que não existam tarefas.</AvisoSecao>}
        {falhas.entregas && <AvisoSecao onRetry={recarregarSecoes} tentando={recarregando}>Não foi possível carregar suas entregas e devolutivas. O comprovante pode estar indisponível até a próxima tentativa.</AvisoSecao>}
        {falhas.redacoes && <AvisoSecao onRetry={recarregarSecoes} tentando={recarregando} rotulo="Tentar carregar redações novamente">Não foi possível carregar as redações. Isso não significa que seu histórico esteja vazio.</AvisoSecao>}
        {redacoes.length > 0 && <section className="space-y-3 mb-8" aria-label="Redações publicadas">
          <h2 className="font-bold text-lg">Minhas redações</h2>
          {redacoes.map(r=><article key={r.id} className="bg-white border border-[#e2d9f7] rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3">
            <div><h3 className="font-bold">{r.essayTheme}</h3><p className="text-sm">{r.bimestre}º bimestre · {r.anoLetivo || 'Ano não informado'}</p><p className="text-sm">{r.totalScore==null?'Avaliação parcial — sem nota total':`Nota Final: ${r.totalScore} / 1000`} · {r.revisadoEm?'Revisada pelo professor':(r.metodoCorrecao || r.tipoCorrecao)==='manual'?'Correção manual':'Devolutiva pedagógica'}</p></div>
            <button className="btn-brand-primary rounded-xl px-4 py-2" onClick={()=>{sessionStorage.setItem('redacao_aluno',JSON.stringify({professorUid:dados.professorUid}));router.push(`/redacao/aluno/${r.id}`);}}>Ver relatório</button>
          </article>)}
        </section>}


        {/* Grid dos 4 Bimestres */}
        <div className="mb-8">
          <h2 className="text-lg font-extrabold text-[#25104a] mb-3 font-head">
            Notas por Bimestre
          </h2>
          {(!turma.bimestres || Object.keys(turma.bimestres).length === 0) ? (
            !redacao && (falhas.notas
              ? <p className="text-xs text-[#5411B8] bg-[#F3EDFF] p-6 rounded-2xl border border-[#E2D9F7] text-center">Não foi possível confirmar suas notas agora. Use o botão de nova tentativa acima.</p>
              : <p className="text-xs text-[#6e5f94] bg-white p-6 rounded-2xl border border-dashed border-[#e2d9f7] text-center">Nenhuma nota publicada ainda.</p>)
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((b) => (
                <BimestreCard key={b} numero={b} turma={turma} alunoId={alunoId} />
              ))}
            </div>
          )}
        </div>

        {/* Resumo Anual */}
        <div className="bg-white border border-[#e2d9f7] rounded-3xl p-5 mb-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#25104a] mb-4 font-head">Resumo Semestral e Anual</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[S1, S2].map((semestre, i) => (
              <div key={i} aria-label={`Situação do ${i + 1}º semestre`} className="p-3 bg-[#f3edff] rounded-2xl border border-[#e2d9f7]">
                <span className="text-[10px] font-bold text-[#5b4b86] uppercase tracking-wider block">{i + 1}º Semestre</span>
                <p className={`text-lg font-extrabold font-mono tabular-nums ${coresSituacao[semestre.status]}`}>{fmt(semestre.total)}</p>
                <p className={`text-xs font-bold ${coresSituacao[semestre.status]}`}>{ROTULOS_APROVACAO[semestre.status]}</p>
                <span className="text-[11px] text-[#5b4b86]">Meta mínima: 25,00 pontos</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e2d9f7] pt-4 flex justify-between items-baseline">
            <div>
              <span className="text-xs font-bold text-[#25104a] block">Pontuação Total Anual</span>
              <span className="text-[11px] text-[#5b4b86]">Meta mínima: 50,00 pontos</span>
            </div>
            <span className={`text-2xl font-extrabold font-mono tabular-nums ${coresSituacao[statusFinal]}`}>
              {totalAnual !== null ? fmt(totalAnual) : '—'}
            </span>
          </div>
        </div>

        <DevolutivasAluno historico={historicoAtividades} />

        {/* Atividades Online */}
        {atividades.length > 0 && (
          <div>
            <h2 className="text-xs font-extrabold text-[#5b4b86] uppercase tracking-wider mb-3 font-head">
              Atividades e Tarefas
            </h2>

            {/* Abas */}
            <div className="flex gap-1.5 mb-4 bg-white border border-[#e2d9f7] rounded-2xl p-1 shadow-2xs">
              {[
                { key: 'pendentes', label: 'Pendentes', count: pendentes.length },
                { key: 'realizadas', label: 'Realizadas', count: realizadas.length },
                { key: 'encerradas', label: 'Encerradas', count: encerradas.length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setAbaAtv(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    abaAtv === key 
                      ? 'bg-[#25104a] text-white shadow-2xs'
                      : 'text-[#5b4b86] hover:text-[#25104a]'
                  }`}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      abaAtv === key ? 'bg-[#6315d9] text-white' : 'bg-[#f3edff] text-[#5b4b86]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {abaAtual.length === 0 ? (
                <p className="text-xs text-[#6e5f94] text-center py-8 bg-white border border-dashed border-[#e2d9f7] rounded-2xl">
                  {falhas.atividades || falhas.entregas ? 'Não foi possível confirmar todas as atividades desta categoria. Tente novamente.' : 'Nenhuma atividade nesta categoria.'}
                </p>
              ) : (
                abaAtual.map(atv => (
                  <AtividadeCard
                    key={atv.id}
                    atividade={atv}
                    entrega={entregas.find(e => e.activityId === atv.id) || null}
                    token={tokens[atv.id] || null}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
