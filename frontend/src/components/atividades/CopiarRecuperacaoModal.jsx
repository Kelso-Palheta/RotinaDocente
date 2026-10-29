"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listConjuntosRecuperacao,
  getConjuntoRecuperacao,
  criarConjuntoRecuperacao,
} from '@/lib/firebase-recuperacao';
import {
  avaliarDestinosCopia,
  projetarConteudoRecuperacao,
  restanteCentesimos,
  validarDestinoCopia,
  validarOrigemCopia,
  normalizarPrazoCopia,
} from '@/dominio/atividades/copiarRecuperacao';
import { AtividadeForm } from './AtividadeForm';
import { CriacaoConjunto } from './CriacaoConjunto';

const pontos = valor => Number(valor || 0).toFixed(2).replace('.', ',');

const prazoPadrao = () => {
  const data = new Date();
  data.setDate(data.getDate() + 7);
  data.setHours(23, 59, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ${pad(data.getHours())}:${pad(data.getMinutes())}`;
};

const turmasDaOrigem = origem => new Set(
  [...(Array.isArray(origem?.turmaIds) ? origem.turmaIds : []), ...(Array.isArray(origem?.turmas) ? origem.turmas : [])]
    .map(String),
);

const FOCAVEIS = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

const MOTIVOS_DESTINO = {
  outra_conta: 'pertence a outra conta',
  mesma_turma: 'é da mesma turma da origem',
  cancelado: 'está cancelado',
  congelado: 'já possui entregas',
  obsoleto: 'mudou durante a seleção',
  ano_incompativel: 'é de outro ano letivo',
  aluno_fora_da_turma: 'tem aluno fora da turma',
  saldo_insuficiente: 'não tem pontos suficientes',
  indisponivel: 'não está disponível',
};

export function CopiarRecuperacaoModal({
  user,
  origem,
  turmas = [],
  ano,
  onClose,
  onSalvar,
}) {
  const uid = user?.uid;
  const dialogRef = useRef(null);
  const revisaoRef = useRef(null);
  const criacaoRef = useRef(null);
  const focouRef = useRef(false);
  const ativoRef = useRef(true);
  const [conjuntos, setConjuntos] = useState([]);
  const [carregadoPara, setCarregadoPara] = useState('');
  const [erro, setErro] = useState('');
  const [selecionadoId, setSelecionadoId] = useState('');
  const [criando, setCriando] = useState(false);
  const [etapa, setEtapa] = useState('destino');
  const [destinoAtual, setDestinoAtual] = useState(null);
  const [turmaAtual, setTurmaAtual] = useState(null);
  const [prazo, setPrazo] = useState(prazoPadrao);

  useEffect(() => {
    ativoRef.current = true;
    return () => { ativoRef.current = false; };
  }, []);

  // A origem é validada antes de qualquer leitura de destino. Atividade
  // adaptada não vira cópia regular silenciosamente.
  const erroOrigem = useMemo(() => {
    try {
      validarOrigemCopia(origem, { professorId: uid });
      return null;
    } catch (error) {
      return error;
    }
  }, [origem, uid]);

  const conteudoProjetado = useMemo(() => {
    if (erroOrigem) return null;
    try {
      return projetarConteudoRecuperacao(origem, { professorId: uid });
    } catch {
      return null;
    }
  }, [origem, uid, erroOrigem]);

  const chaveCarga = `${uid || ''}:${ano || ''}:${origem?.id || ''}`;
  const carregando = Boolean(uid) && !erroOrigem && carregadoPara !== chaveCarga;

  useEffect(() => {
    if (!uid || erroOrigem) return undefined;
    let ativo = true;
    const filtro = ano && String(ano) !== 'todos' ? { anoLetivo: String(ano) } : {};
    listConjuntosRecuperacao(uid, filtro)
      .then(lista => {
        if (!ativo) return;
        setConjuntos(Array.isArray(lista) ? lista : []);
        setErro('');
      })
      .catch(error => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregadoPara(chaveCarga);
      });
    return () => { ativo = false; };
  }, [uid, ano, erroOrigem, chaveCarga]);

  const avaliacao = useMemo(() => {
    if (erroOrigem) return { elegiveis: [], indisponiveis: [] };
    return avaliarDestinosCopia({ conjuntos, turmas, professorId: uid, origem });
  }, [conjuntos, turmas, uid, origem, erroOrigem]);

  const selecionado = avaliacao.elegiveis.find(item => item.conjunto.id === selecionadoId)
    || avaliacao.elegiveis[0]
    || null;
  const turmasDestino = turmas.filter(turma => !turmasDaOrigem(origem).has(String(turma.id)));

  const fechar = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (carregando || erroOrigem || etapa !== 'destino' || focouRef.current) return;
    const primeiro = dialogRef.current?.querySelector(FOCAVEIS);
    (primeiro || dialogRef.current)?.focus();
    focouRef.current = true;
  }, [carregando, erroOrigem, etapa]);

  // Ao entrar na revisão, o foco sai do diálogo de destino e precisa
  // continuar dentro do formulário — nunca cair no body.
  useEffect(() => {
    if (etapa !== 'revisao') return;
    const primeiro = revisaoRef.current?.querySelector(FOCAVEIS);
    (primeiro || revisaoRef.current)?.focus();
  }, [etapa]);

  // O formulário de novo conjunto substitui os controles anteriores; o foco
  // precisa acompanhar a troca para o teclado não voltar ao body.
  useEffect(() => {
    if (!criando) return;
    const primeiro = criacaoRef.current?.querySelector(FOCAVEIS);
    (primeiro || criacaoRef.current)?.focus();
  }, [criando]);

  const aoTeclar = (evento) => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      fechar();
      return;
    }
    if (evento.key !== 'Tab' || etapa !== 'destino') return;

    const focaveis = [...(dialogRef.current?.querySelectorAll(FOCAVEIS) || [])];
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };

  const criarConjunto = async (dados, alunos) => {
    const novo = await criarConjuntoRecuperacao(uid, dados, alunos);
    if (!ativoRef.current) return;
    setConjuntos(prev => [...prev, novo]);
    setSelecionadoId(novo.id);
    setCriando(false);
  };

  const revisar = async () => {
    if (!selecionado) return;
    setErro('');
    try {
      const prazoConfirmado = normalizarPrazoCopia(prazo);
      if (!prazoConfirmado) throw new Error('Informe uma data e hora válidas para o novo prazo.');
      const atual = await getConjuntoRecuperacao(uid, selecionado.conjunto.id);
      if (!ativoRef.current) return;
      const turma = turmas.find(t => String(t.id) === String(atual?.turmaId)) || selecionado.turma;
      validarDestinoCopia({
        origem,
        destino: atual,
        professorId: uid,
        turma,
        versaoEsperada: selecionado.conjunto.versao,
        pontos: 0.01,
      });
      setDestinoAtual(atual);
      setTurmaAtual(turma);
      setPrazo(prazoConfirmado);
      setEtapa('revisao');
    } catch (error) {
      setErro(error.message);
    }
  };

  const salvarCopia = async (dados) => {
    const atual = await getConjuntoRecuperacao(uid, destinoAtual?.id || selecionado?.conjunto?.id);
    if (!ativoRef.current) return;
    // Um commit anterior pode já ter consumido o saldo e mudado a versão.
    // Apenas o caso de uso pode reconhecer esse ID/conteúdo como retry,
    // sem regravar. Toda criação nova exige a versão conferida na revisão.
    const possivelRepeticao = atual?.atividadeIds?.includes(dados?.id);
    if (!possivelRepeticao) {
      validarDestinoCopia({
        origem,
        destino: atual,
        professorId: uid,
        turma: turmaAtual,
        versaoEsperada: destinoAtual?.versao,
        pontos: dados?.notaMaxima,
        destinatariosIds: dados?.destinatariosIds,
      });
    }
    await onSalvar?.(dados, {
      destino: destinoAtual,
      turmaDestino: turmaAtual,
      versaoEsperada: destinoAtual?.versao,
    });
    if (ativoRef.current) fechar();
  };

  if (etapa === 'revisao' && destinoAtual) {
    const restante = restanteCentesimos(destinoAtual) / 100;
    return (
      <div ref={revisaoRef} tabIndex={-1}>
        <AtividadeForm
          turmas={turmaAtual ? [turmaAtual] : []}
          onCreate={salvarCopia}
          onClose={fechar}
          conteudoInicial={conteudoProjetado}
          contextoInicial={{
            finalidade: 'recuperacao_semestral',
            conjuntoRecuperacaoId: destinoAtual.id,
            conjuntoVersao: destinoAtual.versao,
            semestre: String(destinoAtual.semestre),
            anoLetivo: String(destinoAtual.anoLetivo ?? turmaAtual?.anoLetivo ?? ''),
            turmaId: destinoAtual.turmaId,
            destinatariosIds: destinoAtual.destinatariosIds,
            pontosRestantes: restante,
            prazoInicial: prazo,
            avisosCopia: conteudoProjetado?.avisos || [],
          }}
        />
      </div>
    );
  }

  if (carregando && !erroOrigem) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <p role="status" className="bg-white rounded-2xl border border-slate-200 px-5 py-4 text-sm text-[#6070a0]">
          Carregando destinos...
        </p>
      </div>
    );
  }

  const turmaSelecionada = selecionado?.turma || turmas.find(t => String(t.id) === String(selecionado?.conjunto?.turmaId)) || null;
  const destinatariosNomes = (turmaSelecionada?.alunos || [])
    .filter(aluno => (selecionado?.conjunto?.destinatariosIds || []).includes(aluno.id))
    .map(aluno => aluno.nome)
    .filter(Boolean);
  const restante = selecionado ? restanteCentesimos(selecionado.conjunto) / 100 : 0;
  const fechaDez = Boolean(selecionado) && Number(origem?.notaMaxima || 0) > 0 && Math.round(restante * 100) === Math.round(Number(origem.notaMaxima) * 100);
  const motivosIndisponiveis = [...new Set(avaliacao.indisponiveis.map(item => (
    MOTIVOS_DESTINO[item.motivo] || MOTIVOS_DESTINO.indisponivel
  )))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Copiar recuperação para outra turma"
        tabIndex={-1}
        onKeyDown={aoTeclar}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-lg border border-[#dce0f0]"
      >
        <header className="sticky top-0 z-10 bg-white border-b border-[#dce0f0] px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#101942]">Copiar recuperação para outra turma</h2>
            <p className="text-xs text-[#6070a0]">A origem fica intacta. A cópia nasce como uma atividade nova no conjunto de destino.</p>
          </div>
          <button type="button" autoFocus onClick={fechar} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eef0f8] text-[#101942]">Fechar</button>
        </header>

        <div className="p-5 space-y-4">
          {erroOrigem && <p role="alert" className="bg-red-50 text-red-800 rounded-xl p-3 text-sm">{erroOrigem.message}</p>}
          {erro && <p role="alert" className="bg-red-50 text-red-800 rounded-xl p-3 text-sm">{erro}</p>}

          {!erroOrigem && (
            <div className="border border-[#dce0f0] rounded-xl p-3 text-sm">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-[#6070a0]">Origem</p>
              <p className="font-semibold text-[#101942]">{origem.titulo}</p>
              <p className="text-xs text-[#6070a0]">Vale até {pontos(origem.notaMaxima)} pontos · {origem.semestre}º semestre</p>
            </div>
          )}

          {!erroOrigem && !criando && (
            <>
              {!carregando && !avaliacao.elegiveis.length && (
                <div className="text-sm text-[#6070a0] bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p>Nenhum conjunto elegível para esta cópia. Crie um conjunto para outra turma ou ajuste o conjunto existente.</p>
                  {motivosIndisponiveis.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 space-y-0.5 text-xs">
                      {motivosIndisponiveis.map(motivo => (
                        <li key={motivo}>Há conjunto que {motivo}.</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!!avaliacao.elegiveis.length && (
                <div className="space-y-3">
                  {avaliacao.elegiveis.length > 1 && (
                    <label className="block text-xs font-semibold text-[#101942]">
                      Conjunto de destino
                      <select
                        aria-label="Conjunto de destino"
                        value={selecionado?.conjunto.id || ''}
                        onChange={evento => setSelecionadoId(evento.target.value)}
                        className="mt-1 w-full border rounded-lg p-2 text-sm font-normal"
                      >
                        {avaliacao.elegiveis.map(item => (
                          <option key={item.conjunto.id} value={item.conjunto.id}>
                            {item.turma?.nome || item.conjunto.turmaId} · {item.conjunto.semestre}º semestre · {item.conjunto.anoLetivo}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {selecionado && (
                    <div className="border border-[#dce0f0] rounded-xl p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-wide font-semibold text-[#6070a0]">Destino</p>
                      <p className="font-semibold text-[#101942]">{turmaSelecionada?.nome || selecionado.conjunto.turmaId}</p>
                      <p className="text-xs text-[#6070a0]">{selecionado.conjunto.semestre}º semestre · ano {selecionado.conjunto.anoLetivo} · {destinatariosNomes.join(', ')}</p>
                      <p className={restante === 0 ? 'text-xs text-red-700' : 'text-xs text-emerald-700'}>Restam {pontos(restante)} pontos no conjunto de destino.</p>
                      {!selecionado.cabe && <p className="text-xs font-semibold text-amber-800">Reduza a pontuação das questões na revisão para caber nos {pontos(restante)} pontos disponíveis.</p>}
                      {fechaDez && <p className="text-xs font-semibold text-emerald-800">Esta cópia fechará 10 pontos e o conjunto será liberado para os alunos destinatários.</p>}
                    </div>
                  )}

                  <label className="block text-xs font-semibold text-[#101942]">
                    Novo prazo
                    <input
                      type="text"
                      value={prazo}
                      onChange={evento => setPrazo(evento.target.value)}
                      placeholder="dd/mm/aaaa hh:mm"
                      className="mt-1 w-full border rounded-lg p-2 text-sm font-normal"
                    />
                    <span className="block mt-1 text-[11px] font-normal text-[#6070a0]">Confirme o prazo para o novo público antes de revisar o conteúdo.</span>
                  </label>

                  <button
                    type="button"
                    onClick={revisar}
                    className="w-full px-4 py-2 rounded-xl bg-[#f60c49] text-white text-sm font-semibold"
                  >
                    Revisar conteúdo e prazo
                  </button>
                </div>
              )}

              <button type="button" onClick={() => setCriando(true)} className="w-full px-4 py-2 rounded-xl border border-[#dce0f0] text-[#101942] text-sm font-semibold">
                Criar novo conjunto
              </button>
            </>
          )}

          {!erroOrigem && criando && (
            <div ref={criacaoRef} tabIndex={-1}>
              <CriacaoConjunto
                turmas={turmasDestino}
                ano={ano}
                onCancelar={() => setCriando(false)}
                onCriar={criarConjunto}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
