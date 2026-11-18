import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractTextFromDocument: vi.fn(),
  getClientAIHeaders: vi.fn(),
  useAIConfig: vi.fn(),
}));

vi.mock('@/utils/atividades/documentExtractor', () => ({
  extractTextFromDocument: mocks.extractTextFromDocument,
}));
vi.mock('@/utils/aiHeaders', () => ({
  getClientAIHeaders: mocks.getClientAIHeaders,
}));
vi.mock('@/hooks/useAIConfig', () => ({
  useAIConfig: mocks.useAIConfig,
}));
vi.mock('@/components/ai/ModalConectarIA', () => ({
  ModalConectarIA: () => null,
}));

import { FormularioQuestao } from '@/components/aula-gamificada/FormularioQuestao';
import { GeradorIAQuestoes } from '@/components/aula-gamificada/GeradorIAQuestoes';
import { PrepararSala } from '@/components/aula-gamificada/PrepararSala';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';
import { useSalaGamificada } from '@/components/aula-gamificada/useSalaGamificada';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';

describe('Aula Gamificada — cobertura das correções da revisão independente', () => {
  beforeEach(() => {
    mocks.useAIConfig.mockReturnValue({
      config: { provider: 'gemini', model: 'gemini-2.5-flash' },
      temChave: true,
    });
    mocks.getClientAIHeaders.mockReturnValue({
      'x-user-ai-provider': 'gemini',
      'x-user-ai-key': 'chave-byok',
      'x-user-ai-model': 'gemini-2.5-flash',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('gera IDs opacos e independentes para cartas de pares manuais sem denunciar gabarito', async () => {
    const onSalvar = vi.fn();
    render(<FormularioQuestao tipoPadrao="pares" onSalvar={onSalvar} />);

    fireEvent.change(screen.getByLabelText(/Disciplina/i), { target: { value: 'Química' } });
    fireEvent.change(screen.getByLabelText(/Série \/ Ano escolar/i), { target: { value: '1º ano EM' } });
    fireEvent.change(screen.getByLabelText(/Conteúdo/i), { target: { value: 'Elementos' } });
    fireEvent.change(screen.getByLabelText(/Enunciado/i), { target: { value: 'Relacione elemento e símbolo.' } });
    fireEvent.change(screen.getByLabelText(/Par 1 — conceito/i), { target: { value: 'Sódio' } });
    fireEvent.change(screen.getByLabelText(/Par 1 — correspondência/i), { target: { value: 'Na' } });
    fireEvent.change(screen.getByLabelText(/Par 2 — conceito/i), { target: { value: 'Ferro' } });
    fireEvent.change(screen.getByLabelText(/Par 2 — correspondência/i), { target: { value: 'Fe' } });
    fireEvent.change(screen.getByLabelText(/Explicação pedagógica/i), { target: { value: 'Símbolos da tabela periódica.' } });
    fireEvent.change(screen.getByLabelText(/Justificativa da dificuldade/i), { target: { value: 'Conceito introdutório.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar questão' }));
    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1));

    const payload = onSalvar.mock.calls[0][0];
    expect(payload.pares).toHaveLength(2);
    for (const par of payload.pares) {
      expect(par.esquerda.id).not.toMatch(/^(esq|dir)_/i);
      expect(par.direita.id).not.toMatch(/^(esq|dir)_/i);
      expect(par.esquerda.id).not.toContain(par.id);
      expect(par.direita.id).not.toContain(par.id);
      expect(par.esquerda.id).not.toBe(par.direita.id);
    }
    expect(payload.respostaCorreta).toEqual(
      payload.pares.map((p) => ({ esquerdaId: p.esquerda.id, direitaId: p.direita.id }))
    );
  });

  it('rascunho IA reaproveita requestId em retry de falha e envia expectedRevision + novo requestId ao editar pós-salvamento', async () => {
    const rascunho = {
      id: 'q-ia-1',
      disciplina: 'Física',
      anoEscolar: '1º ano EM',
      conteudo: 'Cinemática',
      dificuldade: 'medio',
      tipo: 'multipla_escolha',
      enunciado: 'Enunciado original da IA',
      alternativas: [
        { id: 'A', texto: '10 m/s' },
        { id: 'B', texto: '20 m/s' },
      ],
      respostaCorreta: 'A',
      explicacao: 'v = d / t.',
      justificativaDificuldade: 'Aplicação direta.',
      status: 'rascunho',
      origem: { tipo: 'tema' },
    };

    let tentativaSalvar = 0;
    const fetcher = vi.fn(async (url, init) => {
      if (url === '/api/aula-gamificada/gerar') {
        return { ok: true, status: 200, json: async () => ({ questoes: [rascunho] }) };
      }
      if (url === '/api/aula-gamificada/questoes') {
        tentativaSalvar += 1;
        const body = JSON.parse(init.body);
        if (tentativaSalvar === 1) {
          return { ok: false, status: 503, json: async () => ({ error: 'TEMP', message: 'Falha temporária ao salvar.' }) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            questao: { ...body.questao, id: 'q-ia-1', revision: body.expectedRevision ? body.expectedRevision + 1 : 1 },
          }),
        };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    render(<GeradorIAQuestoes uid="prof-1" obterToken={async () => 'tok'} onQuestaoSalva={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Disciplina/i), { target: { value: 'Física' } });
    fireEvent.change(screen.getByLabelText(/Série \/ Ano escolar/i), { target: { value: '1º ano EM' } });
    fireEvent.change(screen.getByLabelText(/Conteúdo \/ Tema/i), { target: { value: 'Cinemática' } });
    fireEvent.click(screen.getByRole('button', { name: /Gerar rascunhos com IA/i }));

    await screen.findByDisplayValue('Enunciado original da IA');

    // 1ª tentativa falha
    fireEvent.click(screen.getByRole('button', { name: /Salvar no banco/i }));
    await screen.findByText(/Falha temporária ao salvar/i);

    // 2ª tentativa com mesmo payload reutiliza mesmo requestId (sem expectedRevision)
    fireEvent.click(screen.getByRole('button', { name: /Salvar no banco/i }));
    await screen.findByRole('button', { name: /Salvo no banco/i });

    const chamadasSalvar = fetcher.mock.calls.filter(([u]) => u === '/api/aula-gamificada/questoes');
    const body1 = JSON.parse(chamadasSalvar[0][1].body);
    const body2 = JSON.parse(chamadasSalvar[1][1].body);
    expect(body1.requestId).toBe(body2.requestId);
    expect(body1.expectedRevision).toBeUndefined();
    expect(body2.expectedRevision).toBeUndefined();

    // Edição APÓS salvamento confirmado deve enviar expectedRevision: 1 e requestId NOVO (sem rechamar /gerar)
    fireEvent.change(screen.getByDisplayValue('Enunciado original da IA'), {
      target: { value: 'Enunciado revisado pelo professor' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar alteração no banco/i }));
    await screen.findByRole('button', { name: /Salvo no banco/i });

    const chamadasSalvarFinais = fetcher.mock.calls.filter(([u]) => u === '/api/aula-gamificada/questoes');
    expect(chamadasSalvarFinais).toHaveLength(3);
    const body3 = JSON.parse(chamadasSalvarFinais[2][1].body);
    expect(body3.expectedRevision).toBe(1);
    expect(body3.requestId).not.toBe(body2.requestId);
    expect(body3.questao.enunciado).toBe('Enunciado revisado pelo professor');
    expect(fetcher.mock.calls.filter(([u]) => u === '/api/aula-gamificada/gerar')).toHaveLength(1);
  });

  it('falha ao extrair novo arquivo limpa o texto do material anterior e impede reuso indevido', async () => {
    mocks.extractTextFromDocument
      .mockResolvedValueOnce({ texto: 'Texto do arquivo A', nomeArquivo: 'a.txt', tipo: 'txt', totalCaracteres: 18 })
      .mockRejectedValueOnce(new Error('Arquivo B corrompido.'));

    render(<GeradorIAQuestoes uid="prof-1" obterToken={async () => 'tok'} onQuestaoSalva={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/A partir de material anexado/i));

    const inputArquivo = screen.getByLabelText(/Anexar PDF, imagem, DOCX ou TXT/i);
    const arqA = new File(['A'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(inputArquivo, { target: { files: [arqA] } });

    expect(await screen.findByLabelText(/Texto extraído para revisão/i)).toHaveValue('Texto do arquivo A');

    const arqB = new File(['B'], 'b.pdf', { type: 'application/pdf' });
    fireEvent.change(inputArquivo, { target: { files: [arqB] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Arquivo B corrompido/i);
    expect(screen.queryByDisplayValue('Texto do arquivo A')).not.toBeInTheDocument();
  });

  it('equipes impede menos de duas equipes, preserva homônimos de turmas distintas com participanteId do servidor e reutiliza requestId em retry', async () => {
    const turmas = [
      {
        id: 'turma-a',
        nome: '1º Ano A',
        alunos: [{ id: 'sha256-tA-a1', alunoId: 'a1', nome: 'Ana Silva' }],
      },
      {
        id: 'turma-b',
        nome: '1º Ano B',
        alunos: [{ id: 'sha256-tB-a1', alunoId: 'a1', nome: 'Ana Silva' }],
      },
    ];
    const questoes = [
      {
        id: 'q1',
        revision: 2,
        disciplina: 'Biologia',
        anoEscolar: '1º ano EM',
        conteudo: 'Célula',
        dificuldade: 'facil',
        tipo: 'multipla_escolha',
        enunciado: 'Questão revisada',
        status: 'revisada',
      },
    ];

    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: 'TEMP', message: 'Tente novamente.' }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ sala: { codigo: 'EQP99', titulo: 'Gincana', modalidade: 'equipes', fase: 'espera' } }),
      });
    vi.stubGlobal('fetch', fetcher);

    render(
      <PrepararSala
        turmas={turmas}
        questoes={questoes}
        salas={[]}
        modalidadeInicial="equipes"
        obterToken={async () => 'tok'}
        onSalaCriada={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Título da sala/i), { target: { value: 'Gincana' } });
    fireEvent.click(screen.getByLabelText(/1º Ano A/i));
    fireEvent.click(screen.getByLabelText(/1º Ano B/i));
    fireEvent.click(screen.getByLabelText(/Questão revisada/i));

    // Apenas 1 equipe deve ser bloqueada antes de chamar a API
    fireEvent.change(screen.getByLabelText(/Nome da nova equipe/i), { target: { value: 'Alfa' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar equipe/i }));
    fireEvent.click(screen.getByRole('button', { name: /Criar sala ao vivo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Cadastre pelo menos duas equipes/i);
    expect(fetcher).not.toHaveBeenCalled();

    // Adiciona 2ª equipe e aloca as duas Anas de turmas diferentes usando participanteId distinto
    fireEvent.change(screen.getByLabelText(/Nome da nova equipe/i), { target: { value: 'Beta' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar equipe/i }));

    const checkboxesAnaA = screen.getAllByLabelText(/Ana Silva \(1º Ano A\)/i);
    const checkboxesAnaB = screen.getAllByLabelText(/Ana Silva \(1º Ano B\)/i);
    expect(checkboxesAnaA).toHaveLength(2);
    expect(checkboxesAnaB).toHaveLength(2);
    fireEvent.click(checkboxesAnaA[0]);
    fireEvent.click(checkboxesAnaB[1]);

    // 1ª tentativa falha -> 2ª reutiliza o mesmo requestId
    fireEvent.click(screen.getByRole('button', { name: /Criar sala ao vivo/i }));
    await screen.findByText(/Tente novamente/i);

    fireEvent.click(screen.getByRole('button', { name: /Criar sala ao vivo/i }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    const b1 = JSON.parse(fetcher.mock.calls[0][1].body);
    const b2 = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(b1.requestId).toBe(b2.requestId);
    expect(b1.equipes[0].participanteIds).toEqual(['sha256-tA-a1']);
    expect(b1.equipes[1].participanteIds).toEqual(['sha256-tB-a1']);
  });

  it('memória consome apenas IDs públicos + faces autorizadas, fecha par errado ao virar nova carta e reutiliza requestId em retry', async () => {
    // 1. Contrato real do servidor: rodada.questao.cartas tem APENAS IDs opacos; faces vêm em rodada.faces/recibo
    const estadoInicial = {
      sala: { codigo: 'MEM9', titulo: 'Memória Real', modalidade: 'memoria', fase: 'pergunta', revision: 2, rodada: 1, totalRodadas: 1 },
      servidorAgora: Date.now(),
      prazo: Date.now() + 90000,
      rodada: {
        numero: 1,
        total: 1,
        revelado: false,
        questao: { id: 'qm', tipo: 'pares', enunciado: 'Encontre os pares.', cartas: ['k1', 'k2', 'k3', 'k4'] },
        faces: [
          { id: 'k1', texto: 'Cubismo' },
          { id: 'k2', texto: 'Surrealismo' },
        ],
      },
      eu: {
        id: 'p1',
        nomeExibicao: 'Ana',
        recibo: {
          status: 'confirmado',
          virarId: 'k2',
          cartasVisiveis: ['k1', 'k2'],
          cartasEncontradas: [],
          facesVisiveis: [
            { id: 'k1', texto: 'Cubismo' },
            { id: 'k2', texto: 'Surrealismo' },
          ],
          facesEncontradas: [],
          completo: false,
        },
      },
    };

    const fetcher = vi.fn(async (url) => {
      if (url.endsWith('/entrar')) return { ok: true, status: 200, json: async () => ({ estado: estadoInicial }) };
      if (url.endsWith('/estado')) return { ok: true, status: 200, json: async () => ({ estado: estadoInicial }) };
      if (url.endsWith('/respostas')) {
        // 1ª chamada falha para validar retry idempotente; 2ª fecha k1/k2 (par errado) e abre só k3
        if (fetcher.mock.calls.filter(([u]) => u.endsWith('/respostas')).length === 1) {
          return { ok: false, status: 503, json: async () => ({ error: 'TEMP', message: 'Erro transitório.' }) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            recibo: {
              status: 'confirmado',
              virarId: 'k3',
              cartasVisiveis: ['k3'],
              cartasEncontradas: [],
              facesVisiveis: [{ id: 'k3', texto: 'Guernica' }],
              facesEncontradas: [],
              completo: false,
            },
          }),
        };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    function HarnessMemoria() {
      const sala = useSalaGamificada({ codigo: 'MEM9', papel: 'aluno', contextoUid: 'ana1', intervaloMs: 60000 });
      if (!sala.estado) return <p>carregando</p>;
      return <SalaAlunoView estado={sala.estado} conexao={sala.conexao} ocupado={sala.ocupado} onResponder={sala.enviarResposta} />;
    }

    render(<HarnessMemoria />);

    // Inicialmente k1 e k2 estão visíveis; k3 e k4 estão fechadas (verso)
    expect(await screen.findByText('Cubismo')).toBeInTheDocument();
    expect(screen.getByText('Surrealismo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Carta 3: virada para baixo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Carta 4: virada para baixo/i })).toBeInTheDocument();

    // Tenta virar carta 3 -> falha transitória
    fireEvent.click(screen.getByRole('button', { name: /Carta 3: virada para baixo/i }));
    await screen.findByText(/Erro transitório/i);

    // Repete clique na carta 3 -> reutiliza mesmo requestId e fecha par errado (k1/k2 desaparecem!)
    fireEvent.click(screen.getByRole('button', { name: /Carta 3: virada para baixo/i }));
    expect(await screen.findByText('Guernica')).toBeInTheDocument();
    expect(screen.queryByText('Cubismo')).not.toBeInTheDocument();
    expect(screen.queryByText('Surrealismo')).not.toBeInTheDocument();

    const chamadasResp = fetcher.mock.calls.filter(([u]) => u.endsWith('/respostas'));
    expect(chamadasResp).toHaveLength(2);
    expect(JSON.parse(chamadasResp[0][1].body).requestId).toBe(JSON.parse(chamadasResp[1][1].body).requestId);
  });

  it('normalizarEstadoSala separa presentes de respondentes explícitos e não infere resposta por pontos', () => {
    const estado = normalizarEstadoSala({
      sala: { codigo: 'S1', modalidade: 'quiz', fase: 'pergunta', rodada: 2, revision: 3 },
      rodada: { numero: 2, questao: { tipo: 'multipla_escolha', alternativas: [{ id: 'A', texto: 'Sim' }] } },
      participantes: [
        { id: 'p1', nomeExibicao: 'Ana', pontos: 1000, entrouEmMs: 123456 },
        { id: 'p2', nomeExibicao: 'Bruno', pontos: 0, entrouEmMs: 123457, respondeu: true },
        { id: 'p3', nomeExibicao: 'Carla', pontos: 1000, entrouEmMs: null },
      ],
      distribuicao: [{ alternativaId: 'A', total: 1 }],
    });

    expect(estado.participacao.totalParticipantes).toBe(3);
    expect(estado.participacao.totalPresentes).toBe(2);
    expect(estado.participacao.presentes).toEqual(['Ana', 'Bruno']);
    expect(estado.participacao.totalRespondentes).toBe(1);
    expect(estado.participacao.respondentes).toEqual(['Bruno']);
  });
});
