import { describe, test, expect } from 'vitest';
import { mapearEstadoSync, chaveRotuloSync } from '@/apresentacao/horario/estadoSincronizacao';

describe('UT-54 — persistência vira estado de tela', () => {
  test('traduz o resultado do salvamento', () => {
    expect(mapearEstadoSync({ estado: 'nuvem' })).toBe('cloud');
    expect(mapearEstadoSync({ estado: 'local' })).toBe('local');
    expect(mapearEstadoSync({ estado: 'pendente' })).toBe('pending');
    expect(mapearEstadoSync({ estado: 'falha' })).toBe('error');
  });

  test('traduz a origem do carregamento', () => {
    expect(mapearEstadoSync({ origem: 'nuvem' })).toBe('cloud');
    expect(mapearEstadoSync({ origem: 'local' })).toBe('local');
    expect(mapearEstadoSync({ origem: 'padrao' })).toBe('local');
  });

  test('sem informação de persistência, assume somente dispositivo', () => {
    expect(mapearEstadoSync(undefined)).toBe('local');
    expect(mapearEstadoSync({})).toBe('local');
  });

  test('cada estado tem chave de rótulo traduzível', () => {
    expect(chaveRotuloSync('cloud')).toBe('syncCloud');
    expect(chaveRotuloSync('local')).toBe('syncLocal');
    expect(chaveRotuloSync('saving')).toBe('syncSaving');
    expect(chaveRotuloSync('pending')).toBe('syncPending');
    expect(chaveRotuloSync('error')).toBe('syncError');
    expect(chaveRotuloSync('desconhecido')).toBe('syncLocal');
  });
});
