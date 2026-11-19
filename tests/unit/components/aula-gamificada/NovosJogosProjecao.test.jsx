import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const dados = vi.hoisted(() => ({ estado:null }));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p1'},loading:false})}));
vi.mock('@/lib/firebase',()=>({auth:{currentUser:{uid:'p1',getIdToken:async()=> 'token'}}}));
vi.mock('@/components/aula-gamificada/useSalaGamificada',()=>({useCronometroServidor:()=>0,useSalaGamificada:()=>({estado:dados.estado,conexao:'conectado',erro:null,ocupado:false,reconectar:vi.fn(),enviarComando:vi.fn()})}));
import { SalaDocenteView } from '@/components/aula-gamificada/SalaDocenteView';
afterEach(cleanup);
it('telão exibe resposta-modelo somente depois da revelação',()=>{
 dados.estado={codigo:'NOV001',modalidade:'acerte_perde',titulo:'Ciências',fase:'feedback',rodada:1,totalRodadas:1,revelado:false,questao:{id:'q1',tipo:'resposta_aberta',enunciado:'Explique a fotossíntese.'}};
 const {rerender}=render(<SalaDocenteView codigo="NOV001" projecao />);
 expect(screen.queryByText('A luz fornece energia para produzir glicose.')).toBeNull();
 dados.estado={...dados.estado,revelado:true,feedback:{respostaCorreta:'A luz fornece energia para produzir glicose.',explicacao:'Energia luminosa vira energia química.'}};
 rerender(<SalaDocenteView codigo="NOV001" projecao />);
 expect(screen.getByText('A luz fornece energia para produzir glicose.')).toBeTruthy();
});
