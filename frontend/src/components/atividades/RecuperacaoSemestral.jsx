"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listConjuntosRecuperacao,
  getConjuntoRecuperacao,
  criarConjuntoRecuperacao,
  listarAtividadesDoConjunto,
  listarEntregasDoConjunto,
} from '@/lib/firebase-recuperacao';
import { prepararLancamentoRecuperacao } from '@/aplicacao/diario/lancarRecuperacao';
import { RecuperacaoRepository } from '@/infraestrutura/diario/RecuperacaoRepository';
import { DiarioRepository } from '@/infraestrutura/diario/DiarioRepository';
import { AtividadeForm } from './AtividadeForm';
import { AtividadePainel } from './AtividadePainel';

const pontos = valor => Number(valor || 0).toFixed(2).replace('.', ',');
const somarMaximos = atividades => atividades.reduce((soma, atividade) => soma + Number(atividade.notaMaxima || 0), 0);

const anoAtual = () => String(new Date().getFullYear());

function CriacaoConjunto({ turmas, ano, onCancelar, onCriar }) {
  const turmasDisponiveis = turmas || [];
  const [turmaId, setTurmaId] = useState(turmasDisponiveis[0]?.id || '');
  const [anoLetivo, setAnoLetivo] = useState(ano && ano !== 'legado' ? String(ano) : anoAtual());
  const [semestre, setSemestre] = useState('1');
  const [destinatarios, setDestinatarios] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const turma = turmasDisponiveis.find(t => t.id === turmaId);

  const alternar = (alunoId) => setDestinatarios(prev => prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]);

  const enviar = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onCriar({ turmaId, anoLetivo: String(anoLetivo), semestre, destinatariosIds: destinatarios }, turma?.alunos || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="bg-white border border-[#dce0f0] rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-[#101942]">Novo conjunto de recuperação semestral</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-semibold text-[#101942]">Turma
          <select aria-label="Turma da recuperação" value={turmaId} onChange={e => { setTurmaId(e.target.value); setDestinatarios([]); }} className="mt-1 w-full border rounded-lg p-2 text-sm font-normal">
            {turmasDisponiveis.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#101942]">Ano letivo
          <input aria-label="Ano letivo da recuperação" value={anoLetivo} onChange={e => setAnoLetivo(e.target.value)} inputMode="numeric" className="mt-1 w-full border rounded-lg p-2 text-sm font-normal" />
        </label>
        <label className="text-xs font-semibold text-[#101942]">Semestre
          <select aria-label="Semestre da recuperação" value={semestre} onChange={e => setSemestre(e.target.value)} className="mt-1 w-full border rounded-lg p-2 text-sm font-normal">
            <option value="1">1º semestre</option>
            <option value="2">2º semestre</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold text-[#101942] mb-2">Alunos em recuperação ({destinatarios.length})</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-auto border border-[#dce0f0] rounded-xl p-2">
          {(turma?.alunos || []).map(aluno => (
            <label key={aluno.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-slate-50">
              <input type="checkbox" checked={destinatarios.includes(aluno.id)} onChange={() => alternar(aluno.id)} />
              {aluno.nome}
            </label>
          ))}
          {!turma?.alunos?.length && <p className="text-xs text-slate-500 p-2">Turma sem alunos.</p>}
        </div>
      </fieldset>

      <p className="text-xs text-[#6070a0]">O conjunto nasce vazio. Você distribui os 10 pontos entre uma ou várias atividades depois. Nenhum aluno é matriculado automaticamente na recuperação.</p>
      {erro && <p role="alert" className="text-sm text-red-700 bg-red-50 rounded p-2">{erro}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className="flex-1 py-2 bg-slate-50 border rounded-xl text-sm">Cancelar</button>
        <button type="submit" disabled={salvando || !turmaId || !destinatarios.length} className="flex-1 py-2 bg-[#f60c49] text-white rounded-xl text-sm font-semibold disabled:bg-slate-200">
          {salvando ? 'Criando...' : 'Criar conjunto'}
        </button>
      </div>
    </form>
  );
}

export function RecuperacaoSemestral({ user, turmas = [], ano, useAtividadesHook, aguardarSalvamento, recarregar }) {
  const uid = user?.uid;
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

  const carregarConjuntos = useCallback(async () => {
    if (!uid) return;
    setCarregando(true);
    setErro('');
    try {
      const lista = await listConjuntosRecuperacao(uid);
      setConjuntos(lista);
      setSelecionadoId(prev => prev || lista[0]?.id || '');
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [uid]);

  // Busca inicial por promessa: não dispara setState síncrono dentro do efeito.
  useEffect(() => {
    let ativo = true;
    if (!uid) return undefined;
    listConjuntosRecuperacao(uid)
      .then(lista => {
        if (!ativo) return;
        setConjuntos(lista);
        setSelecionadoId(prev => prev || lista[0]?.id || '');
      })
      .catch(error => { if (ativo) setErro(error.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [uid]);

  const carregarDetalhe = useCallback(async () => {
    if (!uid || !selecionadoId) { setDetalhe(null); return; }
    try {
      const conjunto = await getConjuntoRecuperacao(uid, selecionadoId);
      const atividades = await listarAtividadesDoConjunto(uid, selecionadoId);
      setDetalhe({ conjunto, atividades });
    } catch (error) {
      setErro(error.message);
    }
  }, [uid, selecionadoId]);

  useEffect(() => {
    let ativo = true;
    if (!uid || !selecionadoId) return undefined;
    Promise.all([
      getConjuntoRecuperacao(uid, selecionadoId),
      listarAtividadesDoConjunto(uid, selecionadoId),
    ])
      .then(([conjunto, atividades]) => { if (ativo) setDetalhe({ conjunto, atividades }); })
      .catch(error => { if (ativo) setErro(error.message); });
    return () => { ativo = false; };
  }, [uid, selecionadoId]);

  const turmaDoConjunto = detalhe ? (turmas.find(t => t.id === detalhe.conjunto.turmaId) || null) : null;
  const totalDistribuido = detalhe ? somarMaximos(detalhe.atividades) : 0;
  const restante = Math.round((10 - totalDistribuido) * 100) / 100;

  const criar = async (dados, alunos) => {
    const conjunto = await criarConjuntoRecuperacao(user.uid, dados, alunos);
    setCriando(false);
    setMensagem('Conjunto criado. Distribua os 10 pontos entre as atividades.');
    await carregarConjuntos();
    setSelecionadoId(conjunto.id);
  };

  const contextoFormulario = (atividadeEdicao = null) => ({
    finalidade: 'recuperacao_semestral',
    conjuntoRecuperacaoId: detalhe.conjunto.id,
    semestre: detalhe.conjunto.semestre,
    anoLetivo: detalhe.conjunto.anoLetivo,
    turmaId: detalhe.conjunto.turmaId,
    destinatariosIds: detalhe.conjunto.destinatariosIds,
    pontosRestantes: Math.round((restante + Number(atividadeEdicao?.notaMaxima || 0)) * 100) / 100,
  });

  const salvarAtividade = async (dados) => {
    await useAtividadesHook.createAtividade(dados);
    setFormAtividade(null);
    setMensagem('Atividade de recuperação criada. Envie o acesso aos alunos destinatários.');
    await carregarDetalhe();
  };

  const conferir = async () => {
    setErro('');
    setMensagem('');
    setOcupado(true);
    try {
      await aguardarSalvamento?.();
      const base = await new DiarioRepository(user.uid).carregar();
      const atividades = await listarAtividadesDoConjunto(user.uid, detalhe.conjunto.id);
      const entregas = await listarEntregasDoConjunto(atividades.map(a => a.id));
      const conjunto = await getConjuntoRecuperacao(user.uid, detalhe.conjunto.id);
      const nova = prepararLancamentoRecuperacao({ turmas: base.turmas, conjunto, atividades, entregas });
      setDetalhe({ conjunto, atividades });
      setPrevia({ ...nova, base, atividades });
      setSelecionados(nova.alunos.filter(a => a.completo).map(a => a.alunoId));
      setSubstituicoes([]);
    } catch (error) {
      setErro(error.message);
    } finally {
      setOcupado(false);
    }
  };

  const lancar = async () => {
    if (!previa) return;
    setErro('');
    setMensagem('');
    setOcupado(true);
    try {
      const resultado = await new RecuperacaoRepository(user.uid).lancar({
        base: previa.base,
        conjunto: detalhe.conjunto,
        atividades: previa.atividades,
        previa,
        selecionados,
        confirmarSubstituicao: substituicoes,
        por: user.uid,
      });
      setPrevia(null);
      await recarregar?.();
      await carregarDetalhe();
      const repetidos = resultado.ignorados.filter(i => i.motivo === 'repetido').length;
      setMensagem(`Recuperação lançada para ${resultado.lancados.length} ${resultado.lancados.length === 1 ? 'aluno' : 'alunos'}.${repetidos ? ` ${repetidos} já estava(m) gravado(s) e foi(ram) preservado(s).` : ''} Publicar no Portal continua sendo uma ação separada.`);
    } catch (error) {
      if (error.code === 'RECUPERACAO_PREVIA_OBSOLETA') {
        setPrevia(null);
        setErro('A recuperação ou uma correção mudou depois da prévia. Gere a prévia novamente antes de lançar.');
      } else {
        setErro(error.message);
      }
    } finally {
      setOcupado(false);
    }
  };

  const alternarSelecionado = (alunoId) => setSelecionados(prev => prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]);
  const alternarSubstituicao = (alunoId) => setSubstituicoes(prev => prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]);

  const alunosPorId = useMemo(() => new Map((turmaDoConjunto?.alunos || []).map(aluno => [aluno.id, aluno])), [turmaDoConjunto]);

  if (atividadeAberta) {
    return (
      <div>
        <button type="button" onClick={() => { setAtividadeAberta(null); carregarDetalhe(); }} className="mb-3 text-xs font-semibold text-[#6070a0] underline">Voltar ao conjunto</button>
        <AtividadePainel
          atividade={atividadeAberta}
          user={user}
          turmas={turmaDoConjunto ? [turmaDoConjunto] : []}
          currentTurmaId={detalhe?.conjunto.turmaId}
          useAtividadesHook={useAtividadesHook}
          sincronizacaoAutomatica={false}
          onBack={() => { setAtividadeAberta(null); carregarDetalhe(); }}
          onDelete={async () => { await useAtividadesHook.deleteAtividade(atividadeAberta.id); setAtividadeAberta(null); carregarDetalhe(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#101942]">Recuperação semestral</h1>
          <p className="text-sm text-[#6070a0]">Uma ou várias atividades somando 10 pontos. Corrigir, conferir, lançar e publicar são ações separadas.</p>
        </div>
        <button type="button" onClick={() => setCriando(true)} className="px-4 py-2 rounded-xl bg-[#f60c49] text-white text-sm font-semibold">Novo conjunto</button>
      </div>

      {erro && <p role="alert" className="bg-red-50 text-red-800 rounded-xl p-3 text-sm">{erro}</p>}
      {mensagem && <p role="status" className="bg-emerald-50 text-emerald-900 rounded-xl p-3 text-sm">{mensagem}</p>}
      {carregando && <p className="text-sm text-[#6070a0]">Carregando conjuntos...</p>}
      {!carregando && !conjuntos.length && !criando && <p className="bg-white border border-[#dce0f0] rounded-2xl p-5 text-sm text-[#6070a0]">Nenhum conjunto de recuperação. Crie um para distribuir os 10 pontos.</p>}

      {criando && (
        <CriacaoConjunto
          turmas={turmas}
          ano={ano}
          onCancelar={() => setCriando(false)}
          onCriar={criar}
        />
      )}

      {!!conjuntos.length && (
        <div className="flex flex-wrap gap-2">
          {conjuntos.map(conjunto => (
            <button
              key={conjunto.id}
              type="button"
              onClick={() => setSelecionadoId(conjunto.id)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${selecionadoId === conjunto.id ? 'bg-[#101942] text-white border-[#101942]' : 'bg-white text-[#101942] border-[#dce0f0]'}`}
            >
              {turmas.find(t => t.id === conjunto.turmaId)?.nome || conjunto.turmaId} · {conjunto.semestre}º sem. · {conjunto.anoLetivo}
            </button>
          ))}
        </div>
      )}

      {detalhe && (
        <section className="bg-white border border-[#dce0f0] rounded-2xl p-5 space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-[#101942]">
                {turmaDoConjunto?.nome || detalhe.conjunto.turmaId} · Recuperação do {detalhe.conjunto.semestre}º semestre
              </h2>
              <p className="text-xs text-[#6070a0]">
                {detalhe.conjunto.destinatariosIds.length} {detalhe.conjunto.destinatariosIds.length === 1 ? 'aluno destinatário' : 'alunos destinatários'} · ano {detalhe.conjunto.anoLetivo} · versão {detalhe.conjunto.versao}
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-[#101942]">{pontos(totalDistribuido)} de 10 pontos distribuídos</p>
              <p className={restante === 0 ? 'text-emerald-700' : 'text-amber-700'}>
                {restante === 0 ? 'Distribuição completa' : `Restam ${pontos(restante)} pontos`}
              </p>
            </div>
          </header>

          <div className="space-y-2">
            {detalhe.atividades.map(atividade => (
              <div key={atividade.id} className="flex flex-wrap items-center justify-between gap-2 border border-[#dce0f0] rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-[#101942]">{atividade.titulo}</p>
                  <p className="text-xs text-[#6070a0]">Vale até {pontos(atividade.notaMaxima)} · entrega em {atividade.dataEntrega?.toDate?.().toLocaleString?.('pt-BR') || 'data não informada'} · {atividade.status}</p>
                </div>
                <button type="button" onClick={() => setAtividadeAberto(atividade)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eef0f8] text-[#101942]">Corrigir</button>
              </div>
            ))}
            {!detalhe.atividades.length && <p className="text-sm text-[#6070a0]">Nenhuma atividade ainda. Distribua os 10 pontos criando a primeira.</p>}
          </div>

          {restante > 0 && (
            <button type="button" onClick={() => setFormAtividade({})} className="px-4 py-2 rounded-xl bg-[#101942] text-white text-sm font-semibold">
              {detalhe.atividades.length ? `Adicionar atividade (até ${pontos(restante)} pontos)` : 'Criar primeira atividade'}
            </button>
          )}
          {restante === 0 && detalhe.estado !== 'pronto' && <p className="text-xs text-emerald-700">A distribuição está completa. O conjunto será marcado como pronto ao salvar a última atividade.</p>}

          <div className="border-t border-[#dce0f0] pt-3 flex flex-wrap gap-2">
            <button type="button" onClick={conferir} disabled={ocupado || restante > 0 || !detalhe.atividades.length} className="px-4 py-2 rounded-xl bg-[#f60c49] text-white text-sm font-semibold disabled:bg-slate-200">
              {ocupado ? 'Conferindo...' : 'Conferir recuperação'}
            </button>
            <p className="text-xs text-[#6070a0] self-center">A prévia não grava nota. Só a confirmação lança em rec{detalhe.conjunto.semestre === '2' ? '2' : '1'}.</p>
          </div>

          {previa && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
              <h3 className="text-sm font-bold text-amber-900">Prévia do lançamento em rec{detalhe.conjunto.semestre === '2' ? '2' : '1'}</h3>
              <p className="text-xs text-amber-900">{previa.completos} completo(s), {previa.pendentes} pendente(s), {previa.substituicoes} substituição(ões) de nota manual.</p>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-amber-900">
                      <th className="p-2">Lançar</th>
                      <th className="p-2">Aluno</th>
                      <th className="p-2">Total</th>
                      <th className="p-2">Pendências</th>
                      <th className="p-2">Nota atual</th>
                      <th className="p-2">Substituir manual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previa.alunos.map(aluno => (
                      <tr key={aluno.alunoId} className="border-t border-amber-200">
                        <td className="p-2">
                          <input type="checkbox" aria-label={`Lançar recuperação de ${aluno.nome || aluno.alunoId}`} disabled={!aluno.completo || aluno.repetido} checked={selecionados.includes(aluno.alunoId)} onChange={() => alternarSelecionado(aluno.alunoId)} />
                        </td>
                        <td className="p-2">{aluno.nome || alunosPorId.get(aluno.alunoId)?.nome || aluno.alunoId}</td>
                        <td className="p-2 font-mono">{aluno.completo ? pontos(aluno.total) : '—'}</td>
                        <td className="p-2">{aluno.completo ? (aluno.repetido ? 'já lançado' : '—') : aluno.pendencias.map(p => p.motivo).join(', ')}</td>
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
                    ))}
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
        </section>
      )}

      {formAtividade && detalhe && (
        <AtividadeForm
          turmas={turmaDoConjunto ? [turmaDoConjunto] : turmas.filter(t => t.id === detalhe.conjunto.turmaId)}
          onCreate={salvarAtividade}
          onClose={() => setFormAtividade(null)}
          contextoInicial={contextoFormulario()}
        />
      )}
    </div>
  );
}
