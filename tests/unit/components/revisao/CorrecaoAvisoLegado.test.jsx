import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { test, expect, afterEach } from 'vitest';
import { EntregaDrawer } from '@/components/atividades/EntregaDrawer';
afterEach(cleanup);
test('RN-80 aviso de imagem omitida permanece visível em entrega legada', () => {
  render(
    <EntregaDrawer
      entrega={{
        notaFinal: 2,
        respostaTexto: 'Texto',
        avisosCorrecao: ['Imagem omitida; revise manualmente.'],
      }}
      atividade={{ notaMaxima: 5 }}
      alunoNome="Ana"
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('Imagem omitida');
});
