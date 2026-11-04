import { expect, it } from 'vitest';
import { PLATFORM_MODULES } from '@/config/modules';

it('HUB-ORDEM-01: apresenta todos os módulos na sequência definida pelo professor', () => {
  expect(PLATFORM_MODULES.map(modulo => modulo.id)).toEqual([
    'horario-escolar',
    'analytics-pedagogico',
    'diario-planejamento',
    'calendario-pedagogico',
    'gerador-atividades',
    'atividades-adaptadas',
    'agente-linguagens',
    'redacao-corretor',
    'horario-escolar-inteligente',
  ]);
});
