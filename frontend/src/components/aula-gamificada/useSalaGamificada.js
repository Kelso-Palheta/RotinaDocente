'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { entrarSala, enviarComandoSala, enviarRespostaSala, gerarRequestId, obterEstadoSala } from './api';
import { converterTimestampMs, normalizarEstadoSala, resolverRequestIdOperacao } from './constantes';

const INTERVALO_BASE_MS = 2500;
const INTERVALO_MAX_BACKOFF_MS = 16000;

function criarRelogioServidor({ agoraMs, prazoMs, ativo }) {
  const inicioLocal = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const valido = Number.isFinite(agoraMs) && Number.isFinite(prazoMs);
  const calcular = () => {
    if (!valido) return 0;
    const decorrido = ativo
      ? (typeof performance !== 'undefined' ? performance.now() : Date.now()) - inicioLocal
      : 0;
    return Math.max(0, Math.ceil((prazoMs - agoraMs - decorrido) / 1000));
  };
  const inicial = calcular();
  let atual = inicial;
  return {
    getSnapshot: () => atual,
    getServerSnapshot: () => inicial,
    subscribe(notificar) {
      const atualizar = () => {
        const proximo = calcular();
        if (proximo !== atual) {
          atual = proximo;
          notificar();
        }
      };
      atualizar();
      if (!ativo) return () => {};
      const id = setInterval(atualizar, 250);
      return () => clearInterval(id);
    },
  };
}

export function useCronometroServidor(estado) {
  const agoraMs = converterTimestampMs(estado?.servidorAgora);
  const prazoMs = converterTimestampMs(estado?.prazo);
  const ativo = estado?.fase === 'pergunta' && !estado?.rodadaEncerrada && prazoMs !== null;
  const revision = estado?.revision;
  const rodada = estado?.rodada;

  const relogio = useMemo(
    () => criarRelogioServidor({ agoraMs, prazoMs, ativo, revision, rodada }),
    [agoraMs, prazoMs, ativo, revision, rodada]
  );

  return useSyncExternalStore(relogio.subscribe, relogio.getSnapshot, relogio.getServerSnapshot);
}

function deveAceitarEstado(anterior, proximo) {
  if (!proximo) return false;
  if (!anterior) return true;
  const rodAnt = Number(anterior.rodada ?? 0);
  const rodProx = Number(proximo.rodada ?? 0);
  if (rodProx < rodAnt) return false;
  const revAnt = Number(anterior.revision ?? 0);
  const revProx = Number(proximo.revision ?? 0);
  if (revProx < revAnt) return false;
  if (revProx === revAnt) {
    const agoraAnt = converterTimestampMs(anterior.servidorAgora) ?? 0;
    const agoraProx = converterTimestampMs(proximo.servidorAgora) ?? 0;
    if (agoraProx && agoraAnt && agoraProx < agoraAnt) return false;
  }
  return true;
}

/**
 * Gerencia polling sem sobreposição, cancelamento no unmount, recuo exponencial em falhas,
 * isolamento por contexto/conta e recuperação por estado durável da sala gamificada.
 */
export function useSalaGamificada({
  codigo,
  papel = 'docente', // 'docente' | 'projecao' | 'aluno'
  contextoUid = '',
  obterToken = null,
  ativo = true,
  intervaloMs = INTERVALO_BASE_MS,
}) {
  const chaveContexto = `${papel}:${codigo || ''}:${contextoUid || ''}`;
  const [estadoComContexto, setEstadoComContexto] = useState({ chave: chaveContexto, valor: null });
  const [conexao, setConexao] = useState(() => (ativo && codigo ? 'conectando' : 'desconectado'));
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [cicloReconexao, setCicloReconexao] = useState(0);

  const estadoRef = useRef(null);
  const cartasBaseRef = useRef(null);
  const contextoRef = useRef(chaveContexto);
  const montadoRef = useRef(true);
  const operacaoComandoRef = useRef(null);

  const estado = estadoComContexto.chave === chaveContexto ? estadoComContexto.valor : null;

  const aplicarEstadoBruto = useCallback(
    (proximoEstadoBruto, chaveEsperada) => {
      if (!montadoRef.current || contextoRef.current !== chaveEsperada) return;
      const brutoQuestao = proximoEstadoBruto?.questao ?? proximoEstadoBruto?.rodada?.questao ?? null;
      if (Array.isArray(brutoQuestao?.cartas)) {
        cartasBaseRef.current = brutoQuestao.cartas;
      }
      const proximoEstado = normalizarEstadoSala(proximoEstadoBruto);
      if (!proximoEstado) return;
      if (deveAceitarEstado(estadoRef.current, proximoEstado)) {
        estadoRef.current = proximoEstado;
        setEstadoComContexto({ chave: chaveEsperada, valor: proximoEstado });
      }
    },
    []
  );

  useEffect(() => {
    montadoRef.current = true;
    contextoRef.current = chaveContexto;
    estadoRef.current = null;
    cartasBaseRef.current = null;
    operacaoComandoRef.current = null;

    if (!ativo || !codigo) return () => { montadoRef.current = false; };

    let montado = true;
    let entrou = false;
    let falhas = 0;
    let emVoo = false;
    let timer = null;
    let abortAtual = null;
    const requestIdEntrar = gerarRequestId(`entrar_${codigo}`);

    const limparTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const executarCiclo = async () => {
      if (!montado || emVoo || contextoRef.current !== chaveContexto) return;
      emVoo = true;
      const controller = new AbortController();
      abortAtual = controller;

      try {
        let dados;
        if (papel === 'aluno' && !entrou) {
          dados = await entrarSala({
            codigo,
            requestId: requestIdEntrar,
            signal: controller.signal,
          });
          entrou = true;
        } else {
          dados = await obterEstadoSala({
            codigo,
            obterToken: papel === 'aluno' ? undefined : obterToken,
            signal: controller.signal,
          });
        }

        if (!montado || controller.signal.aborted || contextoRef.current !== chaveContexto) return;

        const bruto = dados?.estado || dados;
        aplicarEstadoBruto(bruto, chaveContexto);
        falhas = 0;
        setConexao('conectado');
        setErro(null);

        if (estadoRef.current?.fase !== 'encerrada') {
          limparTimer();
          timer = setTimeout(executarCiclo, intervaloMs);
        }
      } catch (e) {
        if (!montado || controller.signal.aborted || e?.name === 'AbortError' || contextoRef.current !== chaveContexto) {
          return;
        }

        falhas += 1;
        setErro(e?.message || 'Conexão instável com a sala.');

        if (e?.status === 401 || e?.status === 403 || e?.status === 404) {
          setConexao('desconectado');
        } else {
          setConexao('reconectando');
          const atraso = Math.min(
            INTERVALO_MAX_BACKOFF_MS,
            intervaloMs * Math.pow(2, Math.min(falhas, 4))
          );
          limparTimer();
          timer = setTimeout(executarCiclo, atraso);
        }
      } finally {
        emVoo = false;
      }
    };

    executarCiclo();

    return () => {
      montado = false;
      montadoRef.current = false;
      limparTimer();
      abortAtual?.abort();
    };
  }, [ativo, codigo, papel, obterToken, intervaloMs, cicloReconexao, chaveContexto, aplicarEstadoBruto]);

  const reconectar = useCallback(() => {
    setErro(null);
    setConexao('conectando');
    setCicloReconexao((n) => n + 1);
  }, []);

  const enviarComando = useCallback(
    async (acao, requestIdExterno) => {
      if (!codigo) return null;
      const chaveSnapshot = contextoRef.current;
      const atual = estadoRef.current;
      const expectedRevision = atual?.revision ?? 0;
      const rodadaComando = acao === 'iniciar' ? 1 : (atual?.rodada ?? 1);
      const assinatura = JSON.stringify({ chaveSnapshot, acao, expectedRevision, rodada: rodadaComando });
      const requestId =
        requestIdExterno ||
        resolverRequestIdOperacao(operacaoComandoRef, assinatura, () => gerarRequestId(`cmd_${acao}`));

      setOcupado(true);
      setErro(null);
      try {
        const dados = await enviarComandoSala({
          codigo,
          acao,
          expectedRevision,
          rodada: rodadaComando,
          requestId,
          obterToken,
        });
        if (!montadoRef.current || contextoRef.current !== chaveSnapshot) return null;
        operacaoComandoRef.current = null;
        if (dados?.estado) {
          aplicarEstadoBruto(dados.estado, chaveSnapshot);
        }
        return dados?.estado || null;
      } catch (e) {
        if (montadoRef.current && contextoRef.current === chaveSnapshot) {
          setErro(e?.message || 'Não foi possível executar o comando.');
        }
        throw e;
      } finally {
        if (montadoRef.current && contextoRef.current === chaveSnapshot) {
          setOcupado(false);
        }
      }
    },
    [codigo, obterToken, aplicarEstadoBruto]
  );

  const enviarResposta = useCallback(
    async (resposta, requestIdExterno) => {
      if (!codigo) return null;
      const chaveSnapshot = contextoRef.current;
      const atual = estadoRef.current;
      const rodadaEnviada = atual?.rodada ?? 1;
      setOcupado(true);
      setErro(null);
      try {
        const dados = await enviarRespostaSala({
          codigo,
          rodada: rodadaEnviada,
          requestId: requestIdExterno || gerarRequestId('resp'),
          resposta,
        });
        if (!montadoRef.current || contextoRef.current !== chaveSnapshot) return null;

        const rodadaAtual = estadoRef.current?.rodada;
        if (rodadaAtual != null && Number(rodadaAtual) !== Number(rodadaEnviada)) {
          // Descarta resultados assíncronos de rodadas anteriores, preservando a rodada atual.
          return null;
        }

        if (dados?.estado) {
          aplicarEstadoBruto(dados.estado, chaveSnapshot);
        } else if (dados?.recibo && estadoRef.current) {
          const rodadaRecibo = dados.recibo.rodadaId != null ? Number(dados.recibo.rodadaId) : rodadaEnviada;
          // Descarta recibo atrasado caso sua rodada difira da rodada atual.
          if (Number(rodadaRecibo) !== Number(rodadaAtual)) {
            return null;
          }
          // Reconstrói as cartas a partir dos IDs base + novo recibo para fechar pares errados sem flags antigas.
          const questaoBase = estadoRef.current.questao
            ? {
                ...estadoRef.current.questao,
                ...(Array.isArray(dados.recibo.cartas)
                  ? { cartas: dados.recibo.cartas }
                  : Array.isArray(cartasBaseRef.current)
                  ? { cartas: cartasBaseRef.current }
                  : {}),
              }
            : null;
          const combinado = normalizarEstadoSala({
            ...estadoRef.current,
            rodada: estadoRef.current.rodada,
            questao: questaoBase,
            recibo: dados.recibo,
            ...(dados.recibo.tabuleiro ? { tabuleiro: dados.recibo.tabuleiro } : {}),
          });
          estadoRef.current = combinado;
          setEstadoComContexto({ chave: chaveSnapshot, valor: combinado });
        }
        return dados?.recibo || dados;
      } catch (e) {
        const aindaMesmaRodada =
          estadoRef.current?.rodada == null || Number(estadoRef.current.rodada) === Number(rodadaEnviada);
        if (montadoRef.current && contextoRef.current === chaveSnapshot && aindaMesmaRodada) {
          setErro(e?.message || 'Não foi possível enviar sua resposta.');
        }
        throw e;
      } finally {
        if (montadoRef.current && contextoRef.current === chaveSnapshot) {
          setOcupado(false);
        }
      }
    },
    [codigo, aplicarEstadoBruto]
  );

  return {
    estado,
    conexao,
    erro,
    ocupado,
    reconectar,
    enviarComando,
    enviarResposta,
  };
}
