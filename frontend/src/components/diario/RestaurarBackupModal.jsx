"use client";

import { useRef, useState } from 'react';
import { criarBackupVersionado, prepararRestauracaoBackup } from '@/dominio/diario/backupTurmas';

export function RestaurarBackupModal({ turmasAtuais, backup, contaId, onAplicar, onClose }) {
  const [modo, setModo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const copiaAnteriorRef = useRef(null);
  let plano;
  let erroValidacao = '';
  try { plano = prepararRestauracaoBackup(turmasAtuais, backup, modo || 'mesclar'); }
  catch (error) { erroValidacao = error.message; }

  const aplicar = async () => {
    if (!modo || !plano || salvando) return;
    setErro(''); setSalvando(true);
    try {
      if (!contaId) throw new Error('Entre na sua conta antes de restaurar um backup.');
      if (typeof onAplicar !== 'function') throw new Error('Restauração indisponível: não foi possível confirmar o salvamento.');
      if (copiaAnteriorRef.current && copiaAnteriorRef.current.contaId !== contaId) throw new Error('A conta mudou. Feche a prévia e abra o backup novamente.');
      if (!copiaAnteriorRef.current) {
        const copiaAnterior = criarBackupVersionado(turmasAtuais);
        localStorage.setItem(`diario_backup_anterior_${contaId}`, JSON.stringify(copiaAnterior));
        copiaAnteriorRef.current = { contaId };
        window.dispatchEvent(new Event('diario-backup-atualizado'));
      }
      await onAplicar(plano.turmas, { origem: 'backup', modo });
      onClose();
    } catch (error) { setErro(error.message || 'Não foi possível salvar a restauração. Tente novamente.'); }
    finally { setSalvando(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/50 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="titulo-restaurar" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl text-[#101942]">
        <h2 id="titulo-restaurar" className="text-xl font-bold">Restaurar backup do Diário</h2>
        <p className="text-sm text-slate-600 mt-2">Esta ação restaura dados do Diário. Para cadastrar nomes de alunos, use “Importar alunos” dentro da turma.</p>
        {plano && <>
          <table className="w-full text-sm my-5 text-left">
            <caption className="text-left font-bold mb-2">Prévia de todas as turmas desta conta</caption>
            <thead><tr><th>Dados</th><th>Atuais</th><th>No arquivo</th><th>Após restaurar</th></tr></thead>
            <tbody>{['turmas', 'alunos', 'notas'].map(campo => <tr key={campo}><th className="capitalize py-1">{campo}</th><td>{plano.resumo.atual[campo]}</td><td>{plano.resumo.recebido[campo]}</td><td>{plano.resumo.resultado[campo]}</td></tr>)}</tbody>
          </table>
          <fieldset disabled={salvando} className="space-y-3 mb-4">
            <legend className="font-bold mb-2">Escolha como restaurar</legend>
            <label className="block"><input type="radio" name="restaurar-modo" value="mesclar" checked={modo === 'mesclar'} onChange={() => setModo('mesclar')} /> Mesclar: acrescentar dados, preservando valores atuais em conflitos.</label>
            <label className="block"><input type="radio" name="restaurar-modo" value="substituir" checked={modo === 'substituir'} onChange={() => setModo('substituir')} /> Substituir: trocar todas as turmas desta conta pelos dados do arquivo, incluindo outros anos e turmas arquivadas.</label>
          </fieldset>
          {modo === 'mesclar' && plano.conflitos.length > 0 && <div className="rounded-xl bg-amber-50 p-3 text-sm mb-4"><p className="font-bold">{plano.conflitos.length} conflitos: os valores atuais serão mantidos.</p><details><summary>Ver campos preservados</summary><ul className="list-disc pl-5 break-all">{plano.conflitos.slice(0, 40).map((conflito, index) => <li key={`${conflito}-${index}`}>{conflito}</li>)}</ul>{plano.conflitos.length > 40 && <p>Mostrando os primeiros 40 campos.</p>}</details></div>}
          <p className="text-sm text-slate-600 mb-4">Uma cópia anterior será guardada neste navegador, somente nesta conta, antes da restauração. A conclusão aguarda o salvamento na nuvem.</p>
        </>}
        {(erro || erroValidacao) && <p role="alert" className="text-red-700 bg-red-50 rounded-xl p-3 mb-4">{erro || erroValidacao}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={salvando} onClick={onClose} className="rounded-xl border px-4 py-2">Cancelar</button><button type="button" disabled={!modo || !plano || salvando} onClick={aplicar} className="rounded-xl bg-[#f60c49] px-4 py-2 text-white disabled:opacity-40">{salvando ? 'Salvando na nuvem…' : 'Restaurar backup'}</button></div>
      </section>
    </div>
  );
}
