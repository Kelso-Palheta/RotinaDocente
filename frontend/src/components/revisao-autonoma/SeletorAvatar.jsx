'use client';
import React from 'react';
import Image from 'next/image';
import { AVATARES_AVENTURA } from '@/dominio/revisao-autonoma/avatares';
export function SeletorAvatar({ valor, onChange, disabled = false }) {
  return <fieldset disabled={disabled} className="rounded-2xl border-2 border-[#E2D9F7] bg-[#FFFDF7] p-4">
    <legend className="px-2 font-black text-[#25104A]">Escolha seu personagem</legend>
    <p className="mb-4 text-sm text-[#5B4B86]">Seu estilo, sua aventura. Todos têm os mesmos movimentos e desafios.</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{AVATARES_AVENTURA.map(a => <label key={a.id} className={`relative cursor-pointer rounded-2xl border-2 p-3 text-center transition focus-within:ring-4 focus-within:ring-[#00DDEB] ${valor===a.id ? 'border-[#6315D9] bg-[#E7DBFD] shadow-md' : 'border-[#E2D9F7] bg-white hover:border-[#6315D9]'}`}>
      <input type="radio" name="avatar-aventura" value={a.id} checked={valor===a.id} onChange={()=>onChange(a.id)} className="absolute left-3 top-3 accent-[#6315D9]" />
      <Image src={a.imagem} alt="" width={64} height={86} unoptimized className="mx-auto h-24 w-20 object-contain" />
      <strong className="mt-2 block text-sm text-[#25104A]">{a.nome}</strong><span className="block text-xs text-[#5B4B86]">{a.papel}</span>
      {valor===a.id && <span aria-hidden="true" className="mt-1 inline-block rounded-full bg-[#6315D9] px-2 text-xs font-bold text-white">Selecionado ✓</span>}
    </label>)}</div>
  </fieldset>;
}
