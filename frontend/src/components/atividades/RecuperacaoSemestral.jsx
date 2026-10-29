"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listConjuntosRecuperacao,
  getConjuntoRecuperacao,
  criarConjuntoRecuperacao,
  cancelarConjuntoRecuperacao,
  listarAtividadesDoConjunto,
  listarEntregasDoConjunto,
} from '@/lib/firebase-recuperacao';
import { prepararLancamentoRecuperacao } from '@/aplicacao/diario/lancarRecuperacao';
import { RecuperacaoRepository } from '@/infraestrutura/diario/RecuperacaoRepository';
import { DiarioRepository } from '@/infraestrutura/diario/DiarioRepository';
import { AtividadeForm } from './AtividadeForm';
import { AtividadePainel } from './AtividadePainel';
import { CopiarRecuperacaoModal } from './CopiarRecuperacaoModal';
import { CriacaoConjunto } from './CriacaoConjunto';
import { copiarRecuperacaoParaOutraTurma } from '@/aplicacao/atividades/copiarRecuperacao';
import { getAtividade } from '@/lib/firebase-atividades';
import { conjuntoLiberadoParaResposta } from '@/dominio/atividades/recuperacaoSemestral';
import { calcDesempenhoAnual, fmt } from '@/utils/diario/calculos';
import { formatarDataEntrega } from '@/dominio/atividades/dataEntrega';
import { ROTULOS_APROVACAO } from '@/dominio/diario/aprovacao';

const pontos = valor => Number(valor || 0).toFixed(2).replace('.', ',');
const somarMaximos = atividades => atividades.reduce((soma, atividade) => soma + Number(atividade.notaMaxima || 0), 0);
const centesimos = valor => Math.round(Number(valor || 0) * 100);

const situacaoDaMontagem = (conjunto, totalDistribuido, restante) => {
  if (conjunto?.estado === 'cancelado') {
    return {
      titulo: 'Conjunto cancelado',
      detalhe: 'Nenhuma nova entrega é aceita. Entregas e notas já registradas permanecem preservadas.',
      classe: 'bg-slate-50 border-slate-200 text-slate-700',
    };
  }
  if (centesimos(restante) > 0) {
    return {
      titulo: `Montagem: ${pontos(totalDistribuido)} de 10 pontos`,
      detalhe: 'As parcelas ficam ocultas no Portal e não recebem entregas até a distribuição fechar exatamente 10 pontos.',
      classe: 'bg-amber-50 border-amber-200 text-amber-900',
    };
  }
  if (!conjuntoLiberadoParaResposta(conjunto)) {
    return {
      titulo: 'Distribuição completa; liberação pendente',
      detalhe: 'As parcelas só aparecem para os alunos depois que a liberação do conjunto for confirmada.',
      classe: 'bg-amber-50 border-amber-200 text-amber-900',
    };
  }
  return {
    titulo: 'Recuperação liberada para os alunos',
    detalhe: 'As parcelas já podem ser respondidas pelos destinatários. A primeira entrega congela a composição.',
    classe: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  };
};

const MOTIVOS_PENDENCIA = {
  sem_entrega: 'sem entrega',
  nao_corrigida: 'aguardando correção',
  nota_invalida: 'nota inválida',
  nota_acima_do_maximo: 'nota acima do máximo da atividade',
  entrega_duplicada: 'entregas duplicadas',
  entrega_fora_do_contexto: 'entrega de outro contexto',
};

const rotuloPendencia = pendencia => MOTIVOS_PENDENCIA[pendencia.motivo] || pendencia.motivo;

const conjuntosNoContexto = (lista, turmas, ano) => (lista || []).filter(conjunto => {
  if (!conjunto?.turmaId) return false;
  if (turmas?.length && !turmas.some(turma => turma.id === conjunto.turmaId)) return false;
  if (!ano || String(ano) === 'todos') return true;
  return String(conjunto.anoLetivo) === String(ano);
});

export function RecuperacaoSemestral({ user, turmas = [], ano, useAtividadesHook, aguardarSalvamento, recarregar }) {
  const uid = user?.uid;
  const [contaCarregada, setContaCarregada] = useState(uid);
  const [conjuntos, setConjuntos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [criando, setCriando] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [atividadeAberta, setAtividadeAberta] = useState(null);
  const [formAtividade, setFormAtividade] = useState(null);
  const [previa, setPrevia] = useState(null);
  const [selecionados, setSelecionados] = useState([]);
  const [substituicoes, setSubstituicoes] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [copiando, setCopiando] = useState(null);

  const uidRef = useRef(uid);
  const selecionadoRef = useRef(selecionadoId);

  // Refs espelham o estado depois do commit; nunca são escritas no render.
  useEffect(() => {
    uidRef.current = uid;
    selecionadoRef.current = selecionadoId;
  }, [uid, selecionadoId]);

  // Troca de conta limpa o estado já no render: nada da conta anterior
  // permanece visível nem serve de base para uma operação nova.
  if (contaCarregada !== uid) {
    setContaCarregada(uid);
    setConjuntos([]);
    setDetalhe(null);
    setPrevia(null);
    setSelecionadoId('');
    setAtividadeAberta(null);
    setFormAtividade(null);
    setSelecionados([]);
    setSubstituicoes([]);
    setCriando(false);
    setErro('');
    setMensagem('');
    setOcupado(false);
    setConfirmandoCancelamento(false);
    setCopiando(null);
    setCarregando(Boolean(uid));
  }

  const carregarConjuntos = useCallback(async () => {
    if (!uid) return;
    const conta = uid;
    try {
      const lista = await listConjuntosRecuperacao(conta, {
        anoLetivo: ano && String(ano) !== 'todos' ? String(ano) : undefined,
      });
      if (conta !== uidRef.current) return;
      const filtrados = conjuntosNoContexto(lista, turmas, ano);
      setConjuntos(lista);
      setSelecionadoId(prev => (filtrados.some(conjunto => conjunto.id === prev) ? prev : (filtrados[0]?.id || '')));
    } catch (error) {
      if (conta === uidRef.current) setErro(error.message);
    } finally {
      if (conta === uidRef.current) setCarregando(false);
    }
  }, [uid, turmas, ano]);

  useEffect(() => {
    let ativo = true;
    // Adia para microtask: o carregamento sempre começa fora do render/efeito.
    Promise.resolve().then(() => { if (ativo) return carregarConjuntos(); });
    return () => { ativo = false; };
  }, [carregarConjuntos]);

  const carregarDetalhe = useCallback(async () => {
    if (!uid || !selecionadoId) { setDetalhe(null); return; }
    const conta = uid;
    const alvo = selecionadoId;
    try {
      const conjunto = await getConjuntoRecuperacao(conta, alvo);
      const atividades = await listarAtividadesDoConjunto(conta, alvo);
      if (conta !== uidRef.current || alvo !== selecionadoRef.current) return;
      if (conjunto) setDetalhe({ conjunto, atividades });
    } catch (error) {
      if (conta === uidRef.current && alvo === selecionadoRef.current) setErro(error.message);
    }
  }, [uid, selecionadoId]);

  useEffect(() => {
    if (!uid || !selecionadoId) return undefined;
    let ativo = true;
    const conta = uid;
    const alvo = selecionadoId;
    Promise.all([
      getConjuntoRecuperacao(conta, alvo),
      listarAtividadesDoConjunto(conta, alvo),
    ])
      .then(([conjunto, atividades]) => {
        if (!ativo || conta !== uidRef.current || alvo !== selecionadoRef.current || !conjunto) return;
        setDetalhe({ conjunto, atividades });
      })
      .catch(error => {
        if (ativo && conta === uidRef.current && alvo === selecionadoRef.current) setErro(error.message);
      });
    return () => { ativo = false; };
  }, [uid, selecionadoId]);

  const detalheVisivel = detalhe?.conjunto
    && detalhe.conjunto.id === selecionadoId
    && (!ano || String(ano) === 'todos' || String(detalhe.conjunto.anoLetivo) === String(ano))
    && (!turmas.length || turmas.some(turma => turma.id === detalhe.conjunto.turmaId))
    ? detalhe
    : null;

  const previaVisivel = previa
    && previa.contextoConta === uid
    && previa.contextoAno === String(ano ?? '')
    && previa.conjuntoId === selecionadoId
    && detalheVisivel?.conjunto?.id === previa.conjuntoId
    ? previa
    : null;

  const turmaDoConjunto = detalheVisivel?.conjunto
    ? (turmas.find(t => t.id === detalheVisivel.conjunto.turmaId) || null)
    : null;
  const totalDistribuido = detalheVisivel ? somarMaximos(detalheVisivel.atividades) : 0;
  const restante = Math.round((10 - totalDistribuido) * 100) / 100;
  const situacao = detalheVisivel
    ? situacaoDaMontagem(detalheVisivel.conjunto, totalDistribuido, restante)
    : null;

  const criar = async (dados, alunos) => {
    const conta = uid;
    const conjunto = await criarConjuntoRecuperacao(uid, dados, alunos);
    if (conta !== uidRef.current) return;
    setCriando(false);
    setMensagem('Conjunto criado. Distribua os 10 pontos entre as atividades.');
    await carregarConjuntos();
    if (conta !== uidRef.current) return;
    setSelecionadoId(conjunto.id);
  };

  const contextoFormulario = (atividadeEdicao = null) => ({
    finalidade: 'recuperacao_semestral',
    conjuntoRecuperacaoId: detalheVisivel.conjunto.id,
    conjuntoVersao: detalheVisivel.conjunto.versao,
    semestre: detalheVisivel.conjunto.semestre,
    anoLetivo: detalheVisivel.conjunto.anoLetivo,
    turmaId: detalheVisivel.conjunto.turmaId,
    destinatariosIds: detalheVisivel.conjunto.destinatariosIds,
    pontosRestantes: Math.round((restante + Number(atividadeEdicao?.notaMaxima || 0)) * 100) / 100,
  });

  const salvarAtividade = async (dados) => {
    const conta = uid;
    const conjuntoId = detalheVisivel?.conjunto?.id;
    await useAtividadesHook.createAtividade(dados);
    if (conta !== uidRef.current || !conjuntoId) return;
    setFormAtividade(null);
    await carregarDetalhe();
    if (conta !== uidRef.current) return;
    const atividades = await listarAtividadesDoConjunto(conta, conjuntoId);
    if (conta !== uidRef.current) return;
    const total = Math.round(somarMaximos(atividades) * 100) / 100;
    setMensagem(centesimos(total) === 1000
      ? 'Atividade criada. A distribuição fechou exatamente 10 pontos e as parcelas foram liberadas para os alunos destinatários.'
      : `Atividade criada. O conjunto segue em montagem: ${pontos(total)} de 10 pontos distribuídos. Nenhuma parcela aparece no Portal até o fechamento dos 10.`);
  };

  const salvarCopiaAtividade = async (dados, { destino, turmaDestino, versaoEsperada }) => {
    const conta = uid;
    const origemId = copiando?.id;
    const conjuntoOrigemId = selecionadoRef.current;
    if (!origemId) throw new Error('Reabra a atividade de origem para copiar.');

    const copiaId = await copiarRecuperacaoParaOutraTurma({
      professorId: conta,
      origemId,
      destinoId: destino.id,
      dados,
      turmaDestino,
      versaoEsperada,
      carregarOrigem: getAtividade,
      carregarDestino: getConjuntoRecuperacao,
      criarAtividade: useAtividadesHook.createAtividade,
    });

    if (conta !== uidRef.current || conjuntoOrigemId !== selecionadoRef.current) return copiaId;
    await carregarConjuntos();
    if (conta !== uidRef.current || conjuntoOrigemId !== selecionadoRef.current) return copiaId;
    setMensagem('Cópia criada no conjunto de destino. Ao fechar 10 pontos, as atividades ficam disponíveis aos alunos. O boletim continua dependendo de lançamento e publicação no Diário.');
    return copiaId;
  };

  const cancelarConjunto = async () => {
    if (!detalheVisivel?.conjunto || ocupado) return;
    const conta = uid;
    const conjuntoId = detalheVisivel.conjunto.id;
    setErro('');
    setMensagem('');
    setOcupado(true);
    try {
      await cancelarConjuntoRecuperacao(conta, conjuntoId);
      if (conta !== uidRef.current || conjuntoId !== selecionadoRef.current) return;
      setConfirmandoCancelamento(false);
      setPrevia(null);
      setMensagem('Conjunto cancelado. Nenhuma nova entrega será aceita; entregas e notas já registradas permanecem preservadas.');
      await carregarDetalhe();
    } catch (error) {
      if (conta === uidRef.current) setErro(error.message);
    } finally {
      if (conta === uidRef.current) setOcupado(false);
    }
  };

  const conferir = async () => {
    if (!detalheVisivel?.conjunto || ocupado) return;
    const conta = uid;
    const conjuntoId = detalheVisivel.conjunto.id;
    setErro('');
    setMensagem('');
    setOcupado(true);
    try {
      await aguardarSalvamento?.();
      const base = await new DiarioRepository(conta).carregar();
      const atividades = await listarAtividadesDoConjunto(conta, conjuntoId);
      const entregas = await listarEntregasDoConjunto(atividades.map(a => a.id));
      const conjunto = await getConjuntoRecuperacao(conta, conjuntoId);
      const nova = prepararLancamentoRecuperacao({ turmas: base.turmas, conjunto, atividades, entregas });
      if (conta !== uidRef.current || conjuntoId !== selecionadoRef.current) return;
      setDetalhe({ conjunto, atividades });
      setPrevia({ ...nova, base, atividades, contextoConta: conta, contextoAno: String(ano ?? '') });
      setSelecionados(nova.alunos.filter(a => a.completo).map(a => a.alunoId));
      setSubstituicoes([]);
    } catch (error) {
      if (conta === uidRef.current) setErro(error.message);
    } finally {
      if (conta === uidRef.current) setOcupado(false);
    }
  };

  const lancar = async () => {
    if (!previaVisivel || !detalheVisivel?.conjunto) return;
    const conta = uid;
    const previaAtual = previaVisivel;
    setErro('');
    setMensagem('');
    setOcupado(true);
    try {
      const resultado = await new RecuperacaoRepository(conta).lancar({
        base: previaAtual.base,
        conjunto: detalheVisivel.conjunto,
        atividades: previaAtual.atividades,
        previa: previaAtual,
        selecionados,
        confirmarSubstituicao: substituicoes,
        por: conta,
      });
      if (conta !== uidRef.current) return;
      setPrevia(null);
      await recarregar?.();
      await carregarDetalhe();
      if (conta !== uidRef.current) return;
      const repetidos = resultado.ignorados.filter(i => i.motivo === 'repetido').length;
      setMensagem(`Recuperação lançada para ${resultado.lancados.length} ${resultado.lancados.length === 1 ? 'aluno' : 'alunos'}.${repetidos ? ` ${repetidos} já estava(m) gravado(s) e foi(ram) preservado(s).` : ''} Publicar no Portal continua sendo uma ação separada.`);
    } catch (error) {
      if (conta !== uidRef.current) return;
      if (error.code === 'RECUPERACAO_PREVIA_OBSOLETA') {
        setPrevia(null);
        setErro('A recuperação ou uma correção mudou depois da prévia. Gere a prévia novamente antes de lançar.');
      } else {
        setErro(error.message);
      }
    } finally {
      if (conta === uidRef.current) setOcupado(false);
    }
  };

  const alternarSelecionado = (alunoId) => setSelecionados(prev => prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]);
  const alternarSubstituicao = (alunoId) => setSubstituicoes(prev => prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]);

  const trocarConjunto = (conjuntoId) => {
    if (ocupado) return;
    setSelecionadoId(conjuntoId);
    setDetalhe(null);
    setPrevia(null);
    setSelecionados([]);
    setSubstituicoes([]);
    setAtividadeAberta(null);
    setFormAtividade(null);
    setCopiando(null);
    setConfirmandoCancelamento(false);
  };

  const alunosPorId = useMemo(() => new Map((turmaDoConjunto?.alunos || []).map(aluno => [aluno.id, aluno])), [turmaDoConjunto]);

  const efeitoPorAluno = useMemo(() => {
    const mapa = new Map();
    if (!previaVisivel || !turmaDoConjunto) return mapa;
    const chave = previaVisivel.campo === 'rec1' ? 'S1' : 'S2';
    for (const aluno of previaVisivel.alunos) {
      try {
        const antes = calcDesempenhoAnual(turmaDoConjunto, aluno.alunoId)[chave];
        const depoisTurma = {
          ...turmaDoConjunto,
          recuperacao: {
            ...(turmaDoConjunto.recuperacao || {}),
            [aluno.alunoId]: {
              ...(turmaDoConjunto.recuperacao?.[aluno.alunoId] || {}),
              [previaVisivel.campo]: aluno.total,
            },
          },
        };
        const depois = calcDesempenhoAnual(depoisTurma, aluno.alunoId)[chave];
        mapa.set(aluno.alunoId, { antes, depois });
      } catch {
        // Diário sem bimestres completos: a prévia ainda pode lançar a nota.
      }
    }
    return mapa;
  }, [previaVisivel, turmaDoConjunto]);

  if (atividadeAberta) {
    return (
      <div>
        <button type="button" onClick={() => { setAtividadeAberta(null); carregarDetalhe(); }} className="mb-3 text-xs font-semibold text-[#6070a0] underline">Voltar ao conjunto</button>
        <AtividadePainel
          atividade={atividadeAberta}
          user={user}
          turmas={turmaDoConjunto ? [turmaDoConjunto] : []}
          currentTurmaId={detalheVisivel?.conjunto.turmaId}
          useAtividadesHook={useAtividadesHook}
          sincronizacaoAutomatica={false}
          onBack={() => { setAtividadeAberta(null); carregarDetalhe(); }}
          onDelete={async () => { await useAtividadesHook.deleteAtividade(atividadeAberta.id); setAtividadeAberta(null); carregarDetalhe(); }}
        />
      </div>
    );
  }

  const conjuntosVisiveis = conjuntosNoContexto(conjuntos, turmas, ano);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#101942]">Recuperação semestral</h1>
          <p className="text-sm text-[#6070a0]">Uma ou várias atividades somando 10 pontos. Corrigir, conferir, lançar e publicar são ações separadas.</p>
        </div>
        <button type="button" onClick={() => setCriando(true)} disabled={ocupado} className="px-4 py-2 rounded-xl bg-[#f60c49] text-white text-sm font-semibold disabled:bg-slate-300">Novo conjunto</button>
      </div>

      {erro && <p role="alert" className="bg-red-50 text-red-800 rounded-xl p-3 text-sm">{erro}</p>}
      {mensagem && <p role="status" className="bg-emerald-50 text-emerald-900 rounded-xl p-3 text-sm">{mensagem}</p>}
      {carregando && <p className="text-sm text-[#6070a0]">Carregando conjuntos...</p>}
      {!carregando && !conjuntosVisiveis.length && !criando && <p className="bg-white border border-[#dce0f0] rounded-2xl p-5 text-sm text-[#6070a0]">Nenhum conjunto de recuperação neste ano letivo. Crie um para distribuir os 10 pontos.</p>}

      {criando && (
        <CriacaoConjunto
          turmas={turmas}
          ano={ano}
          onCancelar={() => setCriando(false)}
          onCriar={criar}
        />
      )}

      {!!conjuntosVisiveis.length && (
        <div className="flex flex-wrap gap-2">
          {conjuntosVisiveis.map(conjunto => (
            <button
              key={conjunto.id}
              type="button"
              onClick={() => trocarConjunto(conjunto.id)}
              disabled={ocupado}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-60 ${selecionadoId === conjunto.id ? 'bg-[#101942] text-white border-[#101942]' : 'bg-white text-[#101942] border-[#dce0f0]'}`}
            >
              {turmas.find(t => t.id === conjunto.turmaId)?.nome || conjunto.turmaId} · {conjunto.semestre}º sem. · {conjunto.anoLetivo}
            </button>
          ))}
        </div>
      )}

      {detalheVisivel && (
        <section className="bg-white border border-[#dce0f0] rounded-2xl p-5 space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-[#101942]">
                {turmaDoConjunto?.nome || detalheVisivel.conjunto.turmaId} · Recuperação do {detalheVisivel.conjunto.semestre}º semestre
              </h2>
              <p className="text-xs text-[#6070a0]">
                {detalheVisivel.conjunto.destinatariosIds.length} {detalheVisivel.conjunto.destinatariosIds.length === 1 ? 'aluno destinatário' : 'alunos destinatários'} · ano {detalheVisivel.conjunto.anoLetivo} · versão {detalheVisivel.conjunto.versao}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-[#101942]">{pontos(totalDistribuido)} de 10 pontos distribuídos</p>
              <p className={restante === 0 ? 'text-emerald-700' : 'text-amber-700'}>
                {restante === 0 ? 'Distribuição completa' : `Restam ${pontos(restante)} pontos`}
              </p>
            </div>
          </header>

          {situacao && (
            <div className={`border rounded-xl p-3 text-xs ${situacao.classe}`}>
              <p className="font-semibold">{situacao.titulo}</p>
              <p>{situacao.detalhe}</p>
            </div>
          )}

          <div className="space-y-2">
            {detalheVisivel.atividades.map(atividade => (
              <div key={atividade.id} className="flex flex-wrap items-center justify-between gap-2 border border-[#dce0f0] rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-[#101942]">{atividade.titulo}</p>
                  <p className="text-xs text-[#6070a0]">Vale até {pontos(atividade.notaMaxima)} · entrega em {formatarDataEntrega(atividade.dataEntrega, { vazio: 'data não informada' })} · {atividade.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setCopiando(atividade)} disabled={ocupado} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#dce0f0] text-[#101942] disabled:opacity-60">Copiar para outra turma</button>
                  <button type="button" onClick={() => setAtividadeAberta(atividade)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eef0f8] text-[#101942]">Corrigir</button>
                </div>
              </div>
            ))}
            {!detalheVisivel.atividades.length && <p className="text-sm text-[#6070a0]">Nenhuma atividade ainda. Distribua os 10 pontos criando a primeira.</p>}
          </div>

          {restante > 0 && detalheVisivel.conjunto.estado !== 'cancelado' && (
            <button type="button" onClick={() => setFormAtividade({})} className="px-4 py-2 rounded-xl bg-[#101942] text-white text-sm font-semibold">
              {detalheVisivel.atividades.length ? `Adicionar atividade (até ${pontos(restante)} pontos)` : 'Criar primeira atividade'}
            </button>
          )}
          {restante === 0 && detalheVisivel.conjunto.estado !== 'pronto' && detalheVisivel.conjunto.estado !== 'cancelado' && <p className="text-xs text-emerald-700">A distribuição está completa. O conjunto será marcado como pronto ao salvar a última atividade.</p>}

          <div className="border-t border-[#dce0f0] pt-3 flex flex-wrap gap-2">
            <button type="button" onClick={conferir} disabled={ocupado || restante > 0 || !detalheVisivel.atividades.length || detalheVisivel.conjunto.estado === 'cancelado'} className="px-4 py-2 rounded-xl bg-[#f60c49] text-white text-sm font-semibold disabled:bg-slate-200">
              {ocupado ? 'Conferindo...' : 'Conferir recuperação'}
            </button>
            <p className="text-xs text-[#6070a0] self-center">A prévia não grava nota. Só a confirmação lança em rec{detalheVisivel.conjunto.semestre === '2' ? '2' : '1'}.</p>
          </div>

          {previaVisivel && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
              <h3 className="text-sm font-bold text-amber-900">Prévia do lançamento em rec{previaVisivel.campo === 'rec2' ? '2' : '1'}</h3>
              <p className="text-xs text-amber-900">{previaVisivel.completos} completo(s), {previaVisivel.pendentes} pendente(s), {previaVisivel.substituicoes} substituição(ões) de nota manual.</p>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-amber-900">
                      <th className="p-2">Lançar</th>
                      <th className="p-2">Aluno</th>
                      <th className="p-2">Parcelas conferidas</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Efeito no semestre</th>
                      <th className="p-2">Pendências</th>
                      <th className="p-2">Nota atual</th>
                      <th className="p-2">Substituir manual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previaVisivel.alunos.map(aluno => {
                      const efeito = efeitoPorAluno.get(aluno.alunoId);
                      const titulo = atividadeId => detalheVisivel.atividades.find(a => a.id === atividadeId)?.titulo || atividadeId;
                      return (
                        <tr key={aluno.alunoId} className="border-t border-amber-200 align-top">
                          <td className="p-2">
                            <input type="checkbox" aria-label={`Lançar recuperação de ${aluno.nome || aluno.alunoId}`} disabled={!aluno.completo || aluno.repetido} checked={selecionados.includes(aluno.alunoId)} onChange={() => alternarSelecionado(aluno.alunoId)} />
                          </td>
                          <td className="p-2">{aluno.nome || alunosPorId.get(aluno.alunoId)?.nome || aluno.alunoId}</td>
                          <td className="p-2">
                            {aluno.parcelas.length
                              ? aluno.parcelas.map(parcela => `${titulo(parcela.atividadeId)}: ${pontos(parcela.nota)}`).join(' + ')
                              : '—'}
                          </td>
                          <td className="p-2 font-mono">{aluno.completo ? pontos(aluno.total) : '—'}</td>
                          <td className="p-2">
                            {efeito
                              ? `${fmt(efeito.antes?.total)} → ${fmt(efeito.depois?.total)} (${ROTULOS_APROVACAO[efeito.depois?.status] || 'situação a confirmar'})`
                              : '—'}
                          </td>
                          <td className="p-2">{aluno.completo ? (aluno.repetido ? 'já lançado' : '—') : aluno.pendencias.map(rotuloPendencia).join(', ')}</td>
                          <td className="p-2 font-mono">{aluno.notaAtual == null ? '—' : pontos(aluno.notaAtual)}</td>
                          <td className="p-2">
                            {aluno.substitui ? (
                              <label className="flex items-center gap-1">
                                <input type="checkbox" aria-label={`Substituir nota manual de ${aluno.nome || aluno.alunoId}`} checked={substituicoes.includes(aluno.alunoId)} onChange={() => alternarSubstituicao(aluno.alunoId)} />
                                confirmar
                              </label>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPrevia(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300">Cancelar prévia</button>
                <button type="button" onClick={lancar} disabled={ocupado || !selecionados.length} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white disabled:bg-slate-300">
                  {ocupado ? 'Lançando...' : 'Lançar recuperação'}
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-[#dce0f0] pt-3">
            {detalheVisivel.conjunto.estado === 'cancelado' ? (
              <p className="text-xs text-slate-600">Conjunto cancelado. Nenhuma nova entrega será aceita; o histórico existente permanece preservado.</p>
            ) : !confirmandoCancelamento ? (
              <button type="button" onClick={() => setConfirmandoCancelamento(true)} disabled={ocupado} className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold disabled:opacity-60">
                Cancelar conjunto
              </button>
            ) : (
              <div role="alertdialog" aria-label="Confirmar cancelamento do conjunto" className="border border-red-200 bg-red-50 rounded-xl p-3 space-y-2">
                <p className="text-xs text-red-800">Cancelar o conjunto impede novas entregas e novas parcelas. Entregas e notas já registradas não são apagadas.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setConfirmandoCancelamento(false)} disabled={ocupado} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300">Voltar</button>
                  <button type="button" onClick={cancelarConjunto} disabled={ocupado} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 text-white disabled:bg-slate-300">
                    {ocupado ? 'Cancelando...' : 'Confirmar cancelamento'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {formAtividade && detalheVisivel && (
        <AtividadeForm
          turmas={turmaDoConjunto ? [turmaDoConjunto] : turmas.filter(t => t.id === detalheVisivel.conjunto.turmaId)}
          onCreate={salvarAtividade}
          onClose={() => setFormAtividade(null)}
          contextoInicial={contextoFormulario()}
        />
      )}

      {copiando && detalheVisivel?.atividades.some(atividade => atividade.id === copiando.id) && (
        <CopiarRecuperacaoModal
          key={`${uid}:${ano}:${copiando.id}`}
          user={user}
          origem={copiando}
          turmas={turmas}
          ano={ano}
          onClose={() => setCopiando(null)}
          onSalvar={salvarCopiaAtividade}
        />
      )}
    </div>
  );
}
