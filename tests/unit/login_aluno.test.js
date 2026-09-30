import { describe, it, expect } from 'vitest';
import {
  gerarLoginAluno,
  gerarLoginDoisNomes,
  gerarLoginKey,
  resolverLoginsAlunos,
  resolverLoginUnico,
  selecionarLoginExibido,
} from '../../frontend/src/utils/diario/loginAluno';

describe('UT-34: Login canônico do aluno (RN-45)', () => {
  it('gera o formato canônico 1º nome + DDMM', () => {
    expect(gerarLoginAluno('Pedro Henrique Ribeiro Nascimento', '1111')).toBe('pedro1111');
    expect(gerarLoginAluno('Maria Eduarda da Silva', '1503')).toBe('maria1503');
  });

  it('descarta preposições e remove acentos no formato canônico', () => {
    expect(gerarLoginAluno('Maria da Silva Santos', '1503')).toBe('maria1503');
    expect(gerarLoginAluno('João Lúcio Álvares', '0505')).toBe('joao0505');
    expect(gerarLoginAluno('Ana e Maria', '0101')).toBe('ana0101');
  });

  it('lida com alunos de nome único no formato canônico', () => {
    expect(gerarLoginAluno('Kelso', '0407')).toBe('kelso0407');
    expect(gerarLoginAluno('Maria', '1503')).toBe('maria1503');
  });

  it('gera o formato de exceção 1º + 2º nome + DDMM para homônimos', () => {
    expect(gerarLoginDoisNomes('Pedro Henrique Ribeiro Nascimento', '1111')).toBe('pedrohenrique1111');
    expect(gerarLoginDoisNomes('Pedro Vitor Dos Santos Lima', '1111')).toBe('pedrovitor1111');
    expect(gerarLoginDoisNomes('Maria da Silva Santos', '1503')).toBe('mariasilva1503');
    expect(gerarLoginDoisNomes('Kelso', '0407')).toBe('kelso0407');
  });

  it('mantém o hash SHA-256 estável e de 64 caracteres', async () => {
    const hash1 = await gerarLoginKey('pedro1111');
    const hash2 = await gerarLoginKey('pedro1111');
    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });
});

describe('UT-35: Resolução de homônimos por turma (RN-45)', () => {
  const loginDe = (resultado, id) => resultado.find((r) => r.aluno.id === id)?.login;

  it('mantém o formato de 1º nome quando não há colisão na turma', () => {
    const turma = [
      { id: 'a1', nome: 'Ana Souza Pereira', dataNascimento: '1102' },
      { id: 'a2', nome: 'Bruno Lima', dataNascimento: '3005' },
    ];
    const resultado = resolverLoginsAlunos(turma);
    expect(loginDe(resultado, 'a1')).toBe('ana1102');
    expect(loginDe(resultado, 'a2')).toBe('bruno3005');
    expect(resultado.every((r) => !r.homonimo)).toBe(true);
  });

  it('aplica 2 nomes para TODOS os homônimos da mesma turma (mesmo 1º nome + DDMM)', () => {
    const turma = [
      { id: 'p1', nome: 'Pedro Henrique Nascimento', dataNascimento: '1111' },
      { id: 'p2', nome: 'Pedro Vitor Dos Santos Lima', dataNascimento: '1111' },
      { id: 'm1', nome: 'Maria Clara', dataNascimento: '1111' },
    ];
    const resultado = resolverLoginsAlunos(turma);
    expect(loginDe(resultado, 'p1')).toBe('pedrohenrique1111');
    expect(loginDe(resultado, 'p2')).toBe('pedrovitor1111');
    expect(loginDe(resultado, 'm1')).toBe('maria1111');
    expect(resultado.find((r) => r.aluno.id === 'p1').homonimo).toBe(true);
    expect(resultado.find((r) => r.aluno.id === 'm1').homonimo).toBe(false);
  });

  it('não considera colisão quando o primeiro nome é igual mas o DDMM diverge', () => {
    const turma = [
      { id: 'p1', nome: 'Pedro Henrique', dataNascimento: '1111' },
      { id: 'p2', nome: 'Pedro Vitor', dataNascimento: '2222' },
    ];
    const resultado = resolverLoginsAlunos(turma);
    expect(loginDe(resultado, 'p1')).toBe('pedro1111');
    expect(loginDe(resultado, 'p2')).toBe('pedro2222');
  });

  it('retorna login vazio sem dataNascimento e preserva a ordem de entrada', () => {
    const turma = [
      { id: 'z1', nome: 'Zilda', dataNascimento: '' },
      { id: 'a1', nome: 'Ana Souza', dataNascimento: '1102' },
    ];
    const resultado = resolverLoginsAlunos(turma);
    expect(loginDe(resultado, 'z1')).toBe('');
    expect(loginDe(resultado, 'a1')).toBe('ana1102');
    expect(resultado.map((r) => r.aluno.id)).toEqual(['z1', 'a1']);
  });
});

describe('UT-36: Unicidade global e exibição do login (RN-45)', () => {
  const docs = (mapa) => async (login) => (mapa[login] ? { nome: mapa[login] } : null);

  it('mantém o login candidato quando o documento não existe ou tem nome equivalente', async () => {
    await expect(
      resolverLoginUnico('Pedro Henrique', '1111', docs({}))
    ).resolves.toEqual({ login: 'pedro1111', homonimo: false, conflito: false });

    await expect(
      resolverLoginUnico('Pedro Henrique', '1111', docs({ pedro1111: 'PEDRO HENRIQUE' }))
    ).resolves.toEqual({ login: 'pedro1111', homonimo: false, conflito: false });
  });

  it('escala de 1 para 2 nomes quando o documento existe com nome divergente', async () => {
    const resultado = await resolverLoginUnico(
      'Pedro Henrique',
      '1111',
      docs({ pedro1111: 'Pedro Vitor Dos Santos Lima' })
    );
    expect(resultado).toEqual({ login: 'pedrohenrique1111', homonimo: true, conflito: false });
  });

  it('retorna conflito sem login quando até a chave de 2 nomes colide com nome divergente', async () => {
    const resultado = await resolverLoginUnico(
      'Pedro Henrique',
      '1111',
      docs({
        pedro1111: 'Pedro Vitor Lima',
        pedrohenrique1111: 'Pedro Henrique Souza',
      })
    );
    expect(resultado.conflito).toBe(true);
    expect(resultado.login).toBeNull();
  });

  it('parte direto da chave de 2 nomes quando o grupo de homônimos já foi resolvido na turma', async () => {
    const resultado = await resolverLoginUnico(
      'Pedro Henrique',
      '1111',
      docs({}),
      { homonimo: true }
    );
    expect(resultado).toEqual({ login: 'pedrohenrique1111', homonimo: true, conflito: false });
  });

  it('seleciona o login armazenado com as prioridades: canônico, sufixo do DDMM, 4 dígitos, primeiro', () => {
    const aluno = { nome: 'Ana Souza', dataNascimento: '1102' };
    expect(selecionarLoginExibido([], aluno)).toBe('');
    expect(selecionarLoginExibido(['mariasilva1503', 'maria1503'], { nome: 'Maria Silva', dataNascimento: '1503' })).toBe('maria1503');
    expect(selecionarLoginExibido(['anasouza1503', 'anaclara1102'], aluno)).toBe('anaclara1102');
    expect(selecionarLoginExibido(['ayrasantos1307'], { nome: 'Ayra Santos', dataNascimento: '1307' })).toBe('ayrasantos1307');
    expect(selecionarLoginExibido(['luan_migrado'], aluno)).toBe('luan_migrado');
  });
});
