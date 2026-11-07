'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { consumirEventosRevisao, ENVIO_VAZIO, incorporarAtualizacao, requisitarRevisao } from './integracaoTransporte';

export function useSalaRevisao({ codigo, papel, contexto, obterToken }) {
  const chave = `${papel}:${contexto}:${codigo}`;
  const [dados, setDados] = useState({ chave: null, estado: null, envio: ENVIO_VAZIO, conexao: 'conectando', erro: null, ocupado: false });
  const sessao = useRef(null);
  const dadosRef = useRef(dados);
  useEffect(() => { dadosRef.current = dados; }, [dados]);

  useEffect(() => {
    if (!codigo || !contexto) return;
    const controller = new AbortController();
    const atual = { chave, controller, ativa: true, enviando: false, timer: null };
    sessao.current = atual;
    const vigente = () => atual.ativa && !controller.signal.aborted && sessao.current === atual;
    const publicar = (patch) => {
      if (!vigente()) return;
      setDados(anterior => {
        if (!vigente()) return anterior;
        const base = anterior.chave === chave ? anterior : { chave, estado: null, envio: ENVIO_VAZIO, erro: null, ocupado: false };
        const proximo = typeof patch === 'function' ? patch(base) : { ...base, ...patch };
        dadosRef.current = proximo;
        return proximo;
      });
    };
    atual.publicar = publicar;
    const receber = payload => publicar(anterior => ({ ...incorporarAtualizacao(anterior, payload), conexao: 'conectado', erro: null }));
    const base = `/salas/${encodeURIComponent(codigo)}`;
    const opcoes = { obterToken: papel === 'aluno' ? undefined : obterToken, signal: controller.signal };
    async function conectar() {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Sem internet. Reconectando automaticamente.');
        const resposta = await requisitarRevisao(`${base}/eventos`, { ...opcoes, stream: true });
        if (!vigente()) return;
        await consumirEventosRevisao(resposta, receber, controller.signal);
        if (vigente()) publicar({ conexao: 'reconectando' });
      } catch (erro) {
        if (!vigente()) return;
        publicar({ conexao: 'desconectado', erro: erro.message });
        if ([400, 401, 403, 404].includes(erro.status)) return;
      }
      if (vigente()) atual.timer = setTimeout(conectar, 1500);
    }
    async function iniciar() {
      try {
        publicar({ conexao: 'conectando', erro: null });
        if (papel === 'aluno') await requisitarRevisao(`${base}/entrar`, { ...opcoes, body: {} });
        if (!vigente()) return;
        const resposta = await requisitarRevisao(base, opcoes);
        if (!vigente()) return;
        receber(resposta);
        await conectar();
      } catch (erro) {
        if (vigente()) publicar({ conexao: 'desconectado', erro: erro.message });
      }
    }
    // A microtask lets StrictMode invalidate its first setup before any request begins.
    Promise.resolve().then(() => { if (vigente()) iniciar(); });
    const offline = () => publicar({ conexao: 'desconectado', erro: 'Sem internet. Aguarde a reconexão antes de enviar.' });
    window.addEventListener('offline', offline);
    return () => {
      atual.ativa = false;
      controller.abort();
      clearTimeout(atual.timer);
      window.removeEventListener('offline', offline);
    };
  }, [chave, codigo, contexto, obterToken, papel]);

  const executar = useCallback(async (tipo, valor, retry = false) => {
    const atual = sessao.current;
    const snapshot = dadosRef.current;
    if (!atual?.ativa || atual.chave !== chave || atual.enviando || snapshot.chave !== chave
      || snapshot.conexao !== 'conectado' || !snapshot.estado || navigator.onLine === false) return;
    const estado = snapshot.estado;
    const rodadaId = estado.rodada?.id;
    if (tipo === 'respostas') {
      if (papel !== 'aluno' || estado.fase !== 'pergunta' || !['A', 'B', 'C', 'D', 'E'].includes(valor)
        || ['enviando', 'confirmado'].includes(snapshot.envio.status)
        || (snapshot.envio.status === 'falha' && (!retry || snapshot.envio.alternativa !== valor))) return;
    } else if (papel === 'aluno') return;
    atual.enviando = true;
    atual.publicar({ ocupado: true, erro: null,
      ...(tipo === 'respostas' ? { envio: { status: 'enviando', alternativa: valor, rodadaId } } : {}) });
    try {
      const body = tipo === 'respostas' ? { rodadaId, alternativa: valor }
        : { ...(typeof valor === 'string' ? { acao: valor } : valor), revisao: estado.sala.revisao, rodadaId: rodadaId || null };
      const payload = await requisitarRevisao(`/salas/${encodeURIComponent(codigo)}/${tipo}`, {
        obterToken: papel === 'aluno' ? undefined : obterToken, signal: atual.controller.signal, body,
      });
      if (sessao.current !== atual || !atual.ativa) return;
      atual.publicar(anterior => ({ ...incorporarAtualizacao(anterior, payload), erro: null }));
    } catch (erro) {
      if (sessao.current !== atual || !atual.ativa) return;
      atual.publicar(anterior => ({ ...anterior, erro: tipo === 'respostas' && anterior.envio.status === 'confirmado' ? null : erro.message,
        ...(tipo === 'respostas' && anterior.estado?.rodada?.id === rodadaId && anterior.envio.status !== 'confirmado'
          ? { envio: { status: 'falha', alternativa: valor, rodadaId } } : {}) }));
    } finally {
      atual.enviando = false;
      if (sessao.current === atual && atual.ativa) atual.publicar({ ocupado: false });
    }
  }, [chave, codigo, obterToken, papel]);

  const visivel = dados.chave === chave ? dados : { estado: null, envio: ENVIO_VAZIO, conexao: 'conectando', erro: null, ocupado: false };
  return {
    ...visivel,
    estado: visivel.estado ? { ...visivel.estado, conexao: visivel.conexao } : null,
    responder: alternativa => executar('respostas', alternativa),
    tentarNovamente: () => executar('respostas', dadosRef.current.envio.alternativa, true),
    acao: valor => executar('comandos', valor),
  };
}
