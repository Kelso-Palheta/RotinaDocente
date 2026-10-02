"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotasAluno, getAtividadesDoAluno, getEntregasDoAluno, getRedacaoAluno } from '@/lib/firebase-aluno';
import { calcTotal, calcSemestre, fmt } from '@/utils/diario/calculos';
import { generateBoletimPDF } from '@/lib/aluno/boletim-pdf';
import { ArrowLeft, PenTool, Sparkles, Download, CheckCircle2, AlertCircle, Clock, BookOpen, User, LogOut } from 'lucide-react';

const BimestreCard = ({ numero, turma, alunoId }) => {
  const bData = turma.bimestres[String(numero)];
  if (!bData) return null;
  const { atividades = [], notas = {}, config } = bData;
  const nota = notas[alunoId];
  const total = calcTotal(nota?.simulado, atividades, nota, config);

  return (
    <div className="bg-white border border-[#dce0f0] rounded-2xl p-4 shadow-2xs hover:border-[#f60c49]/30 transition-all">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-extrabold text-[#101942] uppercase tracking-wider font-head">{numero}º Bimestre</h3>
        {total !== null && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
            total >= 6.0 
              ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]' 
              : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
          }`}>
            {total >= 6.0 ? 'Satisfatório' : 'Atenção'}
          </span>
        )}
      </div>

      {atividades.length > 0 || nota?.simulado != null ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs py-1 border-b border-[#dce0f0]/60">
            <span className="text-[#6070a0] font-medium">Simulado Oficial</span>
            <span className="font-mono text-[#101942] font-bold tabular-nums">
              {nota?.simulado != null && nota?.simulado !== '' ? fmt(nota.simulado) : '0,00'}
            </span>
          </div>
          {atividades.map((atv) => {
            const v = nota?.[atv.id];
            return (
              <div key={atv.id} className="flex justify-between text-xs py-1 border-b border-[#dce0f0]/40">
                <span className="text-[#6070a0] truncate mr-2 max-w-[160px] font-medium" title={atv.nome}>
                  {atv.nome}
                </span>
                <span className="font-mono text-[#101942] font-semibold tabular-nums">
                  {v != null && v !== '' ? fmt(v) : '0,00'} <span className="text-[#9098c0] font-normal text-[10px]">/ {fmt(atv.max)}</span>
                </span>
              </div>
            );
          })}
          <div className="flex justify-between text-sm mt-3 pt-2.5 border-t border-[#dce0f0]">
            <span className="font-extrabold text-[#101942] font-head">Total do Bimestre</span>
            <span className="font-extrabold font-mono text-[#f60c49] tabular-nums text-base">{fmt(total)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#9098c0] py-4 text-center">Nenhuma atividade registrada.</p>
      )}
    </div>
  );
};

const statusAtividade = (entrega, encerrada) => {
  if (!entrega) {
    return encerrada
      ? { label: 'Encerrada', cls: 'text-[#6070a0] bg-[#f7f8fc] border-[#dce0f0]' }
      : { label: 'Pendente', cls: 'text-[#f60c49] bg-[#fff2f6] border-[#fde4ec]' };
  }
  if (entrega.status === 'corrigido' || entrega.status === 'revisado')
    return { label: 'Corrigida', cls: 'text-[#166534] bg-[#f0fdf4] border-[#bbf7d0]' };
  if (entrega.status === 'entregue')
    return { label: 'Aguardando Correção', cls: 'text-[#9a3412] bg-[#fff7ed] border-[#fed7aa]' };
  return { label: entrega.status, cls: 'text-[#6070a0] bg-[#f7f8fc] border-[#dce0f0]' };
};

const AtividadeCard = ({ atividade, entrega, token }) => {
  const prazo = atividade.dataEntrega?.toDate?.() || new Date(atividade.dataEntrega);
  const encerrada = prazo < new Date();
  const { label, cls } = statusAtividade(entrega, encerrada);
  const nota = entrega?.notaRevisada ?? entrega?.notaFinal;
  const podeClicar = token && (!entrega ? !encerrada : entrega.status === 'corrigido' || entrega.status === 'revisado');

  return (
    <div className="bg-white border border-[#dce0f0] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>{label}</span>
          <span className="text-[10px] text-[#6070a0] font-semibold">{atividade.bimestre}º Bimestre</span>
          {atividade.tipoAtividade === 'adaptada' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
              ✨ Acessível DUA
            </span>
          )}
        </div>
        <p className="text-sm font-extrabold text-[#101942] truncate font-head">{atividade.titulo}</p>
        <p className="text-xs text-[#6070a0] mt-0.5 flex items-center gap-1">
          <Clock size={12} className="text-[#9098c0]" />
          Prazo: {prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        {nota != null && (
          <p className="text-xs font-mono font-bold text-[#f60c49] mt-1.5">
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
              : 'bg-white border border-[#dce0f0] hover:border-[#101942] text-[#101942]'
          }`}
        >
          {!entrega ? 'Responder' : 'Ver Feedback'}
        </a>
      )}
    </div>
  );
};

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

    const { professorUid, turmaId, alunoId, loginKey } = alunoData;
    const url = `/api/aluno/boletim?professorUid=${encodeURIComponent(professorUid)}&turmaId=${encodeURIComponent(turmaId)}&alunoId=${encodeURIComponent(alunoId)}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Falha na autenticação ou permissão.');
        }
        return res.json();
      })
      .then(async (data) => {
        setDados({ ...alunoData, notas: data.notas || {} });

        if (data.redacao) {
          setRedacao(data.redacao);
          if (alunoData.openRedacao) {
            sessionStorage.setItem('redacao_aluno', JSON.stringify({ professorUid: alunoData.professorUid }));
            router.replace(`/redacao/aluno/${data.redacao.id}`);
            return;
          }
        }

        const atvsData = data.atividades || [];
        setAtividades(
          atvsData.sort((a, b) => {
            const pa = a.dataEntrega?.toDate?.() || new Date(a.dataEntrega);
            const pb = b.dataEntrega?.toDate?.() || new Date(b.dataEntrega);
            return pa - pb;
          })
        );
        setEntregas(data.entregas || []);
        setTokens(data.tokens || {});
      })
      .catch((err) => {
        console.error('Erro ao carregar boletim:', err);
        setErro('Erro ao carregar dados. Tente novamente mais tarde.');
      })
      .finally(() => setLoading(false));
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#101942] border-2 border-[#f60c49] animate-spin" />
          <span className="text-xs font-bold text-[#6070a0]">Carregando suas notas...</span>
        </div>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center p-4 font-sans">
        <div className="text-center max-w-sm bg-white border border-[#dce0f0] p-8 rounded-3xl shadow-lg">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#fff2f6] border border-[#fde4ec] flex items-center justify-center text-[#f60c49]">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-lg font-extrabold text-[#101942] mb-2 font-head">Sem dados</h1>
          <p className="text-xs text-[#6070a0] mb-6">{erro}</p>
          <button onClick={handleLogout} className="btn-brand-primary px-5 py-2.5 text-xs font-bold">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  const { notas, nome, turmaId } = dados;
  const turma = { bimestres: notas.bimestres || {}, alunos: [{ id: dados.alunoId }], recuperacao: {} };
  const alunoId = dados.alunoId;

  const bimTotais = [];
  for (let b = 1; b <= 4; b++) {
    const bData = turma.bimestres[String(b)];
    if (!bData) { bimTotais.push(null); continue; }
    const { atividades: atvsB = [], notas: notasB = {}, config } = bData;
    const nota = notasB[alunoId];
    bimTotais.push(atvsB.length > 0 || nota?.simulado != null ? calcTotal(nota?.simulado, atvsB, nota, config) : null);
  }
  const S1 = calcSemestre(bimTotais[0], bimTotais[1], null, 2, 3);
  const S2 = calcSemestre(bimTotais[2], bimTotais[3], null, 2, 3);
  const totalAnual = (S1.total !== null || S2.total !== null) ? (S1.total || 0) + (S2.total || 0) : null;

  const agora = new Date();
  const pendentes = atividades.filter(atv => {
    const prazo = atv.dataEntrega?.toDate?.() || new Date(atv.dataEntrega);
    const entrega = entregas.find(e => e.activityId === atv.id);
    return !entrega && prazo >= agora;
  });
  const realizadas = atividades.filter(atv => {
    const entrega = entregas.find(e => e.activityId === atv.id);
    return !!entrega;
  });
  const encerradas = atividades.filter(atv => {
    const prazo = atv.dataEntrega?.toDate?.() || new Date(atv.dataEntrega);
    const entrega = entregas.find(e => e.activityId === atv.id);
    return !entrega && prazo < agora;
  });

  const abaMap = { pendentes, realizadas, encerradas };
  const abaAtual = abaMap[abaAtv] || [];

  return (
    <div className="min-h-screen bg-[#f7f8fc] font-sans selection:bg-[#f60c49] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Header de Navegação */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.push('/aluno')} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#101942] hover:bg-white border border-[#dce0f0] bg-white/70 shadow-2xs transition-all"
          >
            <ArrowLeft size={14} /> Voltar ao Portal
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateBoletimPDF({
                nomeAluno: nome,
                turmaNome: turmaId || 'Turma Regular',
                bimTotais,
                S1,
                S2,
                totalAnual,
                redacao
              })}
              className="btn-brand-ghost px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Baixar Boletim em PDF"
            >
              <Download size={14} className="text-[#f60c49]" />
              <span>Baixar Boletim</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="p-1.5 text-[#9098c0] hover:text-[#d40840] hover:bg-[#fff2f6] rounded-xl transition-all"
              title="Sair da conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Card do Estudante */}
        <div className="bg-white border border-[#dce0f0] rounded-3xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#101942] text-white flex items-center justify-center shadow-md">
              <User size={22} className="text-[#f60c49]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6070a0] block">
                Boletim de Desempenho
              </span>
              <h1 className="font-head text-xl font-extrabold text-[#101942] leading-tight">
                {nome}
              </h1>
              <p className="text-xs text-[#6070a0] mt-0.5">
                Turma: <span className="font-semibold text-[#101942]">{turmaId}</span>
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-1 bg-[#f7f8fc] sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-[#dce0f0] w-full sm:w-auto justify-between">
            <span className="text-[11px] font-bold text-[#6070a0] uppercase tracking-wider font-head">Status Anual</span>
            <span className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full border ${
              totalAnual !== null && totalAnual >= 50
                ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]'
                : 'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]'
            }`}>
              {totalAnual !== null ? (totalAnual >= 50 ? 'Aprovado' : 'Recuperação') : 'Em Andamento'}
            </span>
          </div>
        </div>

        {/* Card da Redação se houver */}
        {redacao && (
          <div className="bg-gradient-to-r from-[#fff2f6] to-white border border-[#fde4ec] rounded-3xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 justify-between shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#fde4ec] flex items-center justify-center shrink-0 text-[#f60c49] shadow-2xs">
                <PenTool size={22} />
              </div>
              <div>
                <h3 className="font-head font-extrabold text-[#101942] text-base flex items-center gap-2">
                  Redação ENEM Corrigida por IA <Sparkles size={16} className="text-[#f60c49]" />
                </h3>
                <p className="text-xs text-[#6070a0] mt-0.5 line-clamp-1">
                  Tema: <span className="font-semibold text-[#101942]">{redacao.essayTheme}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] bg-[#fff2f6] text-[#d40840] border border-[#fde4ec] px-2 py-0.5 rounded-full font-bold">
                    Nota Final: {redacao.totalScore} pts
                  </span>
                  {redacao.bimestre && (
                    <span className="text-[11px] bg-white border border-[#dce0f0] text-[#6070a0] px-2 py-0.5 rounded-full font-semibold">
                      {redacao.bimestre}º Bimestre
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('redacao_aluno', JSON.stringify({ professorUid: dados.professorUid }));
                router.push(`/redacao/aluno/${redacao.id}`);
              }}
              className="w-full sm:w-auto btn-brand-primary px-4 py-2 text-xs font-bold shadow-xs whitespace-nowrap"
            >
              Ver Relatório Detalhado
            </button>
          </div>
        )}

        {/* Grid dos 4 Bimestres */}
        <div className="mb-8">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#6070a0] mb-3 font-head">
            Notas por Bimestre
          </h2>
          {(!turma.bimestres || Object.keys(turma.bimestres).length === 0) ? (
            !redacao && <p className="text-xs text-[#9098c0] bg-white p-6 rounded-2xl border border-dashed border-[#dce0f0] text-center">Nenhuma nota publicada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((b) => (
                <BimestreCard key={b} numero={b} turma={turma} alunoId={alunoId} />
              ))}
            </div>
          )}
        </div>

        {/* Resumo Anual */}
        <div className="bg-white border border-[#dce0f0] rounded-3xl p-5 mb-8 shadow-sm">
          <h3 className="text-xs font-extrabold text-[#101942] uppercase tracking-wider mb-4 font-head">Resumo Semestral e Anual</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-[#f7f8fc] rounded-2xl border border-[#dce0f0]">
              <span className="text-[10px] font-bold text-[#6070a0] uppercase tracking-wider block">1º Semestre</span>
              <p className={`text-lg font-extrabold font-mono tabular-nums mt-0.5 ${S1.total !== null ? (S1.total >= 25 ? 'text-[#166534]' : 'text-[#991b1b]') : 'text-[#101942]'}`}>
                {S1.total !== null ? fmt(S1.total) : '—'}
              </p>
            </div>
            <div className="p-3 bg-[#f7f8fc] rounded-2xl border border-[#dce0f0]">
              <span className="text-[10px] font-bold text-[#6070a0] uppercase tracking-wider block">2º Semestre</span>
              <p className={`text-lg font-extrabold font-mono tabular-nums mt-0.5 ${S2.total !== null ? (S2.total >= 25 ? 'text-[#166534]' : 'text-[#991b1b]') : 'text-[#101942]'}`}>
                {S2.total !== null ? fmt(S2.total) : '—'}
              </p>
            </div>
          </div>
          <div className="border-t border-[#dce0f0] pt-4 flex justify-between items-baseline">
            <div>
              <span className="text-xs font-bold text-[#101942] block">Pontuação Total Anual</span>
              <span className="text-[11px] text-[#6070a0]">Meta mínima: 50,00 pontos</span>
            </div>
            <span className="text-2xl font-extrabold font-mono text-[#f60c49] tabular-nums">
              {totalAnual !== null ? fmt(totalAnual) : '—'}
            </span>
          </div>
        </div>

        {/* Atividades Online */}
        {atividades.length > 0 && (
          <div>
            <h2 className="text-xs font-extrabold text-[#6070a0] uppercase tracking-wider mb-3 font-head">
              Atividades e Tarefas
            </h2>

            {/* Abas */}
            <div className="flex gap-1.5 mb-4 bg-white border border-[#dce0f0] rounded-2xl p-1 shadow-2xs">
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
                      ? 'bg-[#101942] text-white shadow-2xs' 
                      : 'text-[#6070a0] hover:text-[#101942]'
                  }`}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      abaAtv === key ? 'bg-[#f60c49] text-white' : 'bg-[#eef0f8] text-[#6070a0]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {abaAtual.length === 0 ? (
                <p className="text-xs text-[#9098c0] text-center py-8 bg-white border border-dashed border-[#dce0f0] rounded-2xl">
                  Nenhuma atividade nesta categoria.
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
