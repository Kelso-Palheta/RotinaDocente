'use client';

import React, { useEffect, useMemo } from 'react';
import { useAudiovisualSala } from './ProvedorAudiovisualSala';
import { PalcoCenaConectado } from './PalcoCenaJogo';

/**
 * `semSom`: use quando o som do mesmo resultado já é disparado por outro caminho (ex.: derivarContextoAudiovisual).
 * Feedback emocional compartilhado (jogos da Aula Gamificada e revisão autônoma).
 * Só celebra resultado CONFIRMADO. `chave` deve ser estável por sessão/sala/rodada/desafio/resposta:
 * rerender, polling, reconexão e StrictMode nunca repetem o som (dedupe no provedor).
 */
export const SITUACAO_POR_TIPO = {
  acerto: 'acerto', erro: 'erro', parcial: 'parcial', sem_resposta: 'sem_resposta', fase: 'fase_concluida', vitoria: 'vitoria',
};

const VARIANTES = {
  acerto: [['⭐', '✨', '🌟'], ['🎆', '✨', '💥'], ['🎉', '🎊', '✨']],
  parcial: [['✨', '🌤️']],
  erro: [['💭', '🌱'], ['☁️', '🌱']],
  fase: [['🎆', '⭐', '🎇', '✨'], ['🎉', '🎊', '⭐']],
  vitoria: [['🎆', '🏆', '🎇', '⭐', '🎉'], ['🎊', '🏆', '✨', '🎆']],
};

const MENSAGENS = {
  acerto: ['Muito bem! Você acertou!', 'Mandou bem! Conhecimento conquistado!', 'É isso! Que resposta certeira!'],
  parcial: ['Quase lá! Você acertou parte — veja a explicação.'],
  erro: ['Ops! Ainda dá para aprender — veja a explicação com calma.', 'Quase! Cada erro ensina algo novo.', 'Tudo bem errar: agora você já sabe a resposta.'],
  sem_resposta: ['Sem resposta desta vez. Veja a explicação e siga em frente.'],
  correcao_pendente: ['Resposta enviada. Aguardando correção do professor.'],
  fase: ['Fase concluída! Excelente percurso!'],
  vitoria: ['Aventura concluída! Parabéns pela jornada!'],
};

export function hashEstavel(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function escolherVariante(tipo, chave) {
  const lista = VARIANTES[tipo];
  if (!lista) return null;
  return lista[hashEstavel(chave) % lista.length];
}

function preferenciaReduzida() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

const CSS = `
@keyframes fbe-subir{0%{transform:translateY(20%) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-130%) scale(1.15) rotate(18deg);opacity:0}}
@keyframes fbe-cair{0%{transform:translateY(-30%);opacity:0}20%{opacity:.9}100%{transform:translateY(120%);opacity:0}}
.fbe-p{position:absolute;pointer-events:none;animation-iteration-count:1;animation-fill-mode:forwards;animation-timing-function:ease-out}
`;

/** Estático equivalente quando animações estão reduzidas. */
function Estatico({ emojis }) {
  return <div aria-hidden="true" data-testid="feedback-estatico" className="text-3xl tracking-widest">{emojis.slice(0, 3).join(' ')}</div>;
}

export default function FeedbackEmocional({ tipo, chave, mensagem, jogoCena = 'quiz', mostrarCena = true, semSom = false, fundoClaro = false, className = '' }) {
  const audiovisual = useAudiovisualSala();
  const reduzir = audiovisual ? Boolean(audiovisual.reduzirAnimacao) : preferenciaReduzida();
  const dispararEvento = audiovisual?.dispararEvento;
  const situacao = SITUACAO_POR_TIPO[tipo];

  useEffect(() => {
    if (!semSom && chave && situacao && dispararEvento) dispararEvento(`fb:${chave}:${situacao}`, situacao);
  }, [semSom, chave, situacao, dispararEvento]);

  const emojis = useMemo(() => escolherVariante(tipo, chave || tipo), [tipo, chave]);
  const texto = mensagem || (MENSAGENS[tipo] ? MENSAGENS[tipo][hashEstavel(chave || tipo) % MENSAGENS[tipo].length] : '');
  const forte = tipo === 'fase' || tipo === 'vitoria';
  const quantidade = forte ? 22 : 12;
  const cai = tipo === 'erro';
  const celebra = Boolean(emojis) && tipo !== 'erro';
  const cenaSituacao = tipo === 'vitoria' || tipo === 'fase' ? 'vitoria' : tipo;
  const comCena = mostrarCena && ['acerto', 'erro', 'vitoria', 'fase'].includes(tipo);

  return (
    <div data-testid="feedback-emocional" data-tipo={tipo} data-variante={emojis?.[0] || ''} className={`relative overflow-hidden rounded-2xl ${className}`}>
      <style>{CSS}</style>
      {emojis && !reduzir && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {Array.from({ length: quantidade }, (_, i) => (
            <span
              key={i}
              className="fbe-p text-2xl"
              style={{ left: `${(i * 37 + 7) % 96}%`, bottom: cai ? 'auto' : '0', top: cai ? '0' : 'auto', animationName: cai ? 'fbe-cair' : 'fbe-subir', animationDuration: `${(cai ? 2.6 : 1.7) + (i % 4) * 0.2}s`, animationDelay: `${(i % 6) * 0.1}s`, opacity: 0 }}
            >
              {emojis[i % emojis.length]}
            </span>
          ))}
        </div>
      )}
      {emojis && reduzir && <Estatico emojis={emojis} />}
      {comCena && (
        <PalcoCenaConectado jogo={jogoCena} situacao={cenaSituacao} eventoId={chave || tipo} tamanho="compacto" className="mb-3 [@media(max-height:480px)]:hidden" />
      )}
      {texto && <p aria-live="polite" className={`relative text-center font-black ${forte ? 'text-2xl' : 'text-lg'} ${celebra ? (fundoClaro ? 'text-emerald-900' : 'text-[#FFE500]') : ''}`}>{texto}</p>}
    </div>
  );
}
