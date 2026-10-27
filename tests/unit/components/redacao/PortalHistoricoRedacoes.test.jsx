import { render, screen, within, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks=vi.hoisted(()=>({router:{push:vi.fn(),replace:vi.fn()},pdf:vi.fn()}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>mocks.router}));
vi.mock('@/lib/firebase-aluno',()=>({}));
vi.mock('@/lib/aluno/boletim-pdf',()=>({generateBoletimPDF:mocks.pdf}));
import AlunoNotasPage from '@/app/aluno/notas/page';
afterEach(()=>{vi.unstubAllGlobals();sessionStorage.clear();});
test('Portal conserva todas as redações publicadas e identifica avaliação parcial',async()=>{
 sessionStorage.setItem('aluno_login',JSON.stringify({nome:'Ana Exemplo',alunoId:'a',turmaId:'t',professorUid:'p'}));
 const redacoes=[{id:'r1',essayTheme:'Tema antigo',totalScore:600,bimestre:1},{id:'r2',essayTheme:'Tema recente',totalScore:null,modo:'parcial',bimestre:2}];
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({notas:{},redacao:redacoes[1],redacoes})}));
 render(<AlunoNotasPage/>);
 await screen.findByText('Ana Exemplo');
 expect(screen.getByText('Tema antigo')).toBeInTheDocument();
 expect(screen.getByText('Tema recente')).toBeInTheDocument();
 expect(screen.getByText(/Avaliação parcial/)).toBeInTheDocument();
});
test('falha de leitura de redações aparece como erro com nova tentativa',async()=>{
 sessionStorage.setItem('aluno_login',JSON.stringify({nome:'Ana Exemplo',alunoId:'a',turmaId:'t',professorUid:'p'}));
 const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({notas:{},redacoes:[],falhas:{redacoes:true}})});vi.stubGlobal('fetch',f);
 render(<AlunoNotasPage/>);await screen.findByText('Ana Exemplo');
 expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar as redações');
 fireEvent.click(screen.getByRole('button',{name:'Tentar carregar redações novamente'}));
 await screen.findByText('Ana Exemplo');expect(f).toHaveBeenCalledTimes(2);
});
