/**
 * Teste End-to-End (E2E) — Módulo "Meu Horário Escolar"
 * Referência: specs/HORARIO_ESCOLAR_PRD.md e specs/TESTS_SPEC.md (E2E-01)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { uid: 'prof_e2e_123', email: 'prof@escola.gov.br' } }),
}));

vi.mock('@/lib/firebase', () => ({
  db: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            teacherName: 'Prof. Usuário',
            schoolName: 'Minha Escola',
            shift: 'manha',
            showSaturday: false,
            theme: 'light',
            customSlots: null,
            schedule: {},
          }),
        }),
        set: vi.fn().mockResolvedValue(),
      }),
    }),
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import HorarioRedirect from '../../frontend/src/app/horario/page';
import HorarioApp from '../../frontend/src/apresentacao/horario/HorarioApp';

describe('E2E-01: Jornada Completa do Módulo Meu Horário Escolar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k) => storage[k] || null),
      setItem: vi.fn((k, v) => {
        storage[k] = String(v);
      }),
      removeItem: vi.fn((k) => {
        delete storage[k];
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      }),
    });
  });

  it('deve redirecionar da rota legada /horario para a rota canônica /meuhorario', () => {
    expect(() => HorarioRedirect()).toThrow('NEXT_REDIRECT');
  });

  it('deve carregar a tela de horário, renderizar a grade semanal e permitir alternar idioma pt-BR / es-Latam', async () => {
    render(<HorarioApp />);

    // Valida carregamento inicial em Português
    await waitFor(() => {
      expect(screen.getByText(/Total de Aulas/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Professor\(a\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Escola/i)).toBeInTheDocument();

    // Seletor de Idioma
    const selectIdioma = screen.getByLabelText(/Idioma/i);
    expect(selectIdioma).toBeInTheDocument();
    expect(selectIdioma.value).toBe('pt-BR');

    // Alterna para Espanhol (es-Latam)
    fireEvent.change(selectIdioma, { target: { value: 'es-Latam' } });

    // Rótulos de interface devem refletir os termos em Espanhol (i18n)
    await waitFor(() => {
      expect(screen.getByText(/Total de Clases/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Profesor\(a\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Escuela/i)).toBeInTheDocument();
    });

    // Retorna para Português
    fireEvent.change(selectIdioma, { target: { value: 'pt-BR' } });
    await waitFor(() => {
      expect(screen.getByText(/Total de Aulas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Professor\(a\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Escola/i)).toBeInTheDocument();
    });
  });

  it('deve abrir o modal de configuração de turnos e grade ao interagir com o botão de configuração', async () => {
    render(<HorarioApp />);

    await waitFor(() => {
      expect(screen.getByText(/Total de Aulas/i)).toBeInTheDocument();
    });

    // Clica no botão de configurar horários de aulas e intervalos
    const configBtn = screen.getByRole('button', { name: /Horários/i });
    expect(configBtn).toBeInTheDocument();
    fireEvent.click(configBtn);

    // Modal deve ser exibido com opções de horários e intervalos
    await waitFor(() => {
      expect(screen.getByText(/Configurar Horários e Intervalos/i)).toBeInTheDocument();
      expect(screen.getByText(/Personalize a ordem, nome e tempo de cada aula/i)).toBeInTheDocument();
    });

    // Fechar modal
    const fecharBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(fecharBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Configurar Horários e Intervalos/i)).not.toBeInTheDocument();
    });
  });
});
