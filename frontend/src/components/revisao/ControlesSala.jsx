'use client';

import React from 'react';

function etapaAtual(estado) {
  const { fase, aula, rodada } = estado;
  if (fase === 'espera') return ['mostrar_conteudo', 'Mostrar conteúdo'];
  if (fase === 'conteudo') return aula && !aula.ultimoBloco
    ? ['avancar_conteudo', 'Avançar bloco']
    : ['abrir_pergunta', 'Abrir pergunta'];
  if (fase === 'pergunta') return ['encerrar_pergunta', 'Encerrar pergunta'];
  if (fase === 'encerrada') return ['mostrar_feedback', 'Mostrar feedback'];
  if (fase === 'feedback') return ['mostrar_ranking', 'Mostrar ranking'];
  if (fase === 'ranking') {
    return rodada.numero >= rodada.total
      ? ['finalizar', 'Finalizar aulão']
      : [estado.proximaAcao || 'proxima_rodada', estado.textoProximaAcao || 'Próxima rodada'];
  }
  return null;
}

const botao = 'rounded-lg border border-[#a78bfa] px-3 py-2 text-sm font-bold disabled:opacity-50';

export function ControlesSala({ estado, ocupado, onAcao, projecao }) {
  const bloqueado = ocupado || estado.conexao !== 'conectado';
  const etapa = projecao ? etapaAtual(estado) : null;
  const tempo = estado.sala.duracaoSegundos;

  function alterarTempo(evento) {
    evento.preventDefault();
    const duracaoSegundos = Number(new FormData(evento.currentTarget).get('tempo'));
    onAcao({ acao: 'alterar_tempo', duracaoSegundos });
  }

  function reiniciar() {
    if (window.confirm('Zerar as respostas e o placar e voltar ao início com o mesmo código?')) {
      onAcao({ acao: 'reiniciar', confirmarReinicio: true });
    }
  }

  return (
    <section aria-label="Controles da sala" className="flex flex-wrap items-center gap-2 border-b border-[#8b5cf6]/50 px-4 py-2 text-white">
      {projecao && estado.fase === 'conteudo' && estado.aula?.indiceBloco > 0 && (
        <button type="button" className={botao} disabled={bloqueado} onClick={() => onAcao('voltar_conteudo')}>
          Voltar bloco
        </button>
      )}
      {etapa && (
        <button type="button" className={`${botao} bg-[#00ddeb] text-[#25104a]`} disabled={bloqueado} onClick={() => onAcao(etapa[0])}>
          {etapa[1]}
        </button>
      )}
      {['espera', 'conteudo'].includes(estado.fase) && (
        <button type="button" className={botao} disabled={bloqueado} onClick={() => onAcao('iniciar_so_questoes')}>
          {estado.fase === 'espera' ? 'Iniciar só questões' : 'Pular para as questões'}
        </button>
      )}
      {estado.fase !== 'finalizada' && (
        <form onSubmit={alterarTempo} className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            Tempo padrão (s)
            <input key={tempo} name="tempo" type="number" required min={10} max={600} defaultValue={tempo}
              disabled={bloqueado} className="w-20 rounded-lg bg-white px-2 py-1.5 text-[#25104a]" />
          </label>
          <button type="submit" className={botao} disabled={bloqueado}>Aplicar tempo</button>
          {['pergunta', 'encerrada'].includes(estado.fase) && (
            <span className="text-xs text-[#ddd6fe]">Se a pergunta não foi encerrada manualmente, o cronômetro recomeça.</span>
          )}
        </form>
      )}
      {estado.fase !== 'espera' && (
        <button type="button" className={botao} disabled={bloqueado} onClick={reiniciar}>Reiniciar sala</button>
      )}
    </section>
  );
}
