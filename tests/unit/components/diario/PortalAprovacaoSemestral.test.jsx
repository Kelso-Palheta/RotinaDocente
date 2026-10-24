import { render, screen, within, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks=vi.hoisted(()=>({router:{push:vi.fn(),replace:vi.fn()},pdf:vi.fn()}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>mocks.router}));
vi.mock('@/lib/firebase-aluno',()=>({}));
vi.mock('@/lib/aluno/boletim-pdf',()=>({generateBoletimPDF:mocks.pdf}));
import AlunoNotasPage from '@/app/aluno/notas/page';
afterEach(()=>{vi.unstubAllGlobals();sessionStorage.clear();});
test.each([[5,5,null,null,'Aprovado','Em andamento'],[5,5,5,5,'Aprovado','Aprovado'],[0,0,null,null,'Recuperação','Em andamento']])('Portal classifica %j/%s/%s/%s',async(n1,n2,n3,n4,semestral,anual)=>{
 sessionStorage.setItem('aluno_login',JSON.stringify({nome:'Ana Exemplo',alunoId:'a',turmaId:'t',professorUid:'p'}));
 const bimestres=Object.fromEntries([n1,n2,n3,n4].map((n,i)=>[i+1,{atividades:[],notas:{a:{simulado:n}}}]));
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({notas:{bimestres}})}));
 render(<AlunoNotasPage/>);
 await screen.findByText('Ana Exemplo');
 expect(within(screen.getByLabelText('Situação do 1º semestre')).getByText(semestral)).toBeInTheDocument();
 expect(within(screen.getByLabelText('Situação anual')).getByText(anual)).toBeInTheDocument();
 fireEvent.click(screen.getByText('Baixar Boletim'));
 expect(mocks.pdf).toHaveBeenLastCalledWith(expect.objectContaining({S1:expect.objectContaining({status:semestral==='Aprovado'?'good':'bad'})}));
});
test('Portal aplica a recuperação publicada no total e na aprovação semestral',async()=>{
 sessionStorage.setItem('aluno_login',JSON.stringify({nome:'Ana Exemplo',alunoId:'a',turmaId:'t',professorUid:'p'}));
 const bimestres={1:{atividades:[],notas:{a:{simulado:4}}},2:{atividades:[],notas:{a:{simulado:5}}}};
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({notas:{bimestres,recuperacao:{rec1:5}}})}));
 render(<AlunoNotasPage/>);
 await screen.findByText('Ana Exemplo');
 const semestre=within(screen.getByLabelText('Situação do 1º semestre'));
 expect(semestre.getByText('25,00')).toBeInTheDocument();
 expect(semestre.getByText('Aprovado')).toBeInTheDocument();
});
