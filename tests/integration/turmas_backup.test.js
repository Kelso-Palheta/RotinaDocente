/**
 * Testes de Integração — Serialização e Deserialização do Backup em JSON das Turmas
 * Referência: specs/TESTS_SPEC.md (IT-02)
 */

import { describe, it, expect } from 'vitest';
import {
  serializarBackupTurmas,
  deserializarBackupTurmas,
} from '../../frontend/src/dominio/diario/backupTurmas';

describe('IT-02: Serialização e deserialização do backup em JSON das turmas', () => {
  const turmasValidas = [
    {
      id: 'turma_3a',
      nome: '3º Ano A - Ensino Médio',
      alunos: [
        { id: 'aluno_1', nome: 'Kelso Palheta', numeroChamada: 1 },
        { id: 'aluno_2', nome: 'Mariana Lima', numeroChamada: 2 },
      ],
      bimestres: {
        b1: { notas: { aluno_1: { simulado: 4.5, total: 9.0 } } },
        b2: { notas: {} },
        b3: { notas: {} },
        b4: { notas: {} },
      },
    },
    {
      id: 'turma_3b',
      nome: '3º Ano B - Ensino Médio',
      alunos: [],
      bimestres: { b1: {}, b2: {}, b3: {}, b4: {} },
    },
  ];

  it('deve serializar a lista de turmas para string JSON válida e formatada', () => {
    const jsonStr = serializarBackupTurmas(turmasValidas);
    expect(typeof jsonStr).toBe('string');

    const parsed = JSON.parse(jsonStr);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe('turma_3a');
    expect(parsed[0].alunos).toHaveLength(2);
  });

  it('deve deserializar string JSON e restaurar o estado idêntico das turmas (round-trip)', () => {
    const jsonStr = serializarBackupTurmas(turmasValidas);
    const restaurado = deserializarBackupTurmas(jsonStr);

    expect(restaurado).toEqual(turmasValidas);
    expect(restaurado[0].bimestres.b1.notas.aluno_1.simulado).toBe(4.5);
  });

  it('deve rejeitar backup que não seja array ou seja nulo', () => {
    expect(() => deserializarBackupTurmas('{"id": "1"}')).toThrow(/lista de turmas/i);
    expect(() => deserializarBackupTurmas(null)).toThrow(/lista de turmas/i);
    expect(() => deserializarBackupTurmas('123')).toThrow(/lista de turmas/i);
  });

  it('deve rejeitar estrutura de turmas com campos obrigatórios ausentes', () => {
    const turmasSemId = JSON.stringify([{ nome: 'Sem ID', alunos: [], bimestres: {} }]);
    expect(() => deserializarBackupTurmas(turmasSemId)).toThrow(/estrutura.*inválida/i);

    const turmasSemAlunos = JSON.stringify([{ id: 't1', nome: 'Sem Alunos', bimestres: {} }]);
    expect(() => deserializarBackupTurmas(turmasSemAlunos)).toThrow(/estrutura.*inválida/i);

    const turmasSemBimestres = JSON.stringify([{ id: 't1', nome: 'Sem Bimestres', alunos: [] }]);
    expect(() => deserializarBackupTurmas(turmasSemBimestres)).toThrow(/estrutura.*inválida/i);
  });
});
