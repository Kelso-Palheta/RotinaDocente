import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
const m=vi.hoisted(()=>({user:{uid:'conta-b'},router:{push:vi.fn()},getDoc:vi.fn(),doc:vi.fn((_db,...path)=>path.join('/'))}));
vi.mock('../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>m.router}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:m.user,perfil:{nome:'Professor B'},loading:false})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:m.doc,getDoc:m.getDoc}));
vi.mock('@/lib/analytics/pdf-generator',()=>({generateAnalyticsPDF:vi.fn()}));
vi.mock('@/components/analytics/AnalyticsHeader',()=>({AnalyticsHeader:({turmas})=><p>{turmas.map(t=>t.nome).join(', ')}</p>}));
vi.mock('@/components/analytics/EvolucaoChart',()=>({EvolucaoChart:()=>null}));
vi.mock('@/components/analytics/DistribuicaoChart',()=>({DistribuicaoChart:()=>null}));
vi.mock('@/components/analytics/ComparativoTurmasChart',()=>({ComparativoTurmasChart:()=>null}));
vi.mock('@/components/analytics/MetricCard',()=>({MetricCard:()=>null}));
vi.mock('@/components/analytics/AlunosRiscoTable',()=>({AlunosRiscoTable:()=>null}));
import Analytics from '@/app/analytics/page';
afterEach(()=>{cleanup();sessionStorage.clear();vi.clearAllMocks();vi.restoreAllMocks();});
it('conta B exibe cache de outra conta e consulta caminho antigo',async()=>{
 sessionStorage.setItem('diario_userId','conta-a');sessionStorage.setItem('diario_turmas',JSON.stringify([{id:'a',nome:'Turma privada da conta A',alunos:[],bimestres:{}}]));
 m.getDoc.mockResolvedValue({exists:()=>false});render(<Analytics/>);
 await screen.findByText('Turma privada da conta A');
 expect(m.doc).toHaveBeenCalledWith({},'diario_turmas','conta-b');
});
it('falha de leitura aparece como nenhuma turma cadastrada',async()=>{
 vi.spyOn(console,'warn').mockImplementation(()=>{});m.getDoc.mockRejectedValue(new Error('Offline fictício'));
 render(<Analytics/>);await screen.findByText('Nenhuma turma cadastrada');
});
