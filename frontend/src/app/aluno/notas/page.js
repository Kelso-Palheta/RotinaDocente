"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotasAluno, getAtividadesDoAluno, getEntregasDoAluno, getRedacaoAluno } from '@/lib/firebase-aluno';
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
      ? { label: 'Encerrada', cls: 'text-[#4f6b63] bg-[#f3f7f5] border-[#d5e3dc]' }
      : { label: 'Pendente', cls: 'text-[#0f766e] bg-[#f3f8f5] border-[#daebe5]' };
  }
  if (entrega.status === 'corrigido' || entrega.status === 'revisado')
    return { label: 'Corrigida', cls: 'text-[#166534] bg-[#f0fdf4] border-[#bbf7d0]' };
  if (entrega.status === 'entregue')
    return { label: 'Aguardando Correção', cls: 'text-[#0B5F59] bg-[#fff7ed] border-[#fed7aa]' };
  return { label: entrega.status, cls: 'text-[#4f6b63] bg-[#f3f7f5] border-[#d5e3dc]' };
};

const AtividadeCard = ({ atividade, entrega, token }) => {
  const prazo = interpretarDataEntrega(atividade.dataEntrega);
  const encerrada = prazo ? prazo < new Date() : false;
  const { label, cls } = statusAtividade(entrega, encerrada);
  const nota = entrega?.notaRevisada ?? entrega?.notaFinal;
  const podeClicar = token && (!entrega ? !encerrada : entrega.status === 'corrigido' || entrega.status === 'revisado');

  return (
    <div className="bg-white border border-[#d5e3dc] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
          <span className="text-[10px] text-[#4f6b63] font-semibold">{rotuloPeriodo(atividade)}</span>
          {atividade.tipoAtividade === 'adaptada' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#F3F8F5] text-[#123C3A] border border-[#D5E3DC]">
              ✨ Acessível DUA
            </span>
          )}
        </div>
        <p className="text-sm font-extrabold text-[#123c3a] truncate font-head">{atividade.titulo}</p>
        <p className="text-xs text-[#4f6b63] mt-0.5 flex items-center gap-1">
          <Clock size={12} className="text-[#566f65]" />
          Prazo: {formatarDataEntrega(atividade.dataEntrega)}
        </p>
        {nota != null && (
          <p className="text-xs font-mono font-bold text-[#0f766e] mt-1.5">
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
              : 'bg-white border border-[#d5e3dc] hover:border-[#123c3a] text-[#123c3a]'
          }`}
        >
          {!entrega ? 'Responder' : 'Ver Feedback'}
        </a>
      )}
    </div>
  );
};

const AvisoSecao = ({ children, onRetry, tentando, rotulo = 'Tentar novamente' }) => (
  <div role="alert" className="bg-[#F3F8F5] border border-[#D5E3DC] rounded-xl p-4 mb-4">
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
      <div className="min-h-screen bg-[#f3f7f5] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#123c3a] border-2 border-[#0f766e] animate-spin" />
          <span className="text-xs font-bold text-[#4f6b63]">Carregando suas notas...</span>
        </div>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-[#f3f7f5] flex items-center justify-center p-4 font-sans">
        <div className="text-center max-w-sm bg-white border border-[#d5e3dc] p-8 rounded-3xl shadow-lg">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f3f8f5] border border-[#daebe5] flex items-center justify-center text-[#0f766e]">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-lg font-extrabold text-[#123c3a] mb-2 font-head">Não foi possível carregar</h1>
          <p className="text-xs text-[#4f6b63] mb-6">{erro}</p>
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
    <div className="min-h-screen bg-[#f3f7f5] font-sans selection:bg-[#0f766e] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Header de Navegação */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push('/aluno')} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#123c3a] hover:bg-white border border-[#d5e3dc] bg-white/70 shadow-2xs transition-all"
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
              <Download size={14} className="text-[#0f766e]" />
              <span>Baixar Boletim</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-[#566f65] hover:text-[#0b5f59] hover:bg-[#f3f8f5] rounded-xl transition-all"
              title="Sair da conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Card do Estudante */}
        <div className="bg-white border border-[#d5e3dc] rounded-3xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#123c3a] text-white flex items-center justify-center shadow-md">
              <User size={22} className="text-[#0f766e]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4f6b63] block">
                Boletim de Desempenho
              </span>
              <h1 className="font-head text-xl font-extrabold text-[#123c3a] leading-tight">
                {nome}
              </h1>
              <p className="text-xs text-[#4f6b63] mt-0.5">
                Turma: <span className="font-semibold text-[#123c3a]">{turmaId}</span>
              </p>
            </div>
          </div>

          <div aria-label="Situação anual" className="p-3 rounded-2xl bg-[#f3f7f5]">
            <span className="text-[11px] font-bold text-[#4f6b63] block">Situação anual</span>
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
          {redacoes.map(r=><article key={r.id} className="bg-white border border-[#d5e3dc] rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3">
            <div><h3 className="font-bold">{r.essayTheme}</h3><p className="text-sm">{r.bimestre}º bimestre · {r.anoLetivo || 'Ano não informado'}</p><p className="text-sm">{r.totalScore==null?'Avaliação parcial — sem nota total':`Nota Final: ${r.totalScore} / 1000`} · {r.revisadoEm?'Revisada pelo professor':(r.metodoCorrecao || r.tipoCorrecao)==='manual'?'Correção manual':'Devolutiva pedagógica'}</p></div>
            <button className="btn-brand-primary rounded-xl px-4 py-2" onClick={()=>{sessionStorage.setItem('redacao_aluno',JSON.stringify({professorUid:dados.professorUid}));router.push(`/redacao/aluno/${r.id}`);}}>Ver relatório</button>
          </article>)}
        </section>}


        {/* Grid dos 4 Bimestres */}
        <div className="mb-8">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#4f6b63] mb-3 font-head">
            Notas por Bimestre
          </h2>
          {(!turma.bimestres || Object.keys(turma.bimestres).length === 0) ? (
            !redacao && (falhas.notas
              ? <p className="text-xs text-[#0B5F59] bg-[#F3F8F5] p-6 rounded-2xl border border-[#D5E3DC] text-center">Não foi possível confirmar suas notas agora. Use o botão de nova tentativa acima.</p>
              : <p className="text-xs text-[#566f65] bg-white p-6 rounded-2xl border border-dashed border-[#d5e3dc] text-center">Nenhuma nota publicada ainda.</p>)
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((b) => (
                <BimestreCard key={b} numero={b} turma={turma} alunoId={alunoId} />
              ))}
            </div>
          )}
        </div>

        {/* Resumo Anual */}
        <div className="bg-white border border-[#d5e3dc] rounded-3xl p-5 mb-8 shadow-sm">
          <h3 className="text-xs font-extrabold text-[#123c3a] uppercase tracking-wider mb-4 font-head">Resumo Semestral e Anual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[S1, S2].map((semestre, i) => (
              <div key={i} aria-label={`Situação do ${i + 1}º semestre`} className="p-3 bg-[#f3f7f5] rounded-2xl border border-[#d5e3dc]">
                <span className="text-[10px] font-bold text-[#4f6b63] uppercase tracking-wider block">{i + 1}º Semestre</span>
                <p className={`text-lg font-extrabold font-mono tabular-nums ${coresSituacao[semestre.status]}`}>{fmt(semestre.total)}</p>
                <p className={`text-xs font-bold ${coresSituacao[semestre.status]}`}>{ROTULOS_APROVACAO[semestre.status]}</p>
                <span className="text-[11px] text-[#4f6b63]">Meta mínima: 25,00 pontos</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#d5e3dc] pt-4 flex justify-between items-baseline">
            <div>
              <span className="text-xs font-bold text-[#123c3a] block">Pontuação Total Anual</span>
              <span className="text-[11px] text-[#4f6b63]">Meta mínima: 50,00 pontos</span>
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
            <h2 className="text-xs font-extrabold text-[#4f6b63] uppercase tracking-wider mb-3 font-head">
              Atividades e Tarefas
            </h2>

            {/* Abas */}
            <div className="flex gap-1.5 mb-4 bg-white border border-[#d5e3dc] rounded-2xl p-1 shadow-2xs">
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
                      ? 'bg-[#123c3a] text-white shadow-2xs'
                      : 'text-[#4f6b63] hover:text-[#123c3a]'
                  }`}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      abaAtv === key ? 'bg-[#0f766e] text-white' : 'bg-[#f3f7f5] text-[#4f6b63]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {abaAtual.length === 0 ? (
                <p className="text-xs text-[#566f65] text-center py-8 bg-white border border-dashed border-[#d5e3dc] rounded-2xl">
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
