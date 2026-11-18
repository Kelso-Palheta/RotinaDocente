import { expect, it } from 'vitest';
import { limparTextoIA } from '@/dominio/aula-gamificada/comum';

it('preserva desigualdades matemáticas no material gerado pela IA', () => {
  const texto = 'Se x < 2 e y > 3, compare x e y.';
  expect(limparTextoIA(texto)).toBe(texto);
});
