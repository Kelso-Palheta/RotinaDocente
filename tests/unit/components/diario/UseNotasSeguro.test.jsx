import { renderHook, act } from '@testing-library/react';
import { it, expect } from 'vitest';
import { useState } from 'react';
import { useNotas } from '@/hooks/diario/useNotas';
const inicial = [{ id: 't', alunos: [], bimestres: { '1': { config: { simuladoMaxLanca: 5 }, atividades: [{ id: 'x', max: 1 }], notas: {} } } }];
it('hook rejeita nota fora da escala e critérios inválidos sem alterar estado', () => {
  const { result } = renderHook(() => { const [turmas, setTurmas] = useState(inicial); return { turmas, ...useNotas(setTurmas) }; });
  expect(() => act(() => result.current.setNota('t', 1, 'a', 'simulado', '8abc'))).toThrow();
});
