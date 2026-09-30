import { describe, it, expect } from 'vitest';
import { montarListaBancoAlunos } from '@/dominio/adaptacoes/ListaBancoComDiario';

const bancoBase = [
  {
    id: 'pei-1',
    nome: 'Maria Silva',
    turmaNome: '7A',
    necessidades: ['tea'],
    nivelSuporte: 2,
  },
];

const diarioBase = [
  {
    turmaId: 't1',
    turmaNome: '8B',
    aluno: {
      id: 'al-9',
      nome: 'João Souza',
      necessidades: ['tea', 'invalida'],
      nivelSuporte: 5,
      hiperfoco: '  planetas  ',
      observacoes: '',
    },
  },
];

describe('UT-41 (RN-46): Lista unificada Banco PEI + Diário (montarListaBancoAlunos)', () => {
  it('merge preserva a ordem: banco primeiro, depois o Diário', () => {
    const lista = montarListaBancoAlunos(bancoBase, diarioBase);
    expect(lista).toHaveLength(2);
    expect(lista[0].nome).toBe('Maria Silva');
    expect(lista[1].nome).toBe('João Souza');
  });

  it('entrada do Diário ganha origem, chave estável e perfil inclusivo normalizado', () => {
    const lista = montarListaBancoAlunos(bancoBase, diarioBase);
    const entrada = lista[1];
    expect(entrada.origem).toBe('diario');
    expect(typeof entrada.chave).toBe('string');
    expect(entrada.chave.length).toBeGreaterThan(0);
    expect(entrada.necessidades).toEqual(['tea']);
    expect(entrada.nivelSuporte).toBe(1);
    expect(entrada.hiperfoco).toBe('planetas');
    expect(entrada.observacoes).toBe('');
    expect(entrada.id).toBe('al-9');
    expect(entrada.turmaNome).toBe('8B');
    expect(entrada.turmaId).toBe('t1');
  });

  it('deduplica por nome|turma normalizados com o Banco PEI vencendo', () => {
    const diarioRepetido = [
      { turmaId: 't1', turmaNome: '7A', aluno: { nome: '  MARIA silva ', necessidades: ['di'] } },
    ];
    const lista = montarListaBancoAlunos(bancoBase, diarioRepetido);
    expect(lista).toHaveLength(1);
    expect(lista[0].origem).toBe('banco');
    expect(lista[0].id).toBe('pei-1');
    expect(lista[0].necessidades).toEqual(['tea']);
  });

  it('homônimos em turmas diferentes permanecem como entradas distintas', () => {
    const diarioHom = [{ turmaId: 't2', turmaNome: '9C', aluno: { nome: 'Maria Silva' } }];
    const lista = montarListaBancoAlunos(bancoBase, diarioHom);
    expect(lista).toHaveLength(2);
    expect(lista.filter((a) => a.nome === 'Maria Silva')).toHaveLength(2);
  });

  it('descarta entradas sem nome válido nas duas fontes', () => {
    const bancoRuim = [{ id: 'x', nome: '   ' }, null, { nome: '' }, undefined];
    const diarioRuim = [{ turmaId: 't', turmaNome: 'T', aluno: { nome: '   ' } }, { turmaId: 't2' }, null];
    const lista = montarListaBancoAlunos(bancoRuim, diarioRuim);
    expect(lista).toEqual([]);
  });

  it('listas null ou não-array resultam em lista vazia', () => {
    expect(montarListaBancoAlunos(null, undefined)).toEqual([]);
    expect(montarListaBancoAlunos('lixo', { nao: 'array' })).toEqual([]);
  });

  it('chaves são únicas e estáveis entre chamadas', () => {
    const diarioDuplo = [
      { turmaId: 't1', turmaNome: '8B', aluno: { nome: 'João Souza' } },
      { turmaId: 't3', turmaNome: '8C', aluno: { nome: 'João Souza' } },
    ];
    const primeira = montarListaBancoAlunos(bancoBase, diarioDuplo);
    const segunda = montarListaBancoAlunos(bancoBase, diarioDuplo);
    const chaves = primeira.map((a) => a.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(chaves).toEqual(segunda.map((a) => a.chave));
  });
});
