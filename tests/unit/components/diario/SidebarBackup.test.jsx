import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Sidebar } from '../../../../frontend/src/components/diario/Sidebar';

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const turma = id => ({ id, nome: id, alunos: [], bimestres: {} });
const props = extras => ({ turmas: [turma('visivel')], backupTurmas: [turma('visivel'), turma('outro-ano')], bimestreSelecionado: 1, user: { uid: 'prof-1' }, onSelectTurma: vi.fn(), onSelectBimestre: vi.fn(), onAddTurma: vi.fn(), onReorderTurmas: vi.fn(), ...extras });

describe('RN-68: backup na lateral do Diário', () => {
  it('restaurar abre prévia completa sem aplicar; aplica apenas após escolha e persistência', async () => {
    const onImportTurmas = vi.fn().mockResolvedValue();
    render(<Sidebar {...props({ onImportTurmas })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar backup' }));
    const arquivo = new File([JSON.stringify([turma('nova')])], 'backup.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Arquivo de backup do Diário'), { target: { files: [arquivo] } });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(onImportTurmas).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/mesclar/i));
    fireEvent.click(screen.getAllByRole('button', { name: 'Restaurar backup' }).at(-1));
    await waitFor(() => expect(onImportTurmas).toHaveBeenCalledWith([turma('visivel'), turma('outro-ano'), turma('nova')], { origem: 'backup', modo: 'mesclar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('status').textContent).toContain('salvo na nuvem');
  });
  it('exporta toda conta em formato versionado e permite recuperar cópia anterior somente da conta atual', () => {
    localStorage.setItem('diario_backup_anterior_prof-2', JSON.stringify({ turmas: [] }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      const envelope = JSON.parse(decodeURIComponent(this.href.split(',')[1]));
      expect(envelope.versao).toBe(1);
      expect(envelope.turmas).toHaveLength(2);
    });
    render(<Sidebar {...props()} />);
    expect(screen.queryByRole('button', { name: 'Baixar cópia anterior' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar backup' }));
    expect(click).toHaveBeenCalledOnce();
  });
  it('reavalia cópia anterior após trocar de conta sem exibir dados da conta anterior', () => {
    localStorage.setItem('diario_backup_anterior_prof-1', JSON.stringify({ formato: 'rotina-docente-turmas', versao: 1, turmas: [] }));
    const { rerender } = render(<Sidebar {...props()} />);
    expect(screen.getByRole('button', { name: 'Baixar cópia anterior' })).toBeTruthy();
    rerender(<Sidebar {...props({ user: { uid: 'prof-2' } })} />);
    expect(screen.queryByRole('button', { name: 'Baixar cópia anterior' })).toBeNull();
  });
});
