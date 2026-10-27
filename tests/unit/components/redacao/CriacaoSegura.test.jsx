/** Evidência histórica: Firestore simulado, sem conexões externas. */
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,waitFor,cleanup,screen,fireEvent} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
const m=vi.hoisted(()=>({
 user:{uid:'prof-ficticio',displayName:'Professor Teste'},
 perfil:{nome:'Professor Teste',modulos_permitidos:['redacao-corretor']},
 save:vi.fn(),setDoc:vi.fn().mockResolvedValue(undefined),deleteDoc:vi.fn().mockResolvedValue(undefined),
 turma:{id:'turma-a',nome:'101',alunos:[{id:'aluno-a',nome:'Maria Teste',dataNascimento:'1503'}],bimestres:{}},
}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:m.user,perfil:m.perfil,loading:false})}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({replace:vi.fn(),push:vi.fn()}),usePathname:()=>'/redacao'}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/lib/redacao/pdf-generator',()=>({generatePDF:vi.fn()}));
vi.mock('@/utils/atividades/pdfExtractor',()=>({extractTextFromPDF:vi.fn()}));
vi.mock('@/utils/atividades/docxExtractor',()=>({extractTextFromDocx:vi.fn()}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({
 doc:(_db,...segments)=>segments.join('/'),collection:(_db,...segments)=>segments.join('/'),
 query:(p)=>p,where:vi.fn(),serverTimestamp:()=>({seconds:1}),setDoc:m.setDoc,deleteDoc:m.deleteDoc,
 getDoc:async path=>({exists:()=>true,data:()=>path.endsWith('turmas/data')?{turmas:[m.turma],lastUpdated:1,revision:99}:{}}),
 getDocs:async()=>({docs:['antiga-a','antiga-b'].map((id,i)=>({id,data:()=>({id,studentName:'Maria Teste',studentClass:'101',userId:m.user.uid,bimestre:i+1,result:'Feedback fictício',totalScore:600})}))})
}));
vi.mock('@/hooks/diario/usePersistenciaDiario',()=>({usePersistenciaDiario:()=>({turmas:[m.turma],carregando:false,erro:'',tentarNovamente:vi.fn()})}));
vi.mock('@/lib/redacao/repositorio',()=>({salvarRedacao:m.save}));
vi.mock('@/components/redacao/RevisaoRedacao',()=>({default:()=> <div>Revisão docente disponível</div>}));
vi.mock('@/utils/aiHeaders',()=>({getClientAIHeaders:()=>({'x-user-ai-key':'ficticia','x-user-ai-provider':'gemini'})}));
vi.mock('@/utils/atividades/visionExtractor',()=>({extractTextFromImageVision:async()=> 'Transcrição de imagem fictícia.',getMediaTypeFromDataUrl:()=> 'image/png',extractTextFromPDFWithVision:async()=> 'Texto digital de PDF fictício.'}));
import Correcao from '@/app/redacao/page';
afterEach(()=>{m.user.uid='prof-ficticio';localStorage.clear();cleanup();sessionStorage.clear();vi.clearAllMocks();vi.unstubAllGlobals();});
it('abrir módulo não escreve cache antigo nas turmas da nuvem',async()=>{
 sessionStorage.setItem('diario_userId',m.user.uid);
 sessionStorage.setItem('diario_turmas',JSON.stringify([{...m.turma,nome:'Cache antigo'}]));
 sessionStorage.setItem('diario_turmas_lastUpdated','100');
 render(<Correcao/>);
 await waitFor(()=>expect(document.body.textContent).toContain('Redação'));
 expect(m.setDoc).not.toHaveBeenCalled();
});

it('oferece correção manual e informa fluxo sem publicação automática',async()=>{
 render(<Correcao/>);
 await waitFor(()=>expect(document.body.textContent).toContain('Corrigir manualmente'));
 expect(document.body.textContent).toContain('publicação');
});

const preencher=()=>{
 fireEvent.change(screen.getByLabelText('Nome do aluno'),{target:{value:'Estudante Avulso'}});
 fireEvent.change(screen.getByLabelText('Texto original / transcrição'),{target:{value:'Texto original fictício a ser avaliado.'}});
 fireEvent.click(screen.getByText('Conferi o texto'));
};
it('falha ao salvar conserva resultado e repete somente gravação com mesmo ID',async()=>{
 const scores={items:[1,2,3,4,5].map(i=>({subject:`C${i}`,A:120,fullMark:200})),total:600,modo:'completa'};
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({result:'Feedback fictício da IA',scores})});vi.stubGlobal('fetch',fetchMock);
 m.save.mockRejectedValueOnce(new Error('offline')).mockImplementation(async(uid,id,data)=>({...data,revision:1}));
 render(<Correcao/>);await screen.findByLabelText('Nome do aluno');preencher();
 fireEvent.click(screen.getByRole('button',{name:'Corrigir com IA'}));
 await screen.findByRole('button',{name:'Tentar salvar novamente'});
 expect(screen.getByText('Feedback fictício da IA')).toBeInTheDocument();
 const id=m.save.mock.calls[0][1];
 fireEvent.click(screen.getByRole('button',{name:'Tentar salvar novamente'}));
 await screen.findByText('Revisão docente disponível');
 expect(fetchMock).toHaveBeenCalledTimes(1);expect(m.save).toHaveBeenCalledTimes(2);expect(m.save.mock.calls[1][1]).toBe(id);
 expect(m.save.mock.calls[1][2]).toMatchObject({schemaVersion:2,originalText:'Texto original fictício a ser avaliado.',status:'corrigido',alunoId:null,turmaId:null,rubricaVersao:'enem-pedagogica-v2'});
});
it('correção manual salva notas e devolutiva sem requisitar IA',async()=>{
 const f=vi.fn();vi.stubGlobal('fetch',f);m.save.mockImplementation(async(uid,id,data)=>({...data,revision:1}));
 render(<Correcao/>);await screen.findByLabelText('Nome do aluno');preencher();
 fireEvent.click(screen.getByRole('button',{name:'Corrigir manualmente'}));
 for(let i=1;i<=5;i++)fireEvent.change(screen.getByLabelText(`Nota C${i}`),{target:{value:'160'}});
 fireEvent.change(screen.getByLabelText('Devolutiva e justificativas por competência'),{target:{value:'C1 a C5: justificativas e sugestões do professor.'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar correção manual'}));
 await screen.findByText('Revisão docente disponível');expect(f).not.toHaveBeenCalled();
 expect(m.save.mock.calls[0][2]).toMatchObject({metodoCorrecao:'manual',totalScore:800,modo:'completa'});
});
it('troca de conta não restaura texto nem resultado da conta anterior',async()=>{
 const view=render(<Correcao/>);await screen.findByLabelText('Nome do aluno');preencher();
 await waitFor(()=>expect(localStorage.getItem('redacao_rascunho_v2_prof-ficticio')).toContain('Texto original fictício'));
 m.user={...m.user,uid:'outra-conta'};view.rerender(<Correcao/>);
 await waitFor(()=>expect(screen.getByLabelText('Texto original / transcrição')).toHaveValue(''));
 expect(screen.queryByText('Recuperar rascunho')).not.toBeInTheDocument();
});
it('troca explícita de turma guarda rascunho anterior e inicia texto vazio',async()=>{
 vi.spyOn(window,'confirm').mockReturnValue(true);
 render(<Correcao/>);await screen.findByLabelText('Nome do aluno');preencher();
 fireEvent.change(screen.getByLabelText('Turma'),{target:{value:'turma-a'}});
 expect(screen.getByLabelText('Texto original / transcrição')).toHaveValue('');
 expect(localStorage.getItem('redacao_rascunho_v2_prof-ficticio:contexto:avulsa')).toContain('Texto original fictício');
});

it('trocar imagem por PDF remove a referência visual anterior',async()=>{
 render(<Correcao/>);await screen.findByLabelText('Nome do aluno');
 fireEvent.change(screen.getByLabelText('Enviar redação'),{target:{files:[new File(['pixel'],'fonte.png',{type:'image/png'})]}});
 await screen.findByAltText('Fonte original da redação; ampliar para conferir');
 await waitFor(()=>expect(screen.getByLabelText('Texto original / transcrição')).toHaveValue('Transcrição de imagem fictícia.'));
 fireEvent.change(screen.getByLabelText('Enviar redação'),{target:{files:[new File(['pdf'],'novo.pdf',{type:'application/pdf'})]}});
 await waitFor(()=>expect(screen.getByLabelText('Texto original / transcrição')).toHaveValue('Texto digital de PDF fictício.'));
 expect(screen.queryByAltText('Fonte original da redação; ampliar para conferir')).not.toBeInTheDocument();
});
it('falha ao limpar cache não transforma gravação confirmada em falha na nuvem',async()=>{
 const scores={items:[1,2,3,4,5].map(i=>({subject:`C${i}`,A:120,fullMark:200})),total:600,modo:'completa'};
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({result:'Feedback válido',scores})}));m.save.mockImplementation(async(uid,id,data)=>({...data,revision:1}));
 render(<Correcao/>);await screen.findByLabelText('Nome do aluno');preencher();
 vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw new Error('Bloqueado');});
 fireEvent.click(screen.getByRole('button',{name:'Corrigir com IA'}));
 await screen.findByText('Revisão docente disponível');
 expect(screen.queryByRole('button',{name:'Tentar salvar novamente'})).not.toBeInTheDocument();
 expect(screen.getByText('Salvo no histórico. Revise antes da publicação.')).toBeInTheDocument();
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
