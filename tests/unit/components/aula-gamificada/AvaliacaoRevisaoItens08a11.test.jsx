// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { PrepararSala } from '@/components/aula-gamificada/PrepararSala';
import { GeradorIAQuestoes } from '@/components/aula-gamificada/GeradorIAQuestoes';
import RelatorioAvaliacao from '@/components/aula-gamificada/RelatorioAvaliacao';
import { AcessoAlunoView } from '@/components/aula-gamificada/AcessoAlunoView';

vi.mock('@/hooks/useAIConfig', () => ({
  useAIConfig: () => ({ temChave: true, config: { provider: 'openai', apiKey: 'sk-test' } }),
}));

vi.mock('@/components/ai/ModalConectarIA', () => ({
  ModalConectarIA: () => null,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Cobertura REV-AV-08 a REV-AV-11', () => {
  it('REV-AV-08: PrepararSala usa contextoAvaliacao real (ano 2026 e colunas) mesmo quando turmas do catalogo omitem ano', () => {
    const contextoAvaliacao = {
      anos: [{ id: '2026', rotulo: '2026' }],
      bimestres: ['1', '2', '3', '4'],
      turmas: [
        {
          id: 't1',
          nome: '9º A',
          anoLetivo: '2026',
          bimestres: {
            '1': { atividades: [{ id: 'col_real', nome: 'Prova Bimestral', max: 10 }] },
          },
        },
      ],
    };

    render(
      <PrepararSala
        turmas={[{ id: 't1', nome: '9º A', alunos: [{ id: 'a1', nome: 'Ana' }] }]}
        contextoAvaliacao={contextoAvaliacao}
        questoes={[]}
        salas={[]}
        onCriarSala={async () => {}}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Avaliativa/i));
    const selectAno = screen.getByLabelText(/Ano letivo \(Diário\)/i);
    expect(selectAno.value).toBe('2026');
    fireEvent.click(screen.getByLabelText(/9º A/i));
    expect(screen.getByText(/Prova Bimestral \(máx: 10\)/i)).toBeTruthy();
  });

  it('REV-AV-09: listarAvaliacoes inclui salas legadas sem índice, filtra por aluno/data e usa cursor estável', async () => {
    const docs = new Map([
      [
        'aulaGamificadaSalas/LEG001',
        {
          codigo: 'LEG001',
          professorId: 'prof-1',
          titulo: 'Sala Legada Sem Índice',
          modalidade: 'quiz',
          turmaIds: ['t1'],
          roster: ['t1:a1'],
          fase: 'encerrada',
          criadoEmMs: 1000,
        },
      ],
      [
        'aulaGamificadaDocentes/prof-1/salas/IDX002',
        {
          codigo: 'IDX002',
          professorId: 'prof-1',
          titulo: 'Sala Nova 2',
          modalidade: 'herois',
          finalidade: 'avaliativa',
          turmaIds: ['t1'],
          roster: ['t1:a2'],
          fase: 'encerrada',
          criadoEmMs: 2000,
        },
      ],
    ]);
    const store = {
      async get(p) {
        return docs.has(p) ? structuredClone(docs.get(p)) : null;
      },
      async set(p, v) {
        docs.set(p, structuredClone(v));
      },
      async list(prefix, filtros = []) {
        const base = `${prefix}/`;
        const out = [];
        for (const [k, v] of docs.entries()) {
          if (!k.startsWith(base) || k.slice(base.length).includes('/')) continue;
          if (filtros.every(([c, op, val]) => op === '==' && v?.[c] === val)) {
            out.push(structuredClone(v));
          }
        }
        return out;
      },
      async transaction(fn) {
        return fn({ get: (p) => this.get(p), set: (p, v) => this.set(p, v), list: (p, f) => this.list(p, f) });
      },
    };
    const servico = new AulaGamificadaService({ store });
    const prof = { tipo: 'professor', uid: 'prof-1' };

    const p1 = await servico.listarAvaliacoes(prof, { limite: 1 });
    expect(p1.itens.map((i) => i.codigo)).toEqual(['IDX002']);
    expect(p1.proximoCursor).toBe('2000_IDX002');

    // Insere sala mais recente entre página 1 e página 2: cursor estável não repete IDX002!
    docs.set('aulaGamificadaDocentes/prof-1/salas/IDX003', {
      codigo: 'IDX003',
      professorId: 'prof-1',
      titulo: 'Sala Mais Nova',
      modalidade: 'quiz',
      criadoEmMs: 3000,
    });
    const p2 = await servico.listarAvaliacoes(prof, { limite: 1, cursor: p1.proximoCursor });
    expect(p2.itens.map((i) => i.codigo)).toEqual(['LEG001']);

    const porAluno = await servico.listarAvaliacoes(prof, { alunoId: 'a1' });
    expect(porAluno.itens.map((i) => i.codigo)).toEqual(['LEG001']);
  });

  it('REV-AV-10: RelatorioAvaliacao mostra detalhes congelados e AcessoAlunoView abre devolutiva no Portal', async () => {
    const rel = {
      sala: { codigo: 'AV0001', titulo: 'Prova', modalidade: 'quiz', finalidade: 'avaliativa', fase: 'encerrada' },
      revision: 2,
      configuracaoCongelada: { tituloAtividade: 'Prova 1', disciplina: 'Arte', bimestre: '1', anoLetivo: '2026', valorMaximo: 10 },
      resumoTurma: { totalElegiveis: 1, presentes: 1, ausentes: 0, semOportunidade: 0, mediaNota: 10 },
      alunos: [
        {
          participanteId: 'p1',
          alunoId: 'a1',
          turmaId: 't1',
          nome: 'Ana Clara',
          situacao: 'avaliado',
          elegiveis: 1,
          respondidas: 1,
          acertos: 1,
          parciais: 0,
          erros: 0,
          aproveitamento: 1,
          notaCalculada: 10,
          notaRevisada: null,
          notaFinal: 10,
          detalhesQuestoes: [
            {
              rodada: 1,
              enunciado: 'Qual o conceito central?',
              respostaCorreta: 'A',
              explicacao: 'Ideia acima da técnica.',
              status: 'acerto',
              tentativas: 1,
            },
          ],
        },
      ],
      auditoria: [],
      sincronizacao: { status: 'pendente', pendencias: [] },
      limitacoes: [],
    };

    render(<RelatorioAvaliacao codigo="AV0001" relatorioInicial={rel} />);
    fireEvent.click(screen.getByRole('button', { name: /Detalhes/i }));
    expect(screen.getByText(/Qual o conceito central\?/i)).toBeTruthy();
    expect(screen.getByText(/Ideia acima da técnica\./i)).toBeTruthy();

    // Portal do Aluno abre devolutiva
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/aluno/sessao')) {
        return new Response(JSON.stringify({ authenticated: true, aluno: { nome: 'Ana', loginKey: 'ana' } }), { status: 200 });
      }
      if (String(url).includes('/avaliacoes/minhas')) {
        return new Response(
          JSON.stringify({
            avaliacoes: [{ codigo: 'AV0001', titulo: 'Prova 1', disciplina: 'Arte', bimestre: '1', modalidade: 'quiz', valorMaximo: 10, notaFinal: 10 }],
          }),
          { status: 200 },
        );
      }
      if (String(url).includes('/relatorio')) {
        return new Response(
          JSON.stringify({
            sala: rel.sala,
            configuracaoCongelada: rel.configuracaoCongelada,
            meuResultado: rel.alunos[0],
          }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });

    render(<AcessoAlunoView />);
    const btnDev = await screen.findByRole('button', { name: /Ver devolutiva/i });
    fireEvent.click(btnDev);
    expect(await screen.findByText(/Devolutiva — Prova 1/i)).toBeTruthy();
  });

  it('REV-AV-11: GeradorIAQuestoes preserva ID/revision salvos se aprovação falhar e reutiliza requestId na repetição', async () => {
    const rascunho = {
      chaveLocal: 'r1',
      revisionSalva: null,
      assinaturaPendente: null,
      requestIdPendente: null,
      salvo: false,
      salvando: false,
      erroSalvar: null,
      dados: {
        disciplina: 'Arte',
        anoEscolar: '9º ano',
        conteudo: 'Arte Conceitual',
        dificuldade: 'medio',
        tipo: 'multipla_escolha',
        status: 'rascunho',
        enunciado: 'Pergunta teste?',
        alternativas: [
          { id: 'A', texto: 'Ideia' },
          { id: 'B', texto: 'Forma' },
        ],
        respostaCorreta: 'A',
        explicacao: 'Exp.',
        justificativaDificuldade: 'Ok.',
      },
    };

    let chamadasSalvar = 0;
    const reqsRevisar = [];
    global.fetch = vi.fn(async (url, init) => {
      const u = String(url);
      if (u.endsWith('/questoes')) {
        chamadasSalvar++;
        return new Response(
          JSON.stringify({ questao: { ...rascunho.dados, id: 'q_salva_1', revision: 1, status: 'rascunho' } }),
          { status: 200 },
        );
      }
      if (u.includes('/revisar')) {
        const body = JSON.parse(init.body);
        reqsRevisar.push(body.requestId);
        if (reqsRevisar.length === 1) {
          return new Response(JSON.stringify({ error: 'Falha de rede na aprovação' }), { status: 500 });
        }
        return new Response(
          JSON.stringify({ questao: { ...rascunho.dados, id: 'q_salva_1', revision: 2, status: 'revisada' } }),
          { status: 200 },
        );
      }
      return new Response('{}', { status: 404 });
    });

    const Wrapper = () => {
      const [lista, setLista] = React.useState([rascunho]);
      return (
        <GeradorIAQuestoes
          uid="prof-1"
          obterToken={async () => 'tok'}
          rascunhosExternos={lista}
          onRascunhosChange={setLista}
          onContinuarParaSala={() => {}}
        />
      );
    };

    render(<Wrapper />);
    fireEvent.click(screen.getByRole('button', { name: /Salvar e aprovar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Falha de rede na aprovação/i);
    expect(chamadasSalvar).toBe(1);

    // Repete apenas a aprovação: NÃO chama salvarQuestao de novo e usa o MESMO requestId!
    fireEvent.click(screen.getByRole('button', { name: /Salvar e aprovar/i }));
    expect(await screen.findByText(/Aprovada ✓/i)).toBeTruthy();
    expect(chamadasSalvar).toBe(1);
    expect(reqsRevisar).toHaveLength(2);
    expect(reqsRevisar[1]).toBe(reqsRevisar[0]);
  });
});
