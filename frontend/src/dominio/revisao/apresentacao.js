import { falha } from './sala';

export const INTERVALO_EXPLICACAO_MS = 8000;
export const ACOES_EXPLICACAO = Object.freeze([
  'avancar_explicacao', 'voltar_explicacao', 'repetir_explicacao',
  'reproduzir_explicacao', 'pausar_explicacao',
]);

/** Frases contíguas, sem resumir/reformular o texto original. */
export function criarEtapasExplicacao(texto) {
  if (typeof texto !== 'string' || !texto.trim()) return [];
  const frases = [];
  const fimFrase = /[.!?]+(?=\s|$)\s*/g;
  let inicio = 0;
  for (const fim of texto.matchAll(fimFrase)) {
    const limite = fim.index + fim[0].length;
    frases.push(texto.slice(inicio, limite));
    inicio = limite;
  }
  if (inicio < texto.length) frases.push(texto.slice(inicio));
  const quantidade = Math.min(4, frases.length);
  return Array.from({ length: quantidade }, (_, i) => frases.slice(
    Math.floor(i * frases.length / quantidade),
    Math.floor((i + 1) * frases.length / quantidade),
  ).join(''));
}

export function validarAcaoExplicacao(sala, comando) {
  if (!ACOES_EXPLICACAO.includes(comando?.acao))
    throw falha(422, 'Controle de explicação inválido.');
  if (sala.schemaVersion !== 2 || sala.fase !== 'conteudo' ||
      comando.revisao !== sala.revisao ||
      comando.rodadaId !== sala.rodadas[sala.indice]?.id)
    throw falha(409, 'A explicação mudou. Atualize antes de continuar.');
}

/** Recalculável em qualquer cliente/servidor, sem persistir a cada etapa. */
export function atualizarProjecaoApresentacao(apresentacao, agora) {
  const totalEtapas = Math.max(1, apresentacao.totalEtapas);
  const base = Math.max(0, Math.min(totalEtapas - 1, apresentacao.etapaBase));
  const decorrido = apresentacao.automatica
    ? Math.max(0, Math.floor((agora - apresentacao.iniciadaEmMs) / INTERVALO_EXPLICACAO_MS))
    : 0;
  const etapa = Math.min(totalEtapas - 1, base + decorrido);
  const automatica = Boolean(apresentacao.automatica && etapa < totalEtapas - 1);
  return {
    etapa, totalEtapas, automatica,
    iniciadaEmMs: automatica ? apresentacao.iniciadaEmMs : agora,
    etapaBase: automatica ? base : etapa,
    intervaloMs: INTERVALO_EXPLICACAO_MS, agoraServidorMs: agora,
  };
}

export function projetarApresentacao(sala, bloco, agora) {
  const ref = sala.sequenciaAula?.[sala.indiceBloco];
  const chave = `${ref?.conteudoId}:${ref?.blocoId}`;
  const salva = sala.apresentacao?.chave === chave ? sala.apresentacao : null;
  return atualizarProjecaoApresentacao({
    totalEtapas: Math.max(1, criarEtapasExplicacao(bloco?.texto).length),
    etapaBase: salva?.etapaBase ?? 0,
    automatica: salva?.automatica ?? false,
    iniciadaEmMs: salva?.iniciadaEmMs ?? agora,
  }, agora);
}

export function comandarApresentacao(sala, comando, bloco, agora) {
  validarAcaoExplicacao(sala, comando);
  const ref = sala.sequenciaAula?.[sala.indiceBloco];
  if (!ref || bloco?.id !== ref.blocoId)
    throw falha(503, 'Bloco da explicação indisponível.');
  const atual = projetarApresentacao(sala, bloco, agora);
  let etapaBase = atual.etapa;
  const automatica = comando.acao === 'reproduzir_explicacao';
  if (comando.acao === 'avancar_explicacao') etapaBase += 1;
  if (comando.acao === 'voltar_explicacao') etapaBase -= 1;
  if (comando.acao === 'repetir_explicacao' ||
      (automatica && etapaBase === atual.totalEtapas - 1)) etapaBase = 0;
  if (etapaBase < 0 || etapaBase >= atual.totalEtapas)
    throw falha(409, 'Limite da explicação alcançado.');
  return { chave: `${ref.conteudoId}:${ref.blocoId}`, etapaBase,
    automatica: automatica && atual.totalEtapas > 1, iniciadaEmMs: agora };
}
