/** Evidência histórica: Firestore simulado, sem conexões externas. */
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
const m=vi.hoisted(()=>({
 user:{uid:'prof-ficticio',displayName:'Professor Teste'},
 perfil:{nome:'Professor Teste',modulos_permitidos:['redacao-corretor']},
 setDoc:vi.fn().mockResolvedValue(undefined),deleteDoc:vi.fn().mockResolvedValue(undefined),
 turma:{id:'turma-a',nome:'101',alunos:[{id:'aluno-a',nome:'Maria Teste',dataNascimento:'1503'}],bimestres:{}},
}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:m.user,perfil:m.perfil,loading:false})}));
vi.mock('../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({replace:vi.fn(),push:vi.fn()}),usePathname:()=>'/redacao'}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/lib/redacao/pdf-generator',()=>({generatePDF:vi.fn()}));
vi.mock('@/utils/atividades/pdfExtractor',()=>({extractTextFromPDF:vi.fn()}));
vi.mock('@/utils/atividades/docxExtractor',()=>({extractTextFromDocx:vi.fn()}));
vi.mock('../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({
 doc:(_db,...segments)=>segments.join('/'),collection:(_db,...segments)=>segments.join('/'),
 query:(p)=>p,where:vi.fn(),serverTimestamp:()=>({seconds:1}),setDoc:m.setDoc,deleteDoc:m.deleteDoc,
 getDoc:async path=>({exists:()=>true,data:()=>path.endsWith('turmas/data')?{turmas:[m.turma],lastUpdated:1,revision:99}:{}}),
 getDocs:async()=>({docs:['antiga-a','antiga-b'].map((id,i)=>({id,data:()=>({id,studentName:'Maria Teste',studentClass:'101',userId:m.user.uid,bimestre:i+1,result:'Feedback fictício',totalScore:600})}))})
}));
import Desempenho from '@/app/redacao/desempenho/page';
import Correcao from '@/app/redacao/page';
afterEach(()=>{cleanup();sessionStorage.clear();vi.clearAllMocks();vi.unstubAllGlobals();});
it('abrir desempenho migra duas redações para mesma chave e apaga originais',async()=>{
 vi.stubGlobal('crypto',webcrypto);
 render(<Desempenho/>);
 await waitFor(()=>expect(m.deleteDoc).toHaveBeenCalledTimes(2));
 const correcoes=m.setDoc.mock.calls.filter(([p])=>p.includes('/correcoes/'));
 expect(correcoes).toHaveLength(2);
 expect(correcoes[0][0]).toBe(correcoes[1][0]);
 expect(m.deleteDoc.mock.calls.map(([p])=>p)).toContain('professores/prof-ficticio/correcoes/antiga-a');
 expect(m.deleteDoc.mock.calls.map(([p])=>p)).toContain('professores/prof-ficticio/correcoes/antiga-b');
});
it('abrir correção pode gravar cache antigo no Diário sem checar revisão',async()=>{
 sessionStorage.setItem('diario_userId',m.user.uid);
 sessionStorage.setItem('diario_turmas',JSON.stringify([{...m.turma,nome:'Cache antigo'}]));
 sessionStorage.setItem('diario_turmas_lastUpdated','100');
 render(<Correcao/>);
 await waitFor(()=>expect(m.setDoc).toHaveBeenCalledWith('professores/prof-ficticio/turmas/data',expect.objectContaining({turmas:[expect.objectContaining({nome:'Cache antigo'})]}),{merge:true}));
 const payload=m.setDoc.mock.calls.find(([p])=>p.endsWith('/turmas/data'))[1];
 expect(payload).not.toHaveProperty('revision');
});
