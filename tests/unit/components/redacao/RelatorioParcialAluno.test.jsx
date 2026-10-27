import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi,afterEach} from 'vitest';
const m=vi.hoisted(()=>({pdf:vi.fn()}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useParams:()=>({id:'r-parcial'})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/lib/redacao/pdf-generator',()=>({generatePDF:m.pdf}));
import Relatorio from '@/app/redacao/aluno/[id]/page';
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();});
test('relatório parcial identifica competências reais e mantém contexto no PDF',async()=>{
 const correction={id:'r-parcial',studentName:'Maria',studentClass:'101',essayTheme:'Tema parcial',result:'Comentários docentes',scoreData:[{subject:'C3',A:120},{subject:'C5',A:160}],totalScore:null,modo:'parcial',createdAt:'2026-10-01T12:00:00Z'};
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({correction})}));
 render(<Relatorio/>);await screen.findByText('Tema parcial');
 expect(screen.getByText('C3')).toBeInTheDocument();expect(screen.getByText('C5')).toBeInTheDocument();
 expect(screen.getByText(/Avaliação parcial/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:/PDF/}));
 expect(m.pdf).toHaveBeenLastCalledWith(correction.result,correction.studentName,correction.studentClass,correction.essayTheme,correction.scoreData,correction);
});
