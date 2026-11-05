"use client";

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodeToken } from '@/utils/diario/tokenUtils';
import { RespostaForm } from './RespostaForm';
import { ConfirmacaoView } from './ConfirmacaoView';
import { FeedbackView } from './FeedbackView';
import { ErroView } from './ErroView';

export default function AtividadeContent() {
  const { id: activityId } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [estado, setEstado] = useState('carregando');
  const [erroTipo, setErroTipo] = useState('token_invalido');
  const [atividade, setAtividade] = useState(null);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => { setErroTipo('token_invalido'); setEstado('erro'); });
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded || decoded.activityId !== activityId) {
      queueMicrotask(() => { setErroTipo('token_invalido'); setEstado('erro'); });
      return;
    }

    fetch(`/api/aluno/atividade/${activityId}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const error = new Error('Falha ao carregar atividade.'); error.status = res.status; throw error;
        }
        return res.json();
      })
      .then((data) => {
        const atv = data.atividade;
        const ent = data.entrega;
        const info = data.alunoInfo || { alunoId: decoded.alunoId };

        if (!atv) {
          setErroTipo('atividade_nao_encontrada');
          setEstado('erro');
          return;
        }

        setAtividade(atv);
        setAlunoInfo(info);

        const agora = new Date();
        const prazo = atv.dataEntrega?.toDate?.() || new Date(atv.dataEntrega);
        if (prazo < agora && !ent) {
          setErroTipo('prazo_encerrado');
          setEstado('erro');
          return;
        }

        if (ent) {
          setEntrega(ent);
          setEstado(ent.status === 'corrigido' || ent.status === 'revisado' ? 'feedback' : 'confirmacao');
        } else {
          setEstado('form');
        }
      })
      .catch(error => {
        setErroTipo(error.status === 401 ? 'login_necessario' : error.status === 403 ? 'token_invalido' : 'erro_carregamento');
        setEstado('erro');
      });
  }, [activityId, token]);

  const handleSubmit = async (respostaTexto, respostas) => {
    if (!atividade || !alunoInfo) return;
    setEnviando(true);
    try {
      const res = await fetch('/api/aluno/entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          token,
          alunoId: alunoInfo.alunoId,
          turmaId: alunoInfo.turmaId,
          bimestre: atividade.bimestre,
          ...(respostas != null ? { respostas } : { respostaTexto }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar resposta.');
      }

      setEntrega({
        activityId,
        alunoId: alunoInfo.alunoId,
        turmaId: alunoInfo.turmaId,
        status: 'entregue',
        ...(respostas != null ? { respostas } : { respostaTexto }),
      });
      setEstado('confirmacao');
    } catch (err) {
      console.error('Erro ao enviar resposta:', err);
      alert(err.message || 'Erro ao enviar resposta. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen bg-[#f3edff] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#25104a] border-2 border-[#6315d9] animate-spin" />
          <span className="text-xs font-bold text-[#5b4b86]">Carregando atividade...</span>
        </div>
      </div>
    );
  }

  if (estado === 'erro') {
    const prazo = atividade?.dataEntrega?.toDate?.();
    const dataStr = prazo ? prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
    return <ErroView tipo={erroTipo} dataEntrega={dataStr} />;
  }

  const prazo = atividade?.dataEntrega?.toDate?.() || new Date(atividade?.dataEntrega || 0);
  const prazoStr = prazo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#f3edff] font-sans selection:bg-[#6315d9] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="bg-white border border-[#e2d9f7] rounded-3xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#25104a] text-white flex items-center justify-center text-xs font-extrabold shadow-xs">
                G
              </div>
              <span className="text-xs text-[#5b4b86] font-bold">Rotina Docente</span>
            </div>
            <a 
              href={typeof window !== 'undefined' && sessionStorage.getItem('aluno_login') ? '/aluno/notas' : '/aluno'} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#25104a] hover:bg-[#f3edff] border border-[#e2d9f7] bg-white transition-all shadow-2xs"
            >
              Voltar ao Boletim
            </a>
          </div>
          <h1 className="font-head text-xl sm:text-2xl font-extrabold text-[#25104a] leading-tight">{atividade?.titulo}</h1>
          {alunoInfo?.nome && <p className="text-xs font-semibold text-[#5b4b86] mt-1">Estudante: <span className="text-[#25104a]">{alunoInfo.nome}</span></p>}
          <p className="text-[11px] text-[#6e5f94] mt-0.5">Prazo de entrega: {prazoStr}</p>
        </div>

        {estado === 'form' && (() => {
          const textos = atividade?.textosBase?.length > 0
            ? atividade.textosBase
            : (atividade?.textoBase ? [{ id: 'legacy', html: atividade.textoBase, aposQuestao: null }] : []);
          return <RespostaForm atividade={atividade} onSubmit={handleSubmit} loading={enviando} textos={textos} />;
        })()}

        {estado === 'confirmacao' && <ConfirmacaoView submittedAt={entrega?.submittedAt} />}
        {estado === 'feedback' && (
          <FeedbackView entrega={entrega} atividade={atividade} />
        )}
      </div>
    </div>
  );
}
