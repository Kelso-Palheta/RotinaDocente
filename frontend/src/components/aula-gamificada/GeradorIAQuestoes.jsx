'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';
import { useAIConfig } from '@/hooks/useAIConfig';
import { ModalConectarIA } from '@/components/ai/ModalConectarIA';
import { RenderTextoSeguro } from './RenderTextoSeguro';
import { gerarQuestoesIA, gerarRequestId, revisarQuestao, salvarQuestao } from './api';
import {
  ANOS_ESCOLARES_SUGERIDOS,
  DISCIPLINAS_SUGERIDAS,
  MODALIDADES_PADRAO,
  TIPOS_QUESTAO,
  classeDificuldade,
  mesclarModalidades,
  obterModalidadeInfo,
  rotuloDificuldade,
  rotuloTipoQuestao,
  textoCarta,
} from './constantes';

function assinaturaRascunho(dados, expectedRevision) {
  return JSON.stringify({ expectedRevision: expectedRevision ?? null, questao: dados });
}

export function GeradorIAQuestoes({
  uid = null,
  planejamentoInicial = null,
  obterToken,
  modalidadeInicial = 'quiz',
  modalidadesServidor = MODALIDADES_PADRAO,
  tipoInicial = 'multipla_escolha',
  rascunhosExternos = null,
  onRascunhosChange = null,
  onQuestaoSalva,
  onContinuarParaSala = null,
}) {
  const formId = useId();
  const { temChave, config } = useAIConfig();
  const [mostrarModalIA, setMostrarModalIA] = useState(false);

  const listaJogos = mesclarModalidades(modalidadesServidor);
  const [modalidade, setModalidade] = useState(modalidadeInicial || 'quiz');
  const [disciplina, setDisciplina] = useState(planejamentoInicial?.disciplina || '');
  const [anoEscolar, setAnoEscolar] = useState(planejamentoInicial?.anoEscolar || '');
  const [conteudo, setConteudo] = useState((planejamentoInicial?.conteudo?.length||0)>300?'':planejamentoInicial?.conteudo || '');
  const [tipo, setTipo] = useState(tipoInicial || 'multipla_escolha');
  const [fonte, setFonte] = useState('tema'); // 'tema' | 'material'
  const [quantidades, setQuantidades] = useState({ facil: 1, medio: 1, dificil: 1 });

  // Estado de extração de anexo
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [extraindo, setExtraindo] = useState(false);
  const [erroExtracao, setErroExtracao] = useState(null);
  const [textoMaterial, setTextoMaterial] = useState('');
  const [textoConfirmado, setTextoConfirmado] = useState(false);

  // Estado de geração e salvamento separado
  const [gerando, setGerando] = useState(false);
  const [erroGeracao, setErroGeracao] = useState(null);
  const [rascunhosInternos, setRascunhosInternos] = useState([]);
  const rascunhos = Array.isArray(rascunhosExternos) ? rascunhosExternos : rascunhosInternos;
  const setRascunhos = (updater) => {
    if (typeof onRascunhosChange === 'function') {
      onRascunhosChange(updater);
    } else {
      setRascunhosInternos(updater);
    }
  };

  // Controle de contexto, versão e cancelamento de pedidos assíncronos
  const montadoRef = useRef(true);
  const uidRef = useRef(uid);
  const versaoExtracaoRef = useRef(0);
  const versaoGeracaoRef = useRef(0);
  const abortGeracaoRef = useRef(null);

  const infoJogo = obterModalidadeInfo(modalidade, listaJogos);
  const tiposCompativeis = infoJogo.tiposQuestoes || ['multipla_escolha'];
  const tipoEfetivo = tiposCompativeis.includes(tipo) ? tipo : tiposCompativeis[0];

  const aoMudarJogo = (novaModalidade) => {
    setModalidade(novaModalidade);
    const info = obterModalidadeInfo(novaModalidade, listaJogos);
    if (!info.tiposQuestoes.includes(tipo)) {
      setTipo(info.tiposQuestoes[0] || 'multipla_escolha');
    }
  };

  useEffect(() => {
    if (uidRef.current !== uid) {
      setRascunhos([]);
      setErroGeracao(null);
    }
    uidRef.current = uid;
  }, [uid]);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      versaoExtracaoRef.current += 1;
      versaoGeracaoRef.current += 1;
      abortGeracaoRef.current?.abort();
    };
  }, []);

  const totalSolicitado =
    (Number(quantidades.facil) || 0) +
    (Number(quantidades.medio) || 0) +
    (Number(quantidades.dificil) || 0);

  const bloqueadoPorPedido = gerando || extraindo;

  const processarArquivo = async (file) => {
    if (!file) return;
    const versao = ++versaoExtracaoRef.current;
    const uidSnapshot = uidRef.current;

    // Limpa imediatamente o texto de um arquivo anterior para nunca reaproveitá-lo em caso de falha.
    setArquivoSelecionado(file);
    setNomeArquivo(file.name || 'documento');
    setTextoMaterial('');
    setTextoConfirmado(false);
    setErroExtracao(null);
    setErroGeracao(null);
    setExtraindo(true);

    try {
      const resultado = await extractTextFromDocument(file, { allowImages: true });
      if (!montadoRef.current || versaoExtracaoRef.current !== versao || uidRef.current !== uidSnapshot) {
        return;
      }
      const textoExtraido = resultado?.texto || '';
      setTextoMaterial(textoExtraido);
      if (!textoExtraido) {
        setErroExtracao('O arquivo foi lido, mas não retornou texto legível. Revise ou envie outro material.');
      }
    } catch (err) {
      if (!montadoRef.current || versaoExtracaoRef.current !== versao || uidRef.current !== uidSnapshot) {
        return;
      }
      setTextoMaterial('');
      setTextoConfirmado(false);
      setErroExtracao(err?.message || 'Falha ao extrair texto do arquivo. Você pode tentar novamente.');
    } finally {
      if (montadoRef.current && versaoExtracaoRef.current === versao && uidRef.current === uidSnapshot) {
        setExtraindo(false);
      }
    }
  };

  const handleGerar = async (e) => {
    e.preventDefault();
    if (bloqueadoPorPedido) return;
    setErroGeracao(null);

    const discLimpa = disciplina.trim();
    const anoLimpo = anoEscolar.trim();
    const contLimpo = conteudo.trim();
    const materialLimpo = textoMaterial.trim();

    if (!discLimpa || !anoLimpo || !contLimpo) {
      setErroGeracao('Preencha disciplina, série/ano escolar e conteúdo antes de gerar.');
      return;
    }
    if (totalSolicitado <= 0) {
      setErroGeracao('Solicite pelo menos 1 questão (fácil, média ou difícil).');
      return;
    }
    if (fonte === 'material') {
      if (!materialLimpo) {
        setErroGeracao('Anexe um arquivo ou informe o texto extraído do material.');
        return;
      }
      if (!textoConfirmado) {
        setErroGeracao('Confirme a revisão do texto extraído antes de enviar para a IA.');
        return;
      }
    }

    abortGeracaoRef.current?.abort();
    const controller = new AbortController();
    abortGeracaoRef.current = controller;
    const versao = ++versaoGeracaoRef.current;
    const contextoSnapshot = {
      uid: uidRef.current,
      disciplina: discLimpa,
      anoEscolar: anoLimpo,
      conteudo: contLimpo,
      tipo,
      fonte,
      nomeArquivo,
    };

    setGerando(true);
    try {
      const entrada = {
        modalidade,
        disciplina: discLimpa,
        anoEscolar: anoLimpo,
        conteudo: contLimpo,
        tipo: tipoEfetivo,
        fonte,
        ...(fonte === 'material' ? { textoMaterial: materialLimpo } : {}),
        quantidades: {
          facil: Math.max(0, Number(quantidades.facil) || 0),
          medio: Math.max(0, Number(quantidades.medio) || 0),
          dificil: Math.max(0, Number(quantidades.dificil) || 0),
        },
      };

      const res = await gerarQuestoesIA({
        entrada,
        obterToken,
        signal: controller.signal,
      });

      if (
        !montadoRef.current ||
        controller.signal.aborted ||
        versaoGeracaoRef.current !== versao ||
        uidRef.current !== contextoSnapshot.uid
      ) {
        return;
      }

      const lista = Array.isArray(res?.questoes) ? res.questoes : [];
      setRascunhos(
        lista.map((q, idx) => {
          const dadosIniciais = {
            ...q,
            status: 'rascunho',
            origem: q.origem || {
              tipo: contextoSnapshot.fonte,
              ...(contextoSnapshot.fonte === 'material' && contextoSnapshot.nomeArquivo
                ? { nomeArquivo: contextoSnapshot.nomeArquivo }
                : {}),
            },
          };
          return {
            chaveLocal: `rasc_${Date.now()}_${idx}`,
            revisionSalva: null,
            assinaturaPendente: null,
            requestIdPendente: null,
            salvo: false,
            salvando: false,
            erroSalvar: null,
            dados: dadosIniciais,
          };
        })
      );
      if (lista.length === 0) {
        setErroGeracao('A IA não retornou questões válidas. Ajuste o conteúdo ou tente novamente.');
      }
    } catch (err) {
      if (
        !montadoRef.current ||
        controller.signal.aborted ||
        err?.name === 'AbortError' ||
        versaoGeracaoRef.current !== versao ||
        uidRef.current !== contextoSnapshot.uid
      ) {
        return;
      }
      setErroGeracao(err?.message || 'Não foi possível gerar questões com IA agora.');
    } finally {
      if (montadoRef.current && versaoGeracaoRef.current === versao && uidRef.current === contextoSnapshot.uid) {
        setGerando(false);
      }
    }
  };

  const atualizarRascunho = (chaveLocal, campo, valor) => {
    setRascunhos((prev) =>
      prev.map((item) => {
        if (item.chaveLocal !== chaveLocal) return item;
        const dadosAtualizados = { ...item.dados, [campo]: valor };
        return {
          ...item,
          dados: dadosAtualizados,
          // Editar payload representa uma nova operação (preserva revisionSalva se já foi salvo antes!).
          assinaturaPendente: null,
          requestIdPendente: null,
          salvo: false,
          erroSalvar: null,
        };
      })
    );
  };

  const handleSalvarRascunho = async (item, { aprovar = false } = {}) => {
    if (item.salvando || (item.salvo && (!aprovar || item.dados?.status === 'revisada'))) return;
    const uidSnapshot = uidRef.current;
    const expectedRevision = item.revisionSalva !== null ? item.revisionSalva : undefined;
    const assinatura = assinaturaRascunho(item.dados, expectedRevision);

    // Reaproveita o mesmo requestId em tentativas repetidas com payload idêntico; cria novo se payload mudou.
    const requestId =
      item.assinaturaPendente === assinatura && item.requestIdPendente
        ? item.requestIdPendente
        : gerarRequestId(expectedRevision !== undefined ? 'editar_ia' : 'salvar_ia');

    setRascunhos((prev) =>
      prev.map((r) =>
        r.chaveLocal === item.chaveLocal
          ? {
              ...r,
              salvando: true,
              erroSalvar: null,
              assinaturaPendente: assinatura,
              requestIdPendente: requestId,
            }
          : r
      )
    );

    let salva = item.salvo && item.dados?.id ? item.dados : null;
    const reqAprovacao =
      item.requestIdAprovacaoPendente || (aprovar ? gerarRequestId('revisar_ia') : null);

    try {
      if (!salva) {
        const res = await salvarQuestao({
          questao: item.dados,
          expectedRevision,
          requestId,
          obterToken,
        });
        if (!montadoRef.current || uidRef.current !== uidSnapshot) return;
        salva = res?.questao || item.dados;
        if (salva?.id) {
          setRascunhos((prev) =>
            prev.map((r) =>
              r.chaveLocal === item.chaveLocal
                ? {
                    ...r,
                    salvo: true,
                    revisionSalva: salva.revision ?? (item.revisionSalva ?? 0) + 1,
                    assinaturaPendente: null,
                    requestIdPendente: null,
                    requestIdAprovacaoPendente: reqAprovacao,
                    dados: salva,
                  }
                : r
            )
          );
        }
      }
      if (aprovar && salva?.id && salva.status !== 'revisada') {
        const revRes = await revisarQuestao({
          id: salva.id,
          expectedRevision: salva.revision ?? 1,
          requestId: reqAprovacao,
          obterToken,
        });
        if (!montadoRef.current || uidRef.current !== uidSnapshot) return;
        salva = revRes?.questao || { ...salva, status: 'revisada' };
      }
      if (salva?.id) {
        onQuestaoSalva?.(salva);
      }
      setRascunhos((prev) =>
        prev.map((r) =>
          r.chaveLocal === item.chaveLocal
            ? {
                ...r,
                salvando: false,
                salvo: true,
                revisionSalva: salva.revision ?? (item.revisionSalva ?? 0) + 1,
                assinaturaPendente: null,
                requestIdPendente: null,
                requestIdAprovacaoPendente: null,
                dados: salva,
              }
            : r
        )
      );
    } catch (err) {
      if (!montadoRef.current || uidRef.current !== uidSnapshot) return;
      setRascunhos((prev) =>
        prev.map((r) =>
          r.chaveLocal === item.chaveLocal
            ? {
                ...r,
                salvando: false,
                ...(salva?.id ? { salvo: true, dados: salva, revisionSalva: salva.revision ?? r.revisionSalva } : {}),
                ...(aprovar && reqAprovacao ? { requestIdAprovacaoPendente: reqAprovacao } : {}),
                erroSalvar: err?.message || 'Erro ao salvar rascunho. Clique para tentar novamente sem rechamar a IA.',
              }
            : r
        )
      );
    }
  };

  return (
    <section aria-labelledby={`${formId}-titulo`} className="space-y-6">
      {(planejamentoInicial?.conteudo?.length||0)>300&&<aside className="mb-4 rounded-2xl border-2 border-[#00CAD5] bg-[#ECFBFA] p-4 text-[#25104A]"><strong>Escolha um recorte para gerar as questões</strong><p className="mt-2 text-sm">O planejamento reúne vários conteúdos. Informe um tema de até 300 caracteres para esta geração. O texto integral continua preservado no plano.</p><details className="mt-3"><summary className="cursor-pointer font-bold">Consultar conteúdo completo do planejamento</summary><p className="mt-2 whitespace-pre-wrap text-sm">{planejamentoInicial.conteudo}</p></details></aside>}
      <div className="rounded-2xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2D9F7] pb-3">
          <div>
            <h2 id={`${formId}-titulo`} className="font-head text-xl font-black text-[#25104A]">
              Gerar rascunhos com IA (tema ou material)
            </h2>
            <p className="text-xs text-[#5B4B86] mt-0.5">
              A geração devolve rascunhos para revisão. Nenhuma questão entra no banco nem nas salas sem o seu salvamento e aprovação.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-extrabold border ${
                temChave
                  ? 'bg-[#F3EDFF] text-[#25104A] border-[#6315D9]/30'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {temChave ? `BYOK conectado (${config?.provider || 'IA'})` : 'Chave IA não conectada'}
            </span>
            <button
              type="button"
              disabled={bloqueadoPorPedido}
              onClick={() => setMostrarModalIA(true)}
              className="min-h-10 rounded-xl border border-[#6315D9] bg-white px-3 py-1.5 text-xs font-extrabold text-[#6315D9] hover:bg-[#F3EDFF] disabled:opacity-50"
            >
              {temChave ? 'Trocar chave' : 'Conectar IA'}
            </button>
          </div>
        </div>

        <form onSubmit={handleGerar} noValidate className="space-y-5">
          <fieldset disabled={bloqueadoPorPedido} className="space-y-5 disabled:opacity-75">
            <fieldset className="space-y-2">
              <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                Origem do conteúdo
              </legend>
              <div className="flex flex-wrap gap-3">
                <label className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold cursor-pointer ${fonte === 'tema' ? 'border-[#6315D9] bg-[#F3EDFF] text-[#25104A]' : 'border-[#E2D9F7] text-[#5B4B86]'}`}>
                  <input
                    type="radio"
                    name={`${formId}-fonte`}
                    value="tema"
                    checked={fonte === 'tema'}
                    onChange={() => setFonte('tema')}
                    className="accent-[#6315D9]"
                  />
                  <span>A partir de tema / conteúdo</span>
                </label>
                <label className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold cursor-pointer ${fonte === 'material' ? 'border-[#6315D9] bg-[#F3EDFF] text-[#25104A]' : 'border-[#E2D9F7] text-[#5B4B86]'}`}>
                  <input
                    type="radio"
                    name={`${formId}-fonte`}
                    value="material"
                    checked={fonte === 'material'}
                    onChange={() => setFonte('material')}
                    className="accent-[#6315D9]"
                  />
                  <span>A partir de material anexado (PDF, imagem, DOCX, TXT)</span>
                </label>
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor={`${formId}-disciplina`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                  Disciplina
                </label>
                <input
                  id={`${formId}-disciplina`}
                  type="text"
                  list={`${formId}-dl-disc`}
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                  required
                  placeholder="Ex.: Química, História, Arte"
                  className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base text-[#25104A]"
                />
                <datalist id={`${formId}-dl-disc`}>
                  {DISCIPLINAS_SUGERIDAS.map((d) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`${formId}-ano`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                  Série / Ano escolar
                </label>
                <input
                  id={`${formId}-ano`}
                  type="text"
                  list={`${formId}-dl-ano`}
                  value={anoEscolar}
                  onChange={(e) => setAnoEscolar(e.target.value)}
                  required
                  placeholder="Ex.: 2º ano EM"
                  className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base text-[#25104A]"
                />
                <datalist id={`${formId}-dl-ano`}>
                  {ANOS_ESCOLARES_SUGERIDOS.map((a) => <option key={a} value={a} />)}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`${formId}-conteudo`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                  Conteúdo / Tema
                </label>
                <input
                  id={`${formId}-conteudo`}
                  type="text"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  required
                  placeholder="Ex.: Estequiometria, Modernismo"
                  className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base text-[#25104A]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`${formId}-jogo`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                  Jogo / Modalidade
                </label>
                <select
                  id={`${formId}-jogo`}
                  value={modalidade}
                  onChange={(e) => aoMudarJogo(e.target.value)}
                  className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base text-[#25104A]"
                >
                  {listaJogos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`${formId}-tipo`} className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                  Formato da questão
                </label>
                <select
                  id={`${formId}-tipo`}
                  value={tipoEfetivo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="min-h-12 rounded-xl border border-[#E2D9F7] bg-[#FFFDF7] px-3 py-2 text-base text-[#25104A]"
                >
                  {tiposCompativeis.map((tid) => (
                    <option key={tid} value={tid}>{TIPOS_QUESTAO[tid]?.rotulo || tid}</option>
                  ))}
                </select>
                <span className="text-[11px] font-semibold text-[#5B4B86]">
                  {infoJogo.nome} aceita {tiposCompativeis.map((tid) => TIPOS_QUESTAO[tid]?.rotulo || tid).join(' ou ')}.
                </span>
              </div>
            </div>

            {/* Contagens por dificuldade */}
            <fieldset className="rounded-xl border border-[#E2D9F7] bg-[#F3EDFF]/60 p-4 space-y-2">
              <legend className="text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C] px-1">
                Quantidade por dificuldade (relativa à série/ano) — Total: {totalSolicitado}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${formId}-q-facil`} className="text-xs font-bold text-[#25104A]">Fáceis</label>
                  <input
                    id={`${formId}-q-facil`}
                    type="number"
                    min={0}
                    max={10}
                    value={quantidades.facil}
                    onChange={(e) => setQuantidades((p) => ({ ...p, facil: Number(e.target.value) }))}
                    className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base font-bold text-[#25104A]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${formId}-q-medio`} className="text-xs font-bold text-[#25104A]">Médias</label>
                  <input
                    id={`${formId}-q-medio`}
                    type="number"
                    min={0}
                    max={10}
                    value={quantidades.medio}
                    onChange={(e) => setQuantidades((p) => ({ ...p, medio: Number(e.target.value) }))}
                    className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base font-bold text-[#25104A]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${formId}-q-dificil`} className="text-xs font-bold text-[#25104A]">Difíceis</label>
                  <input
                    id={`${formId}-q-dificil`}
                    type="number"
                    min={0}
                    max={10}
                    value={quantidades.dificil}
                    onChange={(e) => setQuantidades((p) => ({ ...p, dificil: Number(e.target.value) }))}
                    className="min-h-11 rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-base font-bold text-[#25104A]"
                  />
                </div>
              </div>
            </fieldset>

            {/* Upload e revisão obrigatória de anexo */}
            {fonte === 'material' && (
              <div className="space-y-4 rounded-2xl border-2 border-dashed border-[#6315D9]/50 bg-[#F3EDFF]/50 p-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${formId}-arquivo`} className="text-sm font-extrabold text-[#25104A]">
                    Anexar PDF, imagem, DOCX ou TXT
                  </label>
                  <span className="text-xs text-[#5B4B86]">
                    Limites: até 15 MB para documentos (máx. 10 páginas escaneadas via visão) e 7 MB para imagens JPG/PNG/WebP. O arquivo original não é persistido.
                  </span>
                  <input
                    id={`${formId}-arquivo`}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp,text/plain"
                    onChange={(e) => processarArquivo(e.target.files?.[0])}
                    disabled={bloqueadoPorPedido}
                    className="block w-full rounded-xl border border-[#E2D9F7] bg-white p-2.5 text-sm text-[#25104A]"
                  />
                </div>

                {extraindo && (
                  <p role="status" className="text-xs font-bold text-[#6315D9]">
                    Extraindo texto de {nomeArquivo || 'material anexado'}…
                  </p>
                )}

                {erroExtracao && (
                  <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-red-900">
                    <span>{erroExtracao}</span>
                    {arquivoSelecionado && (
                      <button
                        type="button"
                        disabled={bloqueadoPorPedido}
                        onClick={() => processarArquivo(arquivoSelecionado)}
                        className="rounded-lg bg-red-800 px-3 py-1.5 text-white font-bold hover:bg-red-900 disabled:opacity-50"
                      >
                        Tentar extrair novamente
                      </button>
                    )}
                  </div>
                )}

                {(textoMaterial || (nomeArquivo && !erroExtracao && !extraindo)) && (
                  <div className="space-y-2">
                    <label htmlFor={`${formId}-texto-revisao`} className="block text-xs font-extrabold uppercase tracking-wider text-[#4A3B7C]">
                      Texto extraído para revisão {nomeArquivo ? `(${nomeArquivo})` : ''}
                    </label>
                    <textarea
                      id={`${formId}-texto-revisao`}
                      rows={5}
                      value={textoMaterial}
                      onChange={(e) => {
                        setTextoMaterial(e.target.value);
                        setTextoConfirmado(false);
                      }}
                      placeholder="Revise e corrija o texto extraído antes de enviar à IA..."
                      className="w-full rounded-xl border border-[#E2D9F7] bg-white p-3 text-sm text-[#25104A]"
                    />
                    <label className="flex items-start gap-2.5 text-sm font-bold text-[#25104A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={textoConfirmado}
                        onChange={(e) => setTextoConfirmado(e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#6315D9]"
                      />
                      <span>Confirmo que revisei o texto extraído e autorizo o envio somente deste trecho como conteúdo para gerar rascunhos.</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {gerando && (
            <p role="status" className="rounded-xl border border-[#6315D9]/30 bg-[#F3EDFF] p-3 text-xs font-bold text-[#25104A]">
              Gerando rascunhos com IA para {disciplina.trim()} ({anoEscolar.trim()})… Os campos ficam bloqueados até a resposta.
            </p>
          )}

          {erroGeracao && (
            <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-900">
              {erroGeracao}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={bloqueadoPorPedido}
              className="min-h-12 rounded-xl bg-[#6315D9] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#5411B8] disabled:opacity-50"
            >
              {gerando ? 'Gerando rascunhos com IA...' : 'Gerar rascunhos com IA'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de rascunhos retornados pela IA (salvamento individual separado) */}
      {rascunhos.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-head text-lg font-black text-[#25104A]">
                Rascunhos gerados ({rascunhos.length}) — revise e salve no banco
              </h3>
              <span className="text-xs font-semibold text-[#5B4B86]">
                Salvar grava apenas a questão selecionada, sem chamar a IA novamente.
              </span>
            </div>
            {typeof onContinuarParaSala === 'function' && (
              <button
                type="button"
                disabled={
                  rascunhos.filter((r) => r.salvo && r.dados?.status === 'revisada' && r.dados?.id)
                    .length === 0
                }
                onClick={() => {
                  const aprovadasIds = rascunhos
                    .filter((r) => r.salvo && r.dados?.status === 'revisada' && r.dados?.id)
                    .map((r) => r.dados.id);
                  onContinuarParaSala({ modalidade, questaoIds: aprovadasIds });
                }}
                className="min-h-11 rounded-xl bg-[#25104A] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-45"
              >
                {planejamentoInicial ? 'Voltar ao planejamento' : 'Continuar para Preparar Sala'} (
                {
                  rascunhos.filter((r) => r.salvo && r.dados?.status === 'revisada' && r.dados?.id)
                    .length
                }{' '}
                aprovadas)
              </button>
            )}
          </div>

          {rascunhos.map((item, idx) => {
            const q = item.dados;
            const jaExistiaNoBanco = item.revisionSalva !== null;
            return (
              <article
                key={item.chaveLocal}
                className="rounded-2xl border-2 border-[#E2D9F7] bg-[#FFFDF7] p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#25104A] px-2.5 py-0.5 text-xs font-black text-white">
                      Rascunho {idx + 1}
                    </span>
                    <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-extrabold ${classeDificuldade(q.dificuldade)}`}>
                      {rotuloDificuldade(q.dificuldade)}
                    </span>
                    <span className="rounded-lg bg-[#E7DBFD] px-2.5 py-0.5 text-xs font-bold text-[#25104A]">
                      {rotuloTipoQuestao(q.tipo)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={item.salvando || item.salvo}
                      onClick={() => handleSalvarRascunho(item)}
                      className={`min-h-10 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                        item.salvo
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-[#6315D9] text-white hover:bg-[#5411B8] disabled:opacity-50'
                      }`}
                    >
                      {item.salvo
                        ? 'Salvo no banco ✓'
                        : item.salvando
                        ? 'Salvando...'
                        : jaExistiaNoBanco
                        ? 'Salvar alteração no banco'
                        : 'Salvar no banco'}
                    </button>
                    {q.status !== 'revisada' && (
                      <button
                        type="button"
                        disabled={item.salvando}
                        onClick={() => handleSalvarRascunho(item, { aprovar: true })}
                        className="min-h-10 rounded-xl border border-[#6315D9] bg-white px-3.5 py-2 text-xs font-extrabold text-[#6315D9] hover:bg-[#F3EDFF] disabled:opacity-50"
                      >
                        Salvar e aprovar
                      </button>
                    )}
                    {q.status === 'revisada' && (
                      <span className="inline-flex items-center rounded-xl bg-[#B9EF00] px-3 py-1.5 text-xs font-black text-[#25104A]">
                        Aprovada ✓
                      </span>
                    )}
                  </div>
                </div>

                {item.erroSalvar && (
                  <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs font-semibold text-red-900">
                    {item.erroSalvar}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#4A3B7C]">
                    Enunciado (editável antes de salvar)
                    <textarea
                      rows={2}
                      value={q.enunciado || ''}
                      onChange={(e) => atualizarRascunho(item.chaveLocal, 'enunciado', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#E2D9F7] bg-white p-2.5 text-sm text-[#25104A] font-normal"
                    />
                  </label>
                  <div className="rounded-xl bg-[#F3EDFF]/70 border border-[#E2D9F7] p-3 text-sm text-[#25104A]">
                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4A3B7C] mb-1">
                      Prévia segura do enunciado
                    </span>
                    <RenderTextoSeguro texto={q.enunciado} />
                  </div>
                </div>

                {q.tipo === 'multipla_escolha' && Array.isArray(q.alternativas) && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {q.alternativas.map((alt) => (
                      <li
                        key={alt.id}
                        className={`rounded-xl border px-3 py-2 ${
                          q.respostaCorreta === alt.id
                            ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-950'
                            : 'border-[#E2D9F7] bg-white text-[#25104A]'
                        }`}
                      >
                        <RenderTextoSeguro texto={alt.texto} />
                      </li>
                    ))}
                  </ul>
                )}

                {q.tipo === 'resposta_aberta' && <div className="rounded-xl border border-[#B9A6EF] bg-[#F3EDFF] p-4 text-[#25104A]"><strong>Resposta-modelo — correção docente</strong><RenderTextoSeguro texto={q.respostaCorreta} /></div>}
                {q.tipo === 'pares' && Array.isArray(q.pares) && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {q.pares.map((par) => (
                      <li key={par.id} className="rounded-xl border border-[#E2D9F7] bg-white px-3 py-2 text-[#25104A]">
                        <strong><RenderTextoSeguro texto={textoCarta(par.esquerda)} /></strong> ↔{' '}
                        <RenderTextoSeguro texto={textoCarta(par.direita)} />
                      </li>
                    ))}
                  </ul>
                )}

                {q.tipo === 'ordenacao' && Array.isArray(q.itens) && (
                  <ol className="space-y-1 text-sm">
                    {q.itens.map((it, i) => (
                      <li key={it.id} className="rounded-xl border border-[#E2D9F7] bg-white px-3 py-1.5 text-[#25104A]">
                        <strong className="text-[#6315D9] mr-2">{i + 1}º</strong>
                        <RenderTextoSeguro texto={it.texto} />
                      </li>
                    ))}
                  </ol>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#5B4B86]">
                  <div className="rounded-xl bg-white border border-[#E2D9F7] p-3">
                    <strong className="block text-[#25104A] mb-0.5">Explicação pedagógica</strong>
                    <RenderTextoSeguro texto={q.explicacao} />
                  </div>
                  <div className="rounded-xl bg-white border border-[#E2D9F7] p-3">
                    <strong className="block text-[#25104A] mb-0.5">Justificativa da dificuldade</strong>
                    <RenderTextoSeguro texto={q.justificativaDificuldade} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ModalConectarIA isOpen={mostrarModalIA} onClose={() => setMostrarModalIA(false)} />
    </section>
  );
}
