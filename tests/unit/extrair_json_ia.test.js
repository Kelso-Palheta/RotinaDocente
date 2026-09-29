import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/utils/aiHeaders', () => ({
  getClientAIHeaders: () => ({}),
}));

import { extrairJsonIA } from '../../frontend/src/utils/extrairJsonIA';
import { gerarQuestoesComIA } from '../../frontend/src/utils/atividades/correcaoIA';
import { importarViaIA } from '../../frontend/src/utils/diario/importIA';

const QUESTAO_LIMPA = {
  questoes: [
    {
      tipo: 'objetiva',
      enunciado: 'Quanto é 3+4?',
      alternativas: [
        { id: 'A', texto: '6' },
        { id: 'B', texto: '7' },
        { id: 'C', texto: '8' },
        { id: 'D', texto: '9' },
        { id: 'E', texto: '10' },
      ],
      gabarito: 'B',
    },
  ],
};

const JSON_LIMPO = JSON.stringify(QUESTAO_LIMPA);

// Chaves com aspas cruas e valores com aspas escapadas — reproduz o bug reportado:
// JSON.parse lança "Unexpected token '\', "{...\"id\": \"A\"...}" is not valid JSON"
const JSON_VALORES_ESCAPADOS = String.raw`{"questoes": [{"tipo\": \"objetiva\", "enunciado\": \"Quanto é 2+2?\", "alternativas\": [{\"id\": \"A\", \"texto\": \"3\"}, {\"id\": \"B\", \"texto\": \"4\"}], "gabarito\": \"B\"}]}`;

const JSON_TOTALMENTE_ESCAPADO = JSON_LIMPO.replace(/"/g, '\\"');

const JSON_DOUBLE_STRINGIFIED = JSON.stringify(JSON_LIMPO);

const respostaComFetch = (conteudo) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content: conteudo } }] }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UT-33 (RN-44): Extração robusta de JSON nas respostas de IA', () => {
  it('faz parse de JSON limpo', () => {
    expect(extrairJsonIA(JSON_LIMPO)).toEqual(QUESTAO_LIMPA);
  });

  it('remove bloco markdown ```json ... ```', () => {
    const texto = '```json\n' + JSON_LIMPO + '\n```';
    expect(extrairJsonIA(texto)).toEqual(QUESTAO_LIMPA);
  });

  it('ignora prosa antes e depois do JSON', () => {
    const texto = 'Claro! Aqui está o JSON:\n' + JSON_LIMPO + '\nEspero que ajude!';
    expect(extrairJsonIA(texto)).toEqual(QUESTAO_LIMPA);
  });

  it('repara JSON com aspas escapadas nos valores (bug: Unexpected token)', () => {
    const parsed = extrairJsonIA(JSON_VALORES_ESCAPADOS);
    expect(parsed.questoes[0].alternativas[0]).toEqual({ id: 'A', texto: '3' });
    expect(parsed.questoes[0].gabarito).toBe('B');
  });

  it('repara JSON com todas as aspas escapadas', () => {
    expect(extrairJsonIA(JSON_TOTALMENTE_ESCAPADO)).toEqual(QUESTAO_LIMPA);
  });

  it('decodifica JSON double-stringified (string contendo JSON)', () => {
    expect(extrairJsonIA(JSON_DOUBLE_STRINGIFIED)).toEqual(QUESTAO_LIMPA);
  });

  it('preserva \\\" legítimo dentro de valores de um JSON válido (parse direto primeiro)', () => {
    const texto = '{"texto": "ele disse \\"oi\\" agora"}';
    const parsed = extrairJsonIA(texto);
    expect(parsed.texto).toBe('ele disse "oi" agora');
  });

  it('lança erro claro quando não há JSON na resposta', () => {
    expect(() => extrairJsonIA('Aqui não tem JSON, só texto corrido.'))
      .toThrow(/IA não retornou JSON válido/);
  });

  it('lança erro claro em resposta vazia', () => {
    expect(() => extrairJsonIA('   '))
      .toThrow(/IA não retornou JSON válido/);
  });

  it('gerarQuestoesComIA processa resposta da IA com JSON escapado (reprodução do fluxo)', async () => {
    const conteudo = 'Seguem as questões geradas:\n' + JSON_TOTALMENTE_ESCAPADO;
    vi.stubGlobal('fetch', respostaComFetch(conteudo));

    const resultado = await gerarQuestoesComIA({
      materialTexto: 'Matemática: operações básicas com números naturais.',
      qtdQuestoes: 1,
    });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe('objetiva');
    expect(resultado[0].enunciado).toBe('Quanto é 3+4?');
    expect(resultado[0].alternativas.map((a) => a.id)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(resultado[0].gabarito).toBe('B');
  });

  it('importarViaIA processa resposta da IA com JSON escapado (reprodução do fluxo)', async () => {
    const conteudo = JSON.stringify({ alunos: ['MARIA SILVA', 'JOAO SOUZA'] }).replace(/"/g, '\\"');
    vi.stubGlobal('fetch', respostaComFetch(conteudo));

    const arquivo = {
      name: 'lista.txt',
      arrayBuffer: async () => new TextEncoder().encode('MARIA SILVA\nJOAO SOUZA').buffer,
    };

    const alunos = await importarViaIA(arquivo);
    expect(alunos).toEqual(['MARIA SILVA', 'JOAO SOUZA']);
  });
});
