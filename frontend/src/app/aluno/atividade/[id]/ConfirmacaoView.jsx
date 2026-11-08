"use client";

import { interpretarDataEntrega } from '@/dominio/atividades/dataEntrega';

export const ConfirmacaoView = ({ submittedAt }) => {
  const data = interpretarDataEntrega(submittedAt);
  const dataStr = data?.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="arte-composicao bg-[#fffdf7]">
      <div className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="text-center max-w-sm animate-card-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F3EDFF] border border-[#E7DBFD] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#6315D9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-[#25104A] mb-2">Entrega recebida!</h1>
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
