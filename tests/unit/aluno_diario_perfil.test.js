import { describe, it, expect } from 'vitest';
import {
  criarAlunoDiario,
  atualizarAlunoDiario,
  paraPerfilInclusivo,
  listarAlunosParaSeletor,
} from '../../frontend/src/dominio/diario/AlunoDiario';

describe('UT-37 (RN-46): criarAlunoDiario com perfil inclusivo', () => {
  it('persiste nivelSuporte 1, 2 e 3 válidos', () => {
    for (const nivel of [1, 2, 3]) {
      const aluno = criarAlunoDiario({ id: 'a1', nome: 'Ana Souza', nivelSuporte: nivel });
      expect(aluno.nivelSuporte).toBe(nivel);
    }
  });

  it('omite nivelSuporte quando inválido (4, "abc", null)', () => {
    for (const invalido of [4, 0, 'abc', null, undefined, 2.5]) {
      const aluno = criarAlunoDiario({ id: 'a1', nome: 'Ana Souza', nivelSuporte: invalido });
      expect(aluno).not.toHaveProperty('nivelSuporte');
    }
  });

  it('persiste hiperfoco e observacoes trimados', () => {
    const aluno = criarAlunoDiario({
      id: 'a1',
      nome: 'Ana Souza',
      hiperfoco: '  Dinossauros  ',
      observacoes: ' sensível a ruídos ',
    });
    expect(aluno.hiperfoco).toBe('Dinossauros');
    expect(aluno.observacoes).toBe('sensível a ruídos');
  });

  it('omite hiperfoco e observacoes quando vazios ou só espaços', () => {
    for (const vazio of ['', '   ', null, undefined]) {
      const aluno = criarAlunoDiario({
        id: 'a1',
        nome: 'Ana Souza',
        hiperfoco: vazio,
        observacoes: vazio,
      });
      expect(aluno).not.toHaveProperty('hiperfoco');
      expect(aluno).not.toHaveProperty('observacoes');
    }
  });

  it('preserva os campos legados sem alteração', () => {
    const aluno = criarAlunoDiario({
      id: 'a1',
      nome: 'Ana Souza',
      dataNascimento: '1503',
      necessidades: ['tea', 'tea', 'invalido_xyz'],
      nivelSuporte: 2,
      hiperfoco: 'Games',
      observacoes: 'Prefere apoio visual',
    });
    expect(aluno).toEqual({
      id: 'a1',
      nome: 'Ana Souza',
      dataNascimento: '1503',
      necessidades: ['tea'],
      nivelSuporte: 2,
      hiperfoco: 'Games',
      observacoes: 'Prefere apoio visual',
    });
  });
});

describe('UT-38 (RN-46): atualizarAlunoDiario com perfil inclusivo', () => {
  const base = () =>
    criarAlunoDiario({
      id: 'a1',
      nome: 'Ana Souza',
      dataNascimento: '1503',
      necessidades: ['tea'],
      nivelSuporte: 1,
      hiperfoco: 'Dinossauros',
      observacoes: 'Sensível a ruídos',
    });

  it('persiste valores válidos no merge', () => {
    const atualizado = atualizarAlunoDiario(base(), {
      nivelSuporte: 3,
      hiperfoco: 'Futebol',
      observacoes: 'Nova observação',
    });
    expect(atualizado.nivelSuporte).toBe(3);
    expect(atualizado.hiperfoco).toBe('Futebol');
    expect(atualizado.observacoes).toBe('Nova observação');
  });

  it('remove nivelSuporte quando o update traz valor inválido', () => {
    for (const invalido of [4, 'abc', null, 0]) {
      const atualizado = atualizarAlunoDiario(base(), { nivelSuporte: invalido });
      expect(atualizado).not.toHaveProperty('nivelSuporte');
    }
  });

  it('remove hiperfoco/observacoes quando o update traz texto vazio', () => {
    const atualizado = atualizarAlunoDiario(base(), {
      hiperfoco: '   ',
      observacoes: '',
    });
    expect(atualizado).not.toHaveProperty('hiperfoco');
    expect(atualizado).not.toHaveProperty('observacoes');
  });

  it('preserva nome, dataNascimento e necessidades quando não citados no update', () => {
    const atualizado = atualizarAlunoDiario(base(), { nivelSuporte: 2 });
    expect(atualizado.nome).toBe('Ana Souza');
    expect(atualizado.dataNascimento).toBe('1503');
    expect(atualizado.necessidades).toEqual(['tea']);
  });
});

describe('UT-39 (RN-46): ponte Diário → Perfil Inclusivo (paraPerfilInclusivo / listarAlunosParaSeletor)', () => {
  it('aluno completo devolve os 5 campos prontos para o form', () => {
    const perfil = paraPerfilInclusivo({
      id: 'a1',
      nome: 'Ana Souza',
      necessidades: ['tea', 'tdah'],
      nivelSuporte: 2,
      hiperfoco: 'Dinossauros',
      observacoes: 'Sensível a ruídos',
    });
    expect(perfil).toEqual({
      nome: 'Ana Souza',
      necessidades: ['tea', 'tdah'],
      nivelSuporte: 2,
      hiperfoco: 'Dinossauros',
      observacoes: 'Sensível a ruídos',
    });
  });

  it('aluno legado sem campos devolve defaults (nível 1, textos vazios)', () => {
    const perfil = paraPerfilInclusivo({ id: 'a1', nome: 'Ana Souza' });
    expect(perfil).toEqual({
      nome: 'Ana Souza',
      necessidades: [],
      nivelSuporte: 1,
      hiperfoco: '',
      observacoes: '',
    });
  });

  it('descarta necessidades inválidas e normaliza nível inválido para 1', () => {
    const perfil = paraPerfilInclusivo({
      id: 'a1',
      nome: 'Ana Souza',
      necessidades: ['tea', 'invalido_xyz'],
      nivelSuporte: 9,
      hiperfoco: '  ',
      observacoes: null,
    });
    expect(perfil.necessidades).toEqual(['tea']);
    expect(perfil.nivelSuporte).toBe(1);
    expect(perfil.hiperfoco).toBe('');
    expect(perfil.observacoes).toBe('');
  });

  it('aluno sem nome não gera perfil', () => {
    expect(paraPerfilInclusivo(null)).toBeNull();
    expect(paraPerfilInclusivo({ id: 'a1', nome: '   ' })).toBeNull();
  });

  it('listarAlunosParaSeletor achata turmas e ignora entradas sem nome', () => {
    const turmas = [
      {
        id: 't1',
        nome: '9º Ano A',
        alunos: [
          { id: 'a1', nome: 'Ana Souza', nivelSuporte: 2 },
          { id: 'a2', nome: '' },
          { id: 'a3' },
          'entrada-corrompida',
        ],
      },
      { id: 't2', nome: '9º Ano B', alunos: [] },
      { id: 't3' },
    ];
    const lista = listarAlunosParaSeletor(turmas);
    expect(lista).toEqual([
      { turmaId: 't1', turmaNome: '9º Ano A', aluno: { id: 'a1', nome: 'Ana Souza', nivelSuporte: 2 } },
    ]);
  });

  it('listarAlunosParaSeletor tolera lista de turmas vazia/inválida', () => {
    expect(listarAlunosParaSeletor(null)).toEqual([]);
    expect(listarAlunosParaSeletor([])).toEqual([]);
  });
});
