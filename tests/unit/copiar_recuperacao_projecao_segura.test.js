import { expect, it } from 'vitest';
import { projetarConteudoRecuperacao } from '@/dominio/atividades/copiarRecuperacao';
it('campos de conteúdo escalares não transportam objetos com metadados discentes aninhados', () => {
  const privado = { alunoId: 'aluno-origem', token: 'segredo', feedback: 'privado' };
  const origem = { titulo: 'Base', questoes: [{ id: 'q', enunciado: 'Explique', rubrica: privado, scaffolding: privado, gabarito: privado, alternativas: [{ id: 'a', texto: privado }] }], textosBase: [{ id: 't', html: '<p>Base</p>', aposQuestao: null }], materiais: [{ id: 'm', nome: privado, texto: 'Apoio' }] };
  const copia = projetarConteudoRecuperacao(origem);
  expect(JSON.stringify(copia)).not.toMatch(/aluno-origem|segredo|privado/);
  expect(copia.questoes[0].rubrica).toBeUndefined();
  expect(copia.textosBase[0].aposQuestao).toBeNull();
  expect(origem.questoes[0].rubrica).toBe(privado);
});
it('objetos/arrays em IDs e números não compartilham referências com a cópia', () => {
  const campo = ['id-antigo'];
  const copia = projetarConteudoRecuperacao({ questoes: [{ id: campo, numero: { alunoId: 'a' }, enunciado: 'Explique' }] });
  expect(copia.questoes[0].id).toBeUndefined();
  expect(copia.questoes[0].numero).toBeUndefined();
  expect(campo).toEqual(['id-antigo']);
});
