'use client';

import React from 'react';

const SIMBOLOS_TEX = [
  [/\\times\b/g, '×'],
  [/\\cdot\b/g, '·'],
  [/\\div\b/g, '÷'],
  [/\\pm\b/g, '±'],
  [/\\leq?\b/g, '≤'],
  [/\\geq?\b/g, '≥'],
  [/\\neq\b/g, '≠'],
  [/\\approx\b/g, '≈'],
  [/\\rightarrow\b|\\to\b/g, '→'],
  [/\\leftarrow\b/g, '←'],
  [/\\pi\b/g, 'π'],
  [/\\Delta\b/g, 'Δ'],
  [/\\alpha\b/g, 'α'],
  [/\\beta\b/g, 'β'],
  [/\\theta\b/g, 'θ'],
  [/\\Omega\b/g, 'Ω'],
  [/\\infty\b/g, '∞'],
  [/\\sqrt\{([^}]+)\}/g, '√($1)'],
  [/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)'],
];

function renderizarFormulaSegura(expressao, chaveBase) {
  let limpa = String(expressao || '');
  for (const [regex, substituto] of SIMBOLOS_TEX) {
    limpa = limpa.replace(regex, substituto);
  }

  // Converte subscritos e sobrescritos simples (_2, _{10}, ^2, ^{n+1}) em nós React seguros.
  const partes = [];
  const regex = /(\^\{[^}]+\}|\^[A-Za-z0-9+-]|_\{[^}]+\}|_[A-Za-z0-9+-])/g;
  let ultimo = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(limpa)) !== null) {
    if (match.index > ultimo) {
      partes.push(limpa.slice(ultimo, match.index));
    }
    const token = match[0];
    const tipo = token[0];
    const conteudo = token[1] === '{' ? token.slice(2, -1) : token.slice(1);
    if (tipo === '^') {
      partes.push(<sup key={`${chaveBase}-sup-${idx}`}>{conteudo}</sup>);
    } else {
      partes.push(<sub key={`${chaveBase}-sub-${idx}`}>{conteudo}</sub>);
    }
    idx += 1;
    ultimo = regex.lastIndex;
  }

  if (ultimo < limpa.length) {
    partes.push(limpa.slice(ultimo));
  }

  return (
    <span
      key={chaveBase}
      className="inline-block rounded bg-[#F3EDFF] px-1.5 py-0.5 font-mono text-[0.95em] text-[#25104A] border border-[#E2D9F7]"
    >
      {partes}
    </span>
  );
}

/**
 * Renderiza texto pedagógico e fórmulas delimitadas por $...$ sem jamais interpretar HTML bruto.
 */
export function RenderTextoSeguro({ texto, className = '' }) {
  const bruto = String(texto ?? '');
  if (!bruto) return null;

  const blocos = [];
  const regexFormula = /\$([^$\n]{1,160})\$/g;
  let ultimo = 0;
  let match;
  let idx = 0;

  while ((match = regexFormula.exec(bruto)) !== null) {
    if (match.index > ultimo) {
      blocos.push(bruto.slice(ultimo, match.index));
    }
    blocos.push(renderizarFormulaSegura(match[1], `f-${idx}`));
    idx += 1;
    ultimo = regexFormula.lastIndex;
  }

  if (ultimo < bruto.length) {
    blocos.push(bruto.slice(ultimo));
  }

  return <span className={`whitespace-pre-line break-words ${className}`}>{blocos}</span>;
}
