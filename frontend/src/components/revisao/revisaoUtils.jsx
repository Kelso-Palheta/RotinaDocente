import React from 'react';

export const LETRAS_ALTERNATIVAS = ['A', 'B', 'C', 'D', 'E'];

export function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos || 0));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function BadgeConexao({ conexao }) {
  const configs = {
    conectado: {
      rotulo: 'Conectado',
      classe: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
      ponto: 'bg-emerald-400',
    },
    conectando: {
      rotulo: 'Conectando...',
      classe: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
      ponto: 'bg-amber-400 animate-pulse',
    },
    reconectando: {
      rotulo: 'Reconectando...',
      classe: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
      ponto: 'bg-amber-400 animate-ping',
    },
    desconectado: {
      rotulo: 'Desconectado',
      classe: 'bg-rose-950/60 text-rose-300 border-rose-700/60',
      ponto: 'bg-rose-500',
    },
  };

  const c = configs[conexao] || configs.desconectado;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.classe}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.ponto}`} aria-hidden="true" />
      <span>{c.rotulo}</span>
    </span>
  );
}

export function BlocoConteudo({ bloco, imagens = [] }) {
  if (!bloco) return null;

  if (bloco.tipo === 'texto') {
    return (
      <p className="text-base md:text-lg text-slate-200 leading-relaxed whitespace-pre-line">
        {bloco.texto}
      </p>
    );
  }

  if (bloco.tipo === 'imagem' || bloco.url || bloco.arquivo) {
    const imagem = bloco.imagemId ? imagens.find(item => item.id === bloco.imagemId) : bloco;
    const origem = imagem?.url || imagem?.arquivo;
    if (!origem) return <p role="status">Imagem indisponível para exibição.</p>;
    return (
      <figure className="my-4 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={origem}
          alt={imagem.alt || bloco.legenda || 'Imagem de revisão'}
          className="max-w-full max-h-72 md:max-h-96 w-auto rounded-lg border border-teal-900/50 shadow-md object-contain bg-slate-900/40"
        />
        {bloco.legenda && (
          <figcaption className="mt-2 text-xs md:text-sm text-slate-400 italic text-center">
            {bloco.legenda}
          </figcaption>
        )}
      </figure>
    );
  }

  return null;
}
