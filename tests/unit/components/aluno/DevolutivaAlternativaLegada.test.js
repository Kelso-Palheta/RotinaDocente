import { expect, it } from 'vitest';
import { textoAlternativa } from '@/dominio/atividades/devolutivaAluno';

it('identifica alternativas sem prefixo pela posição, mesmo se começarem com artigo', () => {
  const questao = { alternativas: ['O vapor se eleva.', 'A água evapora.'] };

  expect(textoAlternativa(questao, 'A')).toBe('O vapor se eleva.');
  expect(textoAlternativa(questao, 'B')).toBe('A água evapora.');
});
