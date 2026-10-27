'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useDadosAnalytics } from '@/hooks/analytics/useDadosAnalytics';
import { faixaNotaBimestral } from '@/utils/diario/coresNota';
import { montarAnalise, corFaixa } from '@/dominio/analytics/analise';
import { anoLetivoTurma, filtrarTurmasAno } from '@/dominio/diario/evolucao';
import { fmt } from '@/utils/diario/calculos';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { AlunosRiscoTable } from '@/components/analytics/AlunosRiscoTable';
import { ComparativoTurmasChart } from '@/components/analytics/ComparativoTurmasChart';
import { EvolucaoChart } from '@/components/analytics/EvolucaoChart';
import { DistribuicaoChart } from '@/components/analytics/DistribuicaoChart';
import { generateAnalyticsPDF } from '@/lib/analytics/pdf-generator';
import { DialogoAnalytics } from '@/components/analytics/DialogoAnalytics';
import { PerfilAlunoDiario } from '@/components/diario/PerfilAlunoDiario';

export default function AnalyticsPage() {
  const { user, perfil, loading } = useAuth();
  if (loading)
    return (
      <p role="status" className="p-6">
        Carregando sua conta…
      </p>
    );
  if (!user)
    return (
      <main className="p-6">
        <p>Entre na sua conta para consultar os indicadores.</p>
        <Link href="/">Voltar ao Hub</Link>
      </main>
    );
  if (!perfil || (!perfil.isAdmin && !perfil.modulos_permitidos?.includes('analytics-pedagogico')))
    return (
      <main className="p-6">
        <p>Acesso ao Analytics indisponível para esta conta.</p>
        <Link href="/">Voltar ao Hub</Link>
      </main>
    );
  return (
    <AnalyticsConta
      key={user.uid}
      uid={user.uid}
      professorNome={perfil.nome || user.displayName || 'Professor(a)'}
    />
  );
}

function AnalyticsConta({ uid, professorNome }) {
  const dados = useDadosAnalytics(uid);
  const [anoEscolhido, setAno] = useState(null);
  const [arquivadas, setArquivadas] = useState(false);
  const [turmaId, setTurmaId] = useState(null);
  const [periodo, setPeriodo] = useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem(`diario_contexto_${uid}`) || '{}');
      return [1, 2, 3, 4].includes(Number(c.bimestre))
        ? String(c.bimestre)
        : String(Math.min(4, Math.floor(new Date().getMonth() / 3) + 1));
    } catch {
      return '1';
    }
  });
  const [aba, setAba] = useState('geral');
  const [exportando, setExportando] = useState(false);
  const [erroPDF, setErroPDF] = useState('');
  const [alunoAberto, setAlunoAberto] = useState(null);
  const anos = useMemo(
    () =>
      [...new Set([new Date().getFullYear(), ...dados.turmas.map(anoLetivoTurma).filter(Boolean)])].sort(),
    [dados.turmas],
  );
  const ano = anoEscolhido || (dados.turmas.some((t) => !anoLetivoTurma(t)) ? 'legado' : String(anos.at(-1)));
  const contexto = filtrarTurmasAno(dados.turmas, ano, arquivadas);
  const selecaoInvalida = Boolean(turmaId && !contexto.some((t) => t.id === turmaId));
  const turmas = turmaId ? contexto.filter((t) => t.id === turmaId) : contexto;
  const analise = montarAnalise(turmas, periodo);
  const corMedia =
    analise.criteriosDiferentes || analise.escalasDiferentes
      ? undefined
      : analise.bimestral
        ? corFaixa(faixaNotaBimestral(analise.mediaGeral, { mediaAprovacao: analise.linhas[0]?.minimo }))
        : analise.totalParciais
          ? '#94a3b8'
          : corFaixa(
              analise.mediaGeral === null
                ? 'sem_nota'
                : analise.mediaGeral >= analise.linhas[0]?.minimo
                  ? 'aprovado'
                  : 'abaixo',
            );
  const evolucao = ['1', '2', '3', '4'].map((b) => {
    const a = montarAnalise(turmas, b);
    const ls = a.linhas.filter((l) => l.nota !== null && l.escala > 0);
    return {
      bimestre: `${b}º Bim`,
      media: ls.length
        ? Math.round((ls.reduce((s, l) => s + (l.nota / l.escala) * 100, 0) / ls.length) * 100) / 100
        : null,
      avaliados: ls.length,
      unidade: '%',
    };
  });
  const alunoTurma = alunoAberto && turmas.find((t) => t.id === alunoAberto.turmaId);
  const aluno = alunoTurma?.alunos.find((a) => a.id === alunoAberto.alunoId);
  const exportar = async () => {
    setExportando(true);
    setErroPDF('');
    try {
      await generateAnalyticsPDF({
        analise,
        ano,
        professorNome,
        turmaSelecionadaNome: turmaId ? turmas[0]?.nome : 'Todas as turmas do filtro',
        origem: dados.origem,
        atualizadoEm: dados.atualizadoEm,
      });
    } catch (e) {
      setErroPDF(`Não foi possível exportar: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };
  const abrirAluno = (l) => {
    setAlunoAberto(l);
  };
  const trocarContexto = (acao) => {
    acao();
    setTurmaId(null);
    setAlunoAberto(null);
    setErroPDF('');
  };
  return (
    <main className="min-h-screen bg-slate-50 text-[#101942] p-3 md:p-6 space-y-4 max-w-7xl mx-auto">
      <AnalyticsHeader
        turmas={contexto}
        turmaSelecionadaId={turmaId}
        onSelectTurma={(id) => {
          setTurmaId(id);
          setAlunoAberto(null);
        }}
        bimestreSelecionado={periodo}
        onSelectBimestre={(p) => {
          setPeriodo(p);
          setAlunoAberto(null);
        }}
        anos={anos}
        ano={ano}
        onSelectAno={(a) => trocarContexto(() => setAno(a))}
        arquivadas={arquivadas}
        onArquivadas={(a) => trocarContexto(() => setArquivadas(a))}
        onExportPDF={() => setAba('relatorios')}
        exportingPDF={exportando}
        exportDisabled={dados.carregando || selecaoInvalida}
      />
      <div className="text-sm flex gap-3 flex-wrap items-center">
        <span>
          Origem: {dados.origem || 'carregando'} ·{' '}
          {dados.atualizadoEm
            ? `Consultado em ${new Date(dados.atualizadoEm).toLocaleString('pt-BR')}`
            : 'Atualização não confirmada'}
        </span>
        <button type="button" className="underline" disabled={dados.carregando} onClick={dados.recarregar}>
          Atualizar dados
        </button>
        <Link href="/diario" className="underline">
          Abrir Diário
        </Link>
      </div>
      {dados.erro && (
        <p role="alert" className="p-3 rounded-lg bg-amber-50 text-amber-900">
          {dados.erro}{' '}
          {dados.origem === 'cache local'
            ? 'Exibindo cópia deste dispositivo; dados podem estar desatualizados.'
            : ''}
        </p>
      )}
      {dados.carregando ? (
        <p role="status">Carregando notas do Diário…</p>
      ) : selecaoInvalida ? (
        <p role="alert">
          A turma selecionada não está disponível neste filtro. Selecione novamente; o escopo não foi
          ampliado.
        </p>
      ) : !contexto.length ? (
        <section className="bg-white p-6 rounded-xl">
          <h2 className="font-bold">
            {dados.erro ? 'Consulta indisponível neste filtro' : 'Nenhuma turma neste filtro'}
          </h2>
          <p>Confira ano letivo e turmas arquivadas. Notas e cadastros são feitos no Diário.</p>
        </section>
      ) : (
        <>
          <nav aria-label="Áreas do Analytics" className="flex flex-wrap gap-2">
            {[
              ['geral', 'Visão geral'],
              ['atencao', 'Atenção e pendências'],
              ['evolucao', 'Evolução'],
              ['relatorios', 'Relatórios'],
            ].map(([id, nome]) => (
              <button
                type="button"
                key={id}
                aria-pressed={aba === id}
                onClick={() => setAba(id)}
                className={`px-4 py-2 rounded-lg border ${aba === id ? 'bg-[#101942] text-white' : 'bg-white'}`}
              >
                {nome}
              </button>
            ))}
          </nav>
          <p className="text-sm">
            {analise.rotulo} · {analise.totalTurmas} turma(s) · {analise.totalAlunos} matrículas. Uma pessoa
            pode ter vínculos em mais de uma turma/disciplina.
          </p>
          {analise.criteriosDiferentes && (
            <p className="text-sm bg-amber-50 p-3">
              Há critérios diferentes entre as turmas. Confira os mínimos abaixo; comparações gráficas usam
              percentual da escala.
            </p>
          )}
          {aba === 'geral' && (
            <>
              <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Média', analise.escalasDiferentes ? 'Escalas diferentes' : fmt(analise.mediaGeral)],
                  ['Cobertura', `${analise.totalAvaliados}/${analise.totalAlunos} avaliados`],
                  [
                    analise.bimestral ? 'No mínimo bimestral' : 'Aprovados nas etapas concluídas',
                    analise.taxaAprovacao === null ? 'Indisponível' : `${analise.taxaAprovacao}%`,
                  ],
                  [
                    'Atenção',
                    analise.taxaAtencao === null
                      ? 'Indisponível'
                      : `${analise.emAtencao.length} (${analise.taxaAtencao}%)`,
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="p-4 bg-white border rounded-xl">
                    <dt className="text-sm">{k}</dt>
                    <dd className="font-bold text-xl" style={k === 'Média' ? { color: corMedia } : undefined}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm">
                {analise.totalSemNota} sem nota · {analise.totalParciais} resultados parciais.{' '}
                {analise.bimestral
                  ? 'Indicadores bimestrais são provisórios; não definem aprovação semestral.'
                  : 'Percentuais usam somente etapas concluídas; em andamento não equivale a reprovação.'}
              </p>
              <DistribuicaoChart distribuicao={analise.distribuicao} />
              <ComparativoTurmasChart turmasMetricas={analise.turmasMetricas} bimestral={analise.bimestral} />
            </>
          )}
          {aba === 'atencao' && (
            <>
              <AlunosRiscoTable
                alunos={analise.emAtencao}
                totalAvaliados={analise.totalAvaliados}
                totalParciais={analise.totalParciais}
                onSelectAluno={abrirAluno}
              />
              <AlunosRiscoTable
                titulo="Lançamentos pendentes ou parciais"
                alunos={analise.linhas.filter((l) => l.nota === null || l.parcial)}
                totalAvaliados={analise.totalAlunos}
                onSelectAluno={abrirAluno}
              />
            </>
          )}
          {aba === 'evolucao' && <EvolucaoChart data={evolucao} percentual escalaMax={100} />}
          {aba === 'relatorios' && (
            <section className="bg-white border rounded-xl p-4 space-y-3">
              <h2 className="font-bold">
                Conferir relatório · {analise.rotulo} · {ano}
              </h2>
              <p className="text-sm">
                Inclui todas as {analise.totalAlunos} matrículas deste filtro, notas ausentes/parciais e
                critérios. Origem: {dados.origem}. Exportar não publica nem homologa notas.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr>
                      {['Estudante', 'Turma', 'Nota', 'Situação', 'Critério'].map((x) => (
                        <th className="p-2" key={x}>
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analise.linhas.map((l) => (
                      <tr className="border-t" key={`${l.turmaId}:${l.alunoId}`}>
                        <td className="p-2">{l.nome}</td>
                        <td className="p-2">{l.turmaNome}</td>
                        <td className="p-2 font-bold" style={{ color: l.cor }}>
                          {fmt(l.nota)}
                        </td>
                        <td className="p-2">
                          {l.situacao}
                          {l.parcial ? ' · parcial' : ''}
                        </td>
                        <td className="p-2">{l.criterio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="btn-brand-navy rounded-lg p-3 disabled:opacity-50"
                onClick={exportar}
                disabled={exportando}
              >
                {exportando ? 'Gerando…' : 'Baixar PDF deste filtro'}
              </button>
              {erroPDF && <p role="alert">{erroPDF}</p>}
            </section>
          )}
          <details className="bg-white border rounded-lg p-3">
            <summary className="cursor-pointer">Critérios e interpretação</summary>
            <p className="text-sm my-2">
              Vermelho: abaixo do mínimo; azul: no mínimo, abaixo de 8; verde: excelente a partir de 8.
              Semestre exige 25 pontos, ano 50, com pesos e recuperação do Diário. Atenção é orientação para
              revisão docente.
            </p>
            <ul className="text-sm">
              {[...new Set(analise.linhas.map((l) => `${l.turmaNome}: ${l.criterio}`))].map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </details>
        </>
      )}
      {aluno && (
        <DialogoAnalytics rotulo={`Acompanhamento de ${aluno.nome}`} onFechar={() => setAlunoAberto(null)}>
          <PerfilAlunoDiario aluno={aluno} turma={alunoTurma} onFechar={() => setAlunoAberto(null)} />
          <Link
            className="underline text-sm"
            href={`/diario?turmaId=${encodeURIComponent(alunoTurma.id)}&bimestre=${alunoAberto.bimestre || 1}&alunoId=${encodeURIComponent(aluno.id)}`}
          >
            Abrir turma e período no Diário
          </Link>
        </DialogoAnalytics>
      )}
    </main>
  );
}
