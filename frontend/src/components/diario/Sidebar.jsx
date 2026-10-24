"use client";

import { useState, useRef, useSyncExternalStore } from 'react';
import { calcTotal, round2, temNota } from '@/utils/diario/calculos';
import { estiloNotaBimestral } from '@/utils/diario/coresNota';
import { criarBackupVersionado, deserializarBackupTurmas } from '@/dominio/diario/backupTurmas';
import { RestaurarBackupModal } from './RestaurarBackupModal';

const BIMESTRES = [1, 2, 3, 4];
const observarCopias = (avisar) => {
  window.addEventListener('storage', avisar);
  window.addEventListener('diario-backup-atualizado', avisar);
  return () => { window.removeEventListener('storage', avisar); window.removeEventListener('diario-backup-atualizado', avisar); };
};

const mediaTurma = (turma, bimestre) => {
  const b = turma.bimestres[String(bimestre)];
  if (!b) return null;
  const { atividades, notas, config } = b;
  const totais = turma.alunos
    .filter((al) => temNota(notas[al.id], atividades))
    .map((al) => {
      const nota = notas[al.id] || {};
      return calcTotal(nota.simulado, atividades, nota, config);
    });
  if (!totais.length) return null;
  return round2(totais.reduce((a, x) => a + x, 0) / totais.length);
};

const MediaBadge = ({ value, config }) => {
  if (value === null) return <span className="text-slate-400 text-xs font-mono">&mdash;</span>;
  const color = estiloNotaBimestral(value, config).split(' ')[0];
  return <span className={`font-mono text-xs font-semibold ${color}`}>{value.toFixed(2).replace('.', ',')}</span>;
};

export const Sidebar = ({
  turmas,
  backupTurmas,
  turmaSelecionada,
  bimestreSelecionado,
  user,
  onSelectTurma,
  onSelectBimestre,
  onAddTurma,
  onRemoveTurma,
  onReorderTurmas,
  onImportTurmas,
  onLogout,
  onOpenProfile,
  onClose
}) => {
  const [novaTurma, setNovaTurma] = useState('');
  const fileInputRef = useRef(null);
  const [backup, setBackup] = useState(null);
  const [mensagemBackup, setMensagemBackup] = useState('');
  const [erroBackup, setErroBackup] = useState('');
  const todasTurmas = backupTurmas || turmas;
  const chaveCopiaAnterior = user?.uid ? `diario_backup_anterior_${user.uid}` : null;
  const copiaDisponivel = useSyncExternalStore(observarCopias, () => {
    try { return Boolean(chaveCopiaAnterior && typeof window !== 'undefined' && localStorage.getItem(chaveCopiaAnterior)); }
    catch { return false; }
  }, () => false);

  const baixarBackup = (conteudo, prefixo = 'backup-diario') => {
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(conteudo, null, 2));
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${prefixo}-${new Date().toISOString().slice(0, 10)}.json`);
    linkElement.click();
  };

  const handleExport = () => {
    try {
      baixarBackup(criarBackupVersionado(todasTurmas));
      setErroBackup('');
    } catch (err) {
      setErroBackup('Erro ao exportar backup: ' + err.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setErroBackup(''); setMensagemBackup('');
    if (file.size > 20 * 1024 * 1024) {
      setErroBackup('O backup deve ter no máximo 20 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setBackup(deserializarBackupTurmas(event.target.result));
      } catch (err) {
        setErroBackup('Erro ao ler backup: ' + err.message);
      }
    };
    reader.onerror = () => setErroBackup('Não foi possível ler o arquivo. Selecione-o novamente.');
    reader.readAsText(file);
  };

  const aplicarBackup = async (resultado, metadados) => {
    if (typeof onImportTurmas !== 'function') throw new Error('Restauração indisponível: salvamento não conectado.');
    await onImportTurmas(resultado, metadados);
    setMensagemBackup('Backup restaurado e salvo na nuvem.');
  };

  const baixarCopiaAnterior = () => {
    try {
      if (!chaveCopiaAnterior) throw new Error('Entre na sua conta para acessar a cópia.');
      const copia = JSON.parse(localStorage.getItem(chaveCopiaAnterior));
      deserializarBackupTurmas(copia);
      baixarBackup(copia, 'diario-antes-da-restauracao');
    } catch (error) { setErroBackup(error.message); }
  };

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDrop = (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const reordered = [...turmas];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, removed);
    onReorderTurmas(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const submit = () => {
    const nome = novaTurma.trim();
    if (!nome) return;
    onAddTurma(nome);
    setNovaTurma('');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-[#dce0f0] flex flex-col h-full overflow-hidden font-sans">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-[#dce0f0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f60c49] flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
              </svg>
            </div>
            <div>
              <span className="font-head font-extrabold text-[#101942] tracking-tight text-sm block leading-none">
                Diário Pedagógico
              </span>
              <span className="text-[10px] text-[#6070a0] font-medium">Gestão de Turmas</span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-[#6070a0] hover:text-[#101942] hover:bg-[#eef0f8] transition-all" aria-label="Fechar menu">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Bimestre selector */}
      <div className="px-4 py-4 border-b border-[#dce0f0] bg-[#f7f8fc]/60">
        <p className="text-[10px] text-[#6070a0] uppercase tracking-wider mb-2 font-bold font-head">Bimestre Letivo</p>
        <div className="grid grid-cols-4 gap-1.5">
          {BIMESTRES.map((b) => (
            <button
              key={b}
              onClick={() => onSelectBimestre(b)}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border
                ${bimestreSelecionado === b
                  ? 'bg-[#101942] text-white border-[#101942] shadow-xs'
                  : 'bg-white text-[#6070a0] hover:bg-[#eef0f8] hover:text-[#101942] border-[#dce0f0]'}`}
            >
              {b}º
            </button>
          ))}
        </div>
      </div>

      {/* Turmas list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[10px] text-[#6070a0] uppercase tracking-wider mb-2.5 px-1 font-bold font-head">Turmas Cadastradas</p>
        {turmas.map((turma, index) => {
          const media = mediaTurma(turma, bimestreSelecionado);
          const ativa = turmaSelecionada?.id === turma.id;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={turma.id}
              className={`group relative transition-all duration-200 ${isDragging ? 'opacity-40' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => handleDrop(index)}
            >
              {isDragOver && !isDragging && (
                <div className={`absolute left-0 right-0 h-0.5 bg-[#f60c49] z-10 ${draggedIndex > index ? 'top-0' : 'bottom-0'}`} />
              )}
              <button
                onClick={() => onSelectTurma(turma)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 border
                  ${ativa
                    ? 'bg-[#fff2f6] border-l-4 border-l-[#f60c49] border-[#fde4ec] shadow-2xs'
                    : 'hover:bg-[#f7f8fc] text-[#101942] border-transparent'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#9098c0] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity select-none font-mono text-xs w-3 text-center" title="Arrastar para reordenar">⠿</span>
                  <span className={`font-semibold text-sm ${ativa ? 'text-[#d40840] font-bold' : 'text-[#101942]'}`}>
                    {turma.nome}
                  </span>
                  <span className="text-xs text-[#9098c0] font-mono">({turma.alunos.length})</span>
                </div>
                <MediaBadge value={media} config={turma.bimestres[String(bimestreSelecionado)]?.config} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Backup */}
      <div className="px-3 py-3 border-t border-[#dce0f0] bg-[#f7f8fc]/40">
        <p className="text-[10px] text-[#6070a0] uppercase tracking-wider mb-2 font-bold">Backup e restauração</p>
        <div className="flex gap-2">
        <button onClick={handleExport} className="flex-1 py-2 bg-white hover:bg-[#fff2f6] border border-[#dce0f0] hover:border-[#fde4ec] rounded-xl text-[10px] uppercase tracking-wider font-bold text-[#6070a0] hover:text-[#d40840] transition-all text-center">
          Baixar backup
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-white hover:bg-[#fff2f6] border border-[#dce0f0] hover:border-[#fde4ec] rounded-xl text-[10px] uppercase tracking-wider font-bold text-[#6070a0] hover:text-[#d40840] transition-all text-center">
          Restaurar backup
        </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" aria-label="Arquivo de backup do Diário" className="hidden" onChange={handleImport} />
        {copiaDisponivel && <button onClick={baixarCopiaAnterior} className="text-xs underline mt-2 text-[#6070a0]">Baixar cópia anterior</button>}
        {mensagemBackup && <p role="status" className="text-xs text-emerald-700 mt-2">{mensagemBackup}</p>}
        {erroBackup && <p role="alert" className="text-xs text-red-700 mt-2">{erroBackup}</p>}
      </div>
      {backup && <RestaurarBackupModal turmasAtuais={todasTurmas} backup={backup} contaId={user?.uid} onAplicar={aplicarBackup} onClose={() => setBackup(null)} />}

      {/* Add turma */}
      <div className="px-3 py-4 border-t border-[#dce0f0]">
        <div className="flex gap-2">
          <input
            value={novaTurma}
            onChange={(e) => setNovaTurma(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Nome da nova turma…"
            className="flex-1 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-sm text-[#101942] placeholder-[#9098c0] outline-none focus:bg-white focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all"
          />
          <button
            onClick={submit}
            className="px-3.5 py-2 btn-brand-primary rounded-xl text-white text-sm font-bold shadow-xs"
          >
            +
          </button>
        </div>
      </div>

      {/* User */}
      {user && (
        <div className="px-3 py-3 border-t border-[#dce0f0] bg-[#f7f8fc]">
          <div className="flex items-center gap-2.5">
            <button onClick={onOpenProfile} className="flex flex-1 items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity outline-none" title="Meu Perfil">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-[#dce0f0]" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#fde4ec] flex items-center justify-center text-[#d40840] text-xs font-bold flex-shrink-0">
                  {user.displayName?.[0] || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#101942] truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-[10px] text-[#6070a0] truncate">{user.email}</p>
              </div>
            </button>
            <button onClick={onLogout} className="text-[#6070a0] hover:text-[#f60c49] text-xs transition-colors p-1 flex-shrink-0" title="Sair">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
