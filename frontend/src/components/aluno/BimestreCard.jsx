"use client";

import { calcTotal, fmt, temNota } from '@/utils/diario/calculos';
import { estiloNotaBimestral, faixaNotaBimestral } from '@/utils/diario/coresNota';

export const BimestreCard = ({ numero, turma, alunoId }) => {
  const bData = turma.bimestres[String(numero)];
  if (!bData) return null;
  const { atividades = [], notas = {}, config } = bData;
  const nota = notas[alunoId];
  const total = temNota(nota, atividades) ? calcTotal(nota?.simulado, atividades, nota, config) : null;
  const faixa = faixaNotaBimestral(total, config);
  const labels = { abaixo: 'Abaixo da média', aprovado: 'Na média', excelente: 'Excelente' };

  return (
    <div className="bg-white border border-[#dce0f0] rounded-2xl p-4 shadow-2xs hover:border-[#f60c49]/30 transition-all">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-extrabold text-[#101942] uppercase tracking-wider font-head">{numero}º Bimestre</h3>
        {total !== null && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${estiloNotaBimestral(total, config)}`}>
            {labels[faixa]}
          </span>
        )}
      </div>

      {total !== null ? (
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
            <span className={`font-extrabold font-mono tabular-nums text-base px-2 py-0.5 rounded ${estiloNotaBimestral(total, config)}`}>{fmt(total)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#9098c0] py-4 text-center">Nenhuma nota publicada neste bimestre.</p>
      )}
    </div>
  );
};

