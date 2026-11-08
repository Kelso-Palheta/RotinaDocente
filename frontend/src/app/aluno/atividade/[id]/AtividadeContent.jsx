"use client";

import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodeToken } from '@/utils/diario/tokenUtils';
import { interpretarDataEntrega, formatarDataEntrega } from '@/dominio/atividades/dataEntrega';
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
        const prazo = interpretarDataEntrega(atv.dataEntrega);
        if (prazo && prazo < agora && !ent) {
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
    const dataStr = interpretarDataEntrega(atividade?.dataEntrega)
      ? formatarDataEntrega(atividade.dataEntrega)
      : null;
    return <ErroView tipo={erroTipo} dataEntrega={dataStr} />;
  }

  const prazoStr = formatarDataEntrega(atividade?.dataEntrega);

  return (
    <div className="min-h-screen bg-[#f3edff] font-sans selection:bg-[#6315d9] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="mb-6 overflow-hidden rounded-3xl">
          <CabecalhoPagina
            titulo={atividade?.titulo}
            badge="Atividade"
            badgeCor="ciano"
            variante="compacto"
            subtitulo={<>
              {alunoInfo?.nome && <span className="block">Estudante: <strong>{alunoInfo.nome}</strong></span>}
              <span className="block">Prazo de entrega: {prazoStr}</span>
            </>}
            acoes={
              <a
                href={typeof window !== 'undefined' && sessionStorage.getItem('aluno_login') ? '/aluno/notas' : '/aluno'}
                className="inline-flex items-center rounded-xl border border-[#e2d9f7] bg-white px-3 py-2 text-xs font-bold text-[#25104a] hover:bg-[#f3edff] focus-visible:outline-2 focus-visible:outline-[#6315d9]"
              >
                Voltar ao Boletim
              </a>
            }
          />
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
