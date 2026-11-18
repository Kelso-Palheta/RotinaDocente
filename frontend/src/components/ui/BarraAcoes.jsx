'use client';

import React from 'react';

export function BarraAcoes({
  children,
  className = '',
  alinhamento = 'entre', // 'entre' | 'inicio' | 'fim'
}) {
  const alinhamentos = {
    entre: 'justify-between',
    inicio: 'justify-start',
    fim: 'justify-end',
  };

  const estiloAlinhamento = alinhamentos[alinhamento] || alinhamentos.entre;

  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl bg-[#F3EDFF] border border-[#E2D9F7] flex flex-col sm:flex-row sm:items-center ${estiloAlinhamento} gap-3 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
