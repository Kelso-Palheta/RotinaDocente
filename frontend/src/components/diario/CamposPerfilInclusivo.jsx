import React from 'react';

/**
 * Campos do perfil inclusivo do aluno do Diário (RN-46):
 * Nível de Suporte (1/2/3), Âncora de Engajamento/Hiperfoco e Observação Pedagógica.
 * Presente no cadastro manual (TurmaView) e no editor da tabela de notas.
 */
const NIVEIS_SUPORTE = [
  { valor: 1, rotulo: '1 · Leve', descricao: 'Apoio inicial' },
  { valor: 2, rotulo: '2 · Moderado', descricao: 'Apoio substancial' },
  { valor: 3, rotulo: '3 · Intenso', descricao: 'Apoio contínuo' },
];

export const CamposPerfilInclusivo = ({
  nivelSuporte = 1,
  onChangeNivel,
  hiperfoco = '',
  onChangeHiperfoco,
  observacoes = '',
  onChangeObservacoes,
  idPrefix = 'perfil',
}) => {
  const inputClass =
    'w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs text-[#101942] placeholder-[#9098c0] outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/25 focus:border-[#f60c49] transition-all';

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Nível de Suporte Necessário
        </span>
        <div role="radiogroup" aria-label="Nível de suporte necessário" className="grid grid-cols-3 gap-1.5">
          {NIVEIS_SUPORTE.map((nivel) => {
            const ativo = nivelSuporte === nivel.valor;
            return (
              <button
                key={nivel.valor}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => onChangeNivel?.(nivel.valor)}
                className={`rounded-xl border px-2 py-1.5 text-left transition-all ${
                  ativo
                    ? 'border-[#f60c49] bg-[#fff2f6] text-[#d40840]'
                    : 'border-[#dce0f0] bg-white text-[#6070a0] hover:border-[#f60c49]/40'
                }`}
              >
                <span className="block text-[11px] font-bold leading-tight">{nivel.rotulo}</span>
                <span className="block text-[10px] leading-tight opacity-80">{nivel.descricao}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-hiperfoco`} className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Âncora de Engajamento / Hiperfoco (Opcional)
        </label>
        <input
          id={`${idPrefix}-hiperfoco`}
          type="text"
          value={hiperfoco}
          onChange={(e) => onChangeHiperfoco?.(e.target.value)}
          placeholder="Ex: Dinossauros, Sistema Solar, Carros, Futebol, Games..."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-observacoes`} className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Observação Pedagógica Pontual (Opcional)
        </label>
        <input
          id={`${idPrefix}-observacoes`}
          type="text"
          value={observacoes}
          onChange={(e) => onChangeObservacoes?.(e.target.value)}
          placeholder="Ex: Apresenta sensibilidade a ruídos, prefere apoio visual..."
          className={inputClass}
        />
      </div>
    </div>
  );
};

export default CamposPerfilInclusivo;
