'use client';

import React from 'react';
import { useAudiovisualSala } from '../audiovisual/ProvedorAudiovisualSala';

const CORES = ['#00DDEB', '#FFE500', '#FF2C9C', '#B9EF00', '#A978FF'];
const NADADORES = ['image4.webp', 'image5.webp', 'image6.webp'];

/** A posição sempre vem do servidor; animação nunca concede avanço. */
export function JogoNatacao({ estado, euId }) {
  const audiovisual = useAudiovisualSala();
  const raias = estado?.raias || [];
  const vencedores = estado?.vencedoresIds || [];
  const trechos = estado?.totalTrechos || 5;
  return (
    <section aria-label="Corrida de natação" className="overflow-hidden rounded-3xl border-4 border-[#00DDEB] bg-[#083C68] text-white shadow-xl">
      <header className="flex flex-wrap justify-between items-center gap-2 bg-[#25104A] px-4 py-3">
        <h2 className="font-black text-xl sm:text-3xl">🏊 Game Splash</h2>
        <span className="rounded-full bg-[#FFE500] px-3 py-1 text-xs font-black text-[#25104A]">{trechos} trechos até a chegada</span>
      </header>
      {vencedores.length > 0 && <div role="status" className="bg-[#FFE500] p-3 text-center font-black text-[#25104A]">🏅 {vencedores.length > 1 ? 'Chegada compartilhada!' : 'Chegada!'} {raias.filter(r => vencedores.includes(r.id)).map(r => r.nome).join(' · ')}</div>}
      <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-5 space-y-3">
        {raias.length === 0 && <p className="p-6 text-center">Nadadores se preparando para largar.</p>}
        {raias.map((raia, i) => (
          <div key={raia.id} className={`rounded-xl p-2 ${raia.id === euId ? 'ring-2 ring-[#FFE500]' : ''}`}>
            <div className="flex justify-between text-xs sm:text-sm font-bold mb-2"><span>{raia.nome}</span><span>{Number(raia.progresso).toLocaleString('pt-BR', { maximumFractionDigits:2 })} / {trechos}</span></div>
            <div className="relative h-20 sm:h-28 rounded-lg border-y-4 overflow-hidden bg-cover bg-center" style={{ borderColor: CORES[i % CORES.length], backgroundImage:'linear-gradient(90deg,#007DAD99,#00DDEB44),url(/aula-gamificada/natacao/agua.webp)' }}>
              <div aria-hidden="true" className="absolute inset-0 opacity-40" style={{backgroundImage:'repeating-linear-gradient(90deg,transparent 0,transparent calc(20% - 2px),white calc(20% - 2px),white 20%)'}} />
              <div className="absolute inset-y-0 right-0 w-4 border-l-4 border-dashed border-white bg-[#25104A]/70" />
              <div className="absolute top-0 bottom-0 w-24 sm:w-36 flex items-center justify-center transition-[left,transform] duration-[1400ms] ease-out motion-reduce:transition-none" style={{transitionDuration: audiovisual?.reduzirAnimacao ? '0ms' : undefined, left:`${Math.min(1, raia.progresso / trechos) * 100}%`, transform:`translateX(-${Math.min(1, raia.progresso / trechos) * 100}%)`}}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/aula-gamificada/natacao/${NADADORES[i % NADADORES.length]}`} alt="" className="w-full h-full object-contain -scale-x-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="px-4 pb-3 text-xs text-cyan-100">O avanço é confirmado ao revelar cada rodada. Empates compartilham a colocação.</p>
    </section>
  );
}
