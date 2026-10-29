import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AtividadeForm } from '@/components/atividades/AtividadeForm';

const turmaB = {
  id: 't2',
  nome: 'Turma B',
  anoLetivo: 2026,
  alunos: [{ id: 'b', nome: 'Bia' }, { id: 'c', nome: 'Caio' }],
};

const conteudo = {
  titulo: 'Cópia revisada',
  questoes: [{
    id: 'q1',
    tipo: 'discursiva',
    enunciado: 'Explique a cópia.',
    notaMaxima: 4,
    rubrica: 'Clareza',
    alternativas: [],
    imagens: [{ base64: 'data:image/png;base64,AAAA' }],
  }],
  textosBase: [],
  materiais: [],
  materialApoio: null,
  avisos: [],
};

const contexto = {
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c2',
  conjuntoVersao: 3,
  semestre: '2',
  anoLetivo: '2026',
  turmaId: 't2',
  destinatariosIds: ['b'],
  pontosRestantes: 10,
  prazoInicial: '2099-05-01T23:59',
};

const turmaA = { id: 't1', nome: 'Turma A', anoLetivo: 2026, alunos: [{ id: 'a', nome: 'Ana' }] };

describe('R82-02: formulário em modo de criação copiada', () => {
  it('preenche conteúdo, usa novo ID e chama onCreate em vez de onUpdate', async () => {
    const onCreate = vi.fn().mockResolvedValue('atv_copia');
    const onUpdate = vi.fn();
    const onClose = vi.fn();

    render(
      <AtividadeForm
        turmas={[turmaB]}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onClose={onClose}
        conteudoInicial={conteudo}
        contextoInicial={contexto}
      />,
    );

    expect(screen.getByDisplayValue('Cópia revisada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Explique a cópia.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de entrega/i)).toHaveValue('2099-05-01T23:59');
    expect(document.querySelector('img[src="data:image/png;base64,AAAA"]')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Criar cópia/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onUpdate).not.toHaveBeenCalled();
    const payload = onCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      titulo: 'Cópia revisada',
      turmaIds: ['t2'],
      finalidade: 'recuperacao_semestral',
      conjuntoRecuperacaoId: 'c2',
      conjuntoVersao: 3,
      semestre: '2',
      anoLetivo: '2026',
      destinatariosIds: ['b'],
      notaMaxima: 4,
    });
    expect(payload.id).toMatch(/^atv_/);
    expect(payload.id).not.toBe('r1');
    expect(payload.dataEntrega).toBeInstanceOf(Date);
    expect(payload.dataEntrega.toISOString()).toBe(new Date('2099-05-01T23:59:00').toISOString());
    expect(payload.questoes[0].imagens).toEqual([{ base64: 'data:image/png;base64,AAAA' }]);
    expect(payload.alunosPorTurma).toEqual({ t2: [{ id: 'b', nome: 'Bia' }] });
    expect(onClose).toHaveBeenCalled();
  });

  it('valida prazo novo e saldo antes de criar', async () => {
    const onCreate = vi.fn();
    render(
      <AtividadeForm
        turmas={[turmaB]}
        onCreate={onCreate}
        onClose={vi.fn()}
        conteudoInicial={conteudo}
        contextoInicial={{ ...contexto, pontosRestantes: 3 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Criar cópia/i }));
    expect(await screen.findByText(/Restam 3,00 para distribuir/i)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Data de entrega/i), { target: { value: '2026-02-30T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Criar cópia/i }));
    expect(await screen.findByText(/Data de entrega inválida/i)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('preserva a edição normal com initialData e não mistura os dois modos', async () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const inicial = {
      id: 'origem-1',
      titulo: 'Original',
      finalidade: 'recuperacao_semestral',
      conjuntoRecuperacaoId: 'c1',
      conjuntoVersao: 2,
      semestre: '1',
      anoLetivo: '2026',
      turmaIds: ['t1'],
      destinatariosIds: ['a'],
      dataEntrega: new Date('2026-03-01T23:59:00'),
      questoes: conteudo.questoes,
      textosBase: [],
      materiais: [],
      materialApoio: null,
    };

    render(
      <AtividadeForm
        turmas={[turmaA]}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onClose={vi.fn()}
        initialData={inicial}
        conteudoInicial={conteudo}
        contextoInicial={contexto}
      />,
    );

    expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Salvar Alterações/i }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(onCreate).not.toHaveBeenCalled();
    expect(onUpdate.mock.calls[0][0]).toBe('origem-1');
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ id: 'origem-1', conjuntoRecuperacaoId: 'c1' });
  });

  it('cancela sem gravar e mantém avisos de conteúdo não copiado visíveis', () => {
    const onCreate = vi.fn();
    const onClose = vi.fn();

    render(
      <AtividadeForm
        turmas={[turmaB]}
        onCreate={onCreate}
        onClose={onClose}
        conteudoInicial={conteudo}
        contextoInicial={{
          ...contexto,
          avisosCopia: [{ codigo: 'IMAGEM_INDISPONIVEL', mensagem: 'Uma imagem local não pôde ser copiada.' }],
        }}
      />,
    );

    expect(screen.getByText(/Uma imagem local não pôde ser copiada/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onClose).toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
