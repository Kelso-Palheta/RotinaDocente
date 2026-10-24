import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RestaurarBackupModal } from '../../../../frontend/src/components/diario/RestaurarBackupModal';

afterEach(() => { cleanup(); localStorage.clear(); });
const t = id => ({ id, nome: id, alunos: [], bimestres: {} });
const props = overrides => ({ turmasAtuais: [t('atual')], backup: [t('recebida')], contaId: 'prof-1', onAplicar: vi.fn().mockResolvedValue(undefined), onClose: vi.fn(), ...overrides });

describe('RN-68: restauração revisável', () => {
  it('mostra prévia, escolha explícita e preserva cópia da conta antes de aguardar a nuvem', async () => {
    let concluir;
    const onAplicar = vi.fn(() => new Promise(resolve => { concluir = resolve; }));
    const onClose = vi.fn();
    render(<RestaurarBackupModal {...props({ onAplicar, onClose })} />);
    expect(screen.getByRole('button', { name: 'Restaurar backup' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/mesclar/i));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar backup' }));
    expect(onAplicar).toHaveBeenCalledWith(expect.arrayContaining([t('atual'), t('recebida')]), { origem: 'backup', modo: 'mesclar' });
    expect(JSON.parse(localStorage.getItem('diario_backup_anterior_prof-1')).turmas).toEqual([t('atual')]);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/salvando/i)).toBeTruthy();
    concluir();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
  it('mantém modal e erro quando a nuvem falha, sem confirmação de sucesso', async () => {
    const onClose = vi.fn();
    render(<RestaurarBackupModal {...props({ onAplicar: vi.fn().mockRejectedValue(new Error('Sem conexão')), onClose })} />);
    fireEvent.click(screen.getByLabelText(/substituir/i));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar backup' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Sem conexão'));
    expect(onClose).not.toHaveBeenCalled();
  });
  it('não aplica quando falha a cópia anterior e isola a cópia por conta', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Armazenamento cheio'); });
    const onAplicar = vi.fn();
    render(<RestaurarBackupModal {...props({ onAplicar })} />);
    fireEvent.click(screen.getByLabelText(/substituir/i));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar backup' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Armazenamento cheio'));
    expect(onAplicar).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it('repetir após falha mantém cópia anterior original mesmo com rascunho alterado', async () => {
    const onAplicar = vi.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce();
    const base = props({ onAplicar });
    const { rerender } = render(<RestaurarBackupModal {...base} />);
    fireEvent.click(screen.getByLabelText(/substituir/i));
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar backup' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Sem conexão'));
    rerender(<RestaurarBackupModal {...base} turmasAtuais={[t('rascunho-da-tentativa')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar backup' }));
    await waitFor(() => expect(onAplicar).toHaveBeenCalledTimes(2));
    expect(JSON.parse(localStorage.getItem('diario_backup_anterior_prof-1')).turmas).toEqual([t('atual')]);
  });
});
