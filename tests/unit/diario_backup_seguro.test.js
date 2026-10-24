import { describe, expect, it } from 'vitest';
import { deserializarBackupTurmas, criarBackupVersionado, prepararRestauracaoBackup } from '../../frontend/src/dominio/diario/backupTurmas';

const turma = (id = 't1') => ({ id, nome: '101', alunos: [{ id: 'a1', nome: 'Ana' }], bimestres: { 1: { atividades: [{ id: 'at1', nome: 'Leitura', max: 5 }], notas: { a1: { simulado: 0, at1: 4 } }, config: { simuladoMaxLanca: 5, simuladoMaxFinal: 5, atividadesMaxFinal: 5, mediaAprovacao: 5, mediaRecuperacao: 4.99 } } }, recuperacao: { a1: { rec1: 0, rec2: '' } } });
const clone = () => structuredClone(turma());

describe('RN-68: backup seguro', () => {
  it('exporta versão e restaura envelope mantendo notas zero e dados personalizados', () => {
    const backup = criarBackupVersionado([turma()], '2026-10-23T12:00:00.000Z');
    expect(backup).toMatchObject({ formato: 'rotina-docente-turmas', versao: 1, criadoEm: '2026-10-23T12:00:00.000Z' });
    expect(deserializarBackupTurmas(JSON.stringify(backup))).toEqual([turma()]);
  });
  it('rejeita versão desconhecida', () => {
    expect(() => deserializarBackupTurmas({ formato: 'rotina-docente-turmas', versao: 99, turmas: [turma()] })).toThrow(/versão/i);
  });
  it.each([
    ['alunos não é lista', t => { t.alunos = {}; }],
    ['ID de aluno repetido', t => { t.alunos.push({ id: 'a1', nome: 'Outra' }); }],
    ['bimestre inválido', t => { t.bimestres[5] = {}; }],
    ['bimestres nulo', t => { t.bimestres = null; }],
    ['atividade duplicada', t => { t.bimestres[1].atividades.push({ id: 'at1', max: 1 }); }],
    ['atividade sem máximo válido', t => { t.bimestres[1].atividades[0].max = -1; }],
    ['nota não finita', t => { t.bimestres[1].notas.a1.simulado = Infinity; }],
    ['nota parcial', t => { t.bimestres[1].notas.a1.simulado = '3abc'; }],
    ['nota em objeto', t => { t.bimestres[1].notas.a1.at1 = { valor: 3 }; }],
    ['escala zero', t => { t.bimestres[1].config.simuladoMaxLanca = 0; }],
    ['limites incoerentes', t => { t.bimestres[1].config.mediaRecuperacao = 6; }],
    ['recuperação igual à aprovação', t => { t.bimestres[1].config.mediaRecuperacao = 5; }],
    ['escala acima do limite do domínio', t => { t.bimestres[1].config.simuladoMaxLanca = 1001; }],
    ['recuperação inválida', t => { t.recuperacao.a1.rec1 = 'infinito'; }],
  ])('rejeita estrutura profunda: %s', (_, alterar) => {
    const t = clone(); alterar(t);
    expect(() => deserializarBackupTurmas([t])).toThrow(/inválid|duplicad/i);
  });
  it('rejeita IDs de turma duplicados', () => {
    expect(() => deserializarBackupTurmas([turma(), turma()])).toThrow(/duplicad/i);
  });
  it('aceita backup legado, converte chaves b1 para uso na restauração e preserva serialização legada', () => {
    const legado = { ...turma(), bimestres: { b1: { notas: { a1: { simulado: 5 } } } } };
    expect(deserializarBackupTurmas([legado])).toEqual([legado]);
    const plano = prepararRestauracaoBackup([], [legado], 'mesclar');
    expect(plano.turmas[0].bimestres[1]).toMatchObject({ atividades: [], notas: { a1: { simulado: 5 } } });
  });
  it('mescla por IDs sem alterar notas nem cadastro existentes, informa conflitos e contagens', () => {
    const atual = turma(); const recebido = clone();
    recebido.alunos[0].nome = 'Ana alterada';
    recebido.alunos.push({ id: 'a2', nome: 'Bruna' });
    recebido.bimestres[1].notas.a1.simulado = 5;
    recebido.bimestres[1].notas.a2 = { simulado: 4 };
    const plano = prepararRestauracaoBackup([atual], [recebido, turma('t2')], 'mesclar');
    expect(plano.turmas).toHaveLength(2);
    expect(plano.turmas[0].alunos).toHaveLength(2);
    expect(plano.turmas[0].alunos[0].nome).toBe('Ana');
    expect(plano.turmas[0].bimestres[1].notas.a1.simulado).toBe(0);
    expect(plano.turmas[0].bimestres[1].notas.a2.simulado).toBe(4);
    expect(plano.conflitos).toEqual(expect.arrayContaining([expect.stringContaining('simulado'), expect.stringContaining('nome')]));
    expect(plano.resumo.atual).toMatchObject({ turmas: 1, alunos: 1, notas: 3 });
    expect(plano.resumo.resultado).toMatchObject({ turmas: 2, alunos: 3, notas: 7 });
    expect(atual).toEqual(turma());
  });
  it('substitui somente por escolha explícita e informa alcance anterior e recebido', () => {
    const plano = prepararRestauracaoBackup([turma()], [], 'substituir');
    expect(plano.turmas).toEqual([]);
    expect(plano.resumo.atual.turmas).toBe(1);
    expect(plano.resumo.recebido.turmas).toBe(0);
    expect(() => prepararRestauracaoBackup([], [], 'automatico')).toThrow(/modo/i);
  });
  it('recusa propriedades perigosas em vez de incorporá-las na mesclagem', () => {
    const json = JSON.stringify([turma()]).replace('"nome":"101"', '"nome":"101","__proto__":{"poluido":true}');
    expect(() => deserializarBackupTurmas(json)).toThrow(/inválid/i);
    expect({}.poluido).toBeUndefined();
  });
});
