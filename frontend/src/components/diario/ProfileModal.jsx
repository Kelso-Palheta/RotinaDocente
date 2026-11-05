"use client";

import { useState } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function ProfileModal({ user, onClose, onOpenAIModal }) {
  const [nome, setNome] = useState(user?.displayName || '');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  const hasGoogle = user?.providerData?.some(p => p.providerId === 'google.com');
  const hasPwd = user?.providerData?.some(p => p.providerId === 'password');

  const flash = (text, type = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  const handleSaveNome = async () => {
    if (!nome.trim() || nome.trim() === (user?.displayName || '')) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: nome.trim() });
      flash('Nome atualizado!');
    } catch (err) {
      flash(err?.message || 'Erro ao salvar.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!senhaNova) return;
    if (senhaNova.length < 6) {
      flash('A senha deve ter pelo menos 6 caracteres.', 'err');
      return;
    }
    if (senhaNova !== confirmarSenha) {
      flash('As senhas não coincidem.', 'err');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(auth.currentUser, senhaNova);
      flash('Senha atualizada com sucesso!');
      setSenhaNova('');
      setConfirmarSenha('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        flash('Por segurança, saia da conta e entre novamente antes de trocar a senha.', 'err');
      } else {
        flash(err.message || 'Erro ao atualizar senha.', 'err');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-[#E2D9F7] rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-[#E2D9F7] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#25104A] tracking-tight">Meu Perfil</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-[#5B4B86] transition-colors p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {msg.text && (
            <div className={`text-xs font-medium px-3 py-2 rounded-lg border ${msg.type === 'err' ? 'bg-[#F3EDFF] text-[#6315D9] border-[#E2D9F7]' : 'bg-[#F3EDFF] text-[#6315D9] border-[#E2D9F7]'}`}>
              {msg.text}
            </div>
          )}

          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-2xl border border-[#e2d9f7]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#f3edff] border border-[#e7dbfd] flex items-center justify-center text-[#5411b8] text-xl font-extrabold shadow-sm">
                {user.displayName?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#25104A] truncate">{user?.displayName || 'Sem nome'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              <div className="flex gap-1.5 mt-1.5">
                {hasGoogle && <span className="px-2 py-0.5 bg-[#F3EDFF] text-[#6315D9] border border-[#E2D9F7] rounded-full text-[10px] font-semibold">Google</span>}
                {hasPwd && <span className="px-2 py-0.5 bg-[#F3EDFF] text-[#6315D9] border border-[#E2D9F7] rounded-full text-[10px] font-semibold">Senha</span>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nome de exibição</label>
              <div className="flex gap-2">
                <input
                  type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome"
                  className="flex-1 px-3.5 py-2.5 bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl text-sm text-[#25104A] placeholder-[#6E5F94] outline-none focus:bg-white focus:ring-2 focus:ring-[#6315D9]/50 transition-all"
                />
                <button
                  onClick={handleSaveNome} disabled={saving || nome.trim() === (user?.displayName || '')}
                  className="px-4 py-2 bg-[#6315D9] hover:bg-[#5411B8] disabled:bg-[#E2D9F7] disabled:text-slate-400 rounded-xl text-white text-xs font-semibold transition-all whitespace-nowrap"
                >
                  Salvar
                </button>
              </div>
            </div>

            {hasPwd && (
              <div className="pt-4 border-t border-[#F3EDFF] space-y-3">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Trocar Senha</label>
                <div>
                  <input
                    type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} placeholder="Nova senha (min. 6 caracteres)"
                    className="w-full px-3.5 py-2.5 bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl text-sm text-[#25104A] placeholder-[#6E5F94] outline-none focus:bg-white focus:ring-2 focus:ring-[#6315D9]/50 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Confirmar nova senha"
                    className="flex-1 px-3.5 py-2.5 bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl text-sm text-[#25104A] placeholder-[#6E5F94] outline-none focus:bg-white focus:ring-2 focus:ring-[#6315D9]/50 transition-all"
                  />
                  <button
                    onClick={handleUpdatePassword} disabled={saving || !senhaNova || !confirmarSenha}
                    className="px-4 py-2 bg-[#6315D9] hover:bg-[#5411B8] disabled:bg-[#E2D9F7] disabled:text-slate-400 rounded-xl text-white text-xs font-semibold transition-all whitespace-nowrap"
                  >
                    Alterar Senha
                  </button>
                </div>
              </div>
            )}

            {onOpenAIModal && (
              <div className="pt-4 border-t border-[#F3EDFF] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#25104A]">Chave de Inteligência Artificial</p>
                  <p className="text-[11px] text-slate-400">Gerenciar sua própria API (Gemini, OpenAI, etc.)</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAIModal}
                  className="px-3.5 py-2 bg-[#6315d9]/10 hover:bg-[#6315d9]/20 text-[#6315d9] border border-[#6315d9]/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Configurar IA
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  </div>
  );
}
