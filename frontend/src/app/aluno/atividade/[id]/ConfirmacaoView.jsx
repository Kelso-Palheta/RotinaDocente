"use client";

import { interpretarDataEntrega } from '@/dominio/atividades/dataEntrega';

const voltaUrl = () => {
  if (typeof window !== 'undefined' && sessionStorage.getItem('aluno_login')) return '/aluno/notas';
  return '/aluno';
};

export const ConfirmacaoView = ({ submittedAt }) => {
  const data = interpretarDataEntrega(submittedAt);
  const dataStr = data?.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <a href={voltaUrl()} className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-400 font-medium transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Voltar
        </a>
      </div>
      <div className="flex items-center justify-center p-4 -mt-8">
        <div className="text-center max-w-sm animate-card-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Entrega recebida!</h1>
          <p className="text-sm text-slate-400 mb-6">
            {dataStr ? (
              <>
                Sua resposta foi enviada em {dataStr}.<br />
                Em breve você verá sua nota e o feedback aqui.
              </>
            ) : (
              <>
                Data de entrega indisponível. Sua resposta foi registrada, mas não foi possível recuperar o horário do envio.<br />
                Em breve você verá sua nota e o feedback aqui.
              </>
            )}
          </p>
          <p className="text-xs text-slate-400">
            Você pode recarregar esta página para verificar se a correção já foi concluída.
          </p>
        </div>
      </div>
    </div>
  );
};
