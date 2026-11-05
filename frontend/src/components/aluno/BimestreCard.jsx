"use client";

import { calcTotal, fmt, temNota } from '@/utils/diario/calculos';
import { estiloNotaBimestral, faixaNotaBimestral } from '@/utils/diario/coresNota';

const preenchido = (valor) => valor !== null && valor !== undefined && valor !== '';

const SemLancamento = () => (
  <span className="text-[#6e5f94]" title="Ainda não publicado" aria-label="Ainda não publicado">
    —
  </span>
);

export const BimestreCard = ({ numero, turma, alunoId }) => {
  const bData = turma.bimestres[String(numero)];
  if (!bData) return null;
  const { atividades = [], notas = {}, config } = bData;
  const nota = notas[alunoId];
  const total = temNota(nota, atividades) ? calcTotal(nota?.simulado, atividades, nota, config) : null;
  const faixa = faixaNotaBimestral(total, config);
  const labels = { abaixo: 'Abaixo da média', aprovado: 'Na média', excelente: 'Excelente' };
  const semLancamento = !preenchido(nota?.simulado) || atividades.some((atv) => !preenchido(nota?.[atv.id]));

  return (
    <div className="bg-white border border-[#e2d9f7] rounded-2xl p-4 shadow-2xs hover:border-[#6315d9]/30 transition-all">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-extrabold text-[#25104a] uppercase tracking-wider font-head">{numero}º Bimestre</h3>
        {total !== null && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${estiloNotaBimestral(total, config)}`}>
            {labels[faixa]}
          </span>
        )}
      </div>

      {total !== null ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs py-1 border-b border-[#e2d9f7]/60">
            <span className="text-[#5b4b86] font-medium">Simulado Oficial</span>
            <span className="font-mono text-[#25104a] font-bold tabular-nums">
              {preenchido(nota?.simulado) ? fmt(nota.simulado) : <SemLancamento />}
            </span>
          </div>
          {atividades.map((atv) => {
            const v = nota?.[atv.id];
            return (
              <div key={atv.id} className="flex justify-between text-xs py-1 border-b border-[#e2d9f7]/40">
                <span className="text-[#5b4b86] truncate mr-2 max-w-[160px] font-medium" title={atv.nome}>
                  {atv.nome}
                </span>
                <span className="font-mono text-[#25104a] font-semibold tabular-nums">
                  {preenchido(v) ? fmt(v) : <SemLancamento />} <span className="text-[#6e5f94] font-normal text-[10px]">/ {fmt(atv.max)}</span>
                </span>
              </div>
            );
          })}
          <div className="flex justify-between text-sm mt-3 pt-2.5 border-t border-[#e2d9f7]">
            <span className="font-extrabold text-[#25104a] font-head">Total do Bimestre</span>
            <span className={`font-extrabold font-mono tabular-nums text-base px-2 py-0.5 rounded ${estiloNotaBimestral(total, config)}`}>{fmt(total)}</span>
          </div>
          {semLancamento && (
            <p className="text-[10px] text-[#6e5f94] pt-1.5">— Ainda não publicado. O total considera apenas o que já foi lançado.</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#6e5f94] py-4 text-center">Nenhuma nota publicada neste bimestre.</p>
      )}
    </div>
  );
};
