import React from 'react';
import { act, cleanup, renderHook, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useEtapaExplicativa } from '@/components/revisao/useEtapaExplicativa';
import { MecanismoVisual } from '@/components/revisao/MecanismoVisual';
afterEach(()=>{cleanup();vi.useRealTimers();});
it('interpola etapa sincronizada, limita última e respeita pausa ou troca de bloco',()=>{
 vi.useFakeTimers();
 const initial={etapa:0,totalEtapas:4,automatica:true,agoraServidorMs:1000,iniciadaEmMs:1000,etapaBase:0,intervaloMs:8000};
 const {result,rerender,unmount}=renderHook(({p})=>useEtapaExplicativa(p),{initialProps:{p:initial}});
 expect(result.current).toBe(0);
 act(()=>vi.advanceTimersByTime(16000));
 expect(result.current).toBe(2);
 rerender({p:{...initial,etapa:2,etapaBase:2,automatica:false}});
 act(()=>vi.advanceTimersByTime(16000));
 expect(result.current).toBe(2);
 rerender({p:{...initial,etapa:0,etapaBase:0,automatica:false}});
 expect(result.current).toBe(0);
 rerender({p:initial});
 act(()=>vi.advanceTimersByTime(40000));
 expect(result.current).toBe(3);
 unmount();
 expect(vi.getTimerCount()).toBe(0);
});
it('modelos visuais representam conceitos distintos, sem fingir obras documentais',()=>{
 for(const [id,tipo] of [['cubismo-futurismo','perspectivas'],['fotografia','movimento'],['barroco-brasileiro','luz'],['musica-erudita-popular','ritmo'],['arte-digital-tecnologia','camadas']]){
  const {container,unmount}=render(<MecanismoVisual conteudoId={id} etapa={2}/>);
  expect(container.querySelector('[data-mecanismo]').dataset.mecanismo).toBe(tipo);
  expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/modelo didático, etapa 3/);
  unmount();
 }
});
