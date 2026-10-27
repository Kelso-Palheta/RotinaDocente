import React from 'react';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { render,screen,waitFor,fireEvent } from '@testing-library/react';
const m=vi.hoisted(()=>({writes:vi.fn(),getDocs:vi.fn(),getDoc:vi.fn(),revisar:vi.fn(),publicar:vi.fn(),arquivar:vi.fn(),associar:vi.fn()}));
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'p'},loading:false,perfil:{}})}));
vi.mock('../../../../frontend/node_modules/next/navigation.js',()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/infraestrutura/diario/DiarioRepository',()=>({DiarioRepository:class {async carregar(){return{turmas:[{id:'t',nome:'101',anoLetivo:2026,alunos:[{id:'a',nome:'Ana'}]}]};}}}));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs',()=>({doc:(_,...parts)=>parts.join('/'),getDoc:(...a)=>m.getDoc(...a),collection:()=>({}),getDocs:(...a)=>m.getDocs(...a),setDoc:m.writes,deleteDoc:m.writes}));
vi.mock('@/lib/redacao/repositorio',()=>({revisarRedacao:(...a)=>m.revisar(...a),publicarRedacao:(...a)=>m.publicar(...a),arquivarRedacao:(...a)=>m.arquivar(...a),associarContextoRedacao:(...a)=>m.associar(...a)}));
vi.mock('@/utils/diario/loginAluno',async()=>{const real=await vi.importActual('@/utils/diario/loginAluno');return {...real,gerarLoginKey:async login=>`key-${login}`};});
vi.mock('@/lib/redacao/pdf-generator',()=>({generatePDF:vi.fn()}));
import Page from '../../../../frontend/src/app/redacao/desempenho/page';
import AssociarContextoRedacao from '../../../../frontend/src/components/redacao/AssociarContextoRedacao';
import RevisaoRedacao from '../../../../frontend/src/components/redacao/RevisaoRedacao';
const redacao={id:'one',studentName:'Ana',turmaId:'t',studentClass:'101',alunoId:'a',anoLetivo:2026,bimestre:1,status:'corrigido',revision:1,result:'Boa escrita',scoreData:[1,2,3,4,5].map(n=>({subject:`C${n}`,A:160,fullMark:200})),totalScore:800};
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();m.getDoc.mockResolvedValue({exists:()=>false});m.getDocs.mockResolvedValue({docs:[{id:'one',data:()=>({...redacao,id:'forged-id'})},{id:'two',data:()=>({...redacao,id:'other',bimestre:2})}]});});
describe('RN73 histórico e revisão',()=>{
 it('abrir histórico mantém dois documentos sem migrar, excluir ou gravar vínculos',async()=>{
  render(<Page/>);await screen.findByText('2 redações neste recorte');
  expect(m.writes).not.toHaveBeenCalled();expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText('Bimestre'),{target:{value:'1'}});
  await screen.findByText('1 redações neste recorte');
  expect(screen.queryByText('Vincular Correção')).not.toBeInTheDocument();
 });
 it('erro de consulta fica visível e permite repetir',async()=>{
  m.getDocs.mockRejectedValueOnce(new Error('offline'));
  render(<Page/>);await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'Tentar novamente'}));
  await screen.findByText('2 redações neste recorte');expect(m.getDocs).toHaveBeenCalledTimes(2);
 });
 it('revisão manual persiste feedback sem IA e erro conserva editor',async()=>{
  m.revisar.mockRejectedValueOnce(new Error('Falha ao salvar'));
  render(<RevisaoRedacao redacao={redacao} professorUid="p" onSaved={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Devolutiva da revisão'),{target:{value:'Precisa revisar a conclusão'}});
  fireEvent.click(screen.getByRole('button',{name:'Salvar revisão'}));
  await screen.findByText('Falha ao salvar');expect(screen.getByLabelText('Devolutiva da revisão')).toHaveValue('Precisa revisar a conclusão');
  expect(m.revisar).toHaveBeenCalledWith('p','one',expect.objectContaining({result:'Precisa revisar a conclusão'}),1);
 });
});

it('associação exige backup e confirmação da prévia e mantém texto no erro',async()=>{
 const linkClick=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 URL.createObjectURL=vi.fn(()=>'blob:backup');URL.revokeObjectURL=vi.fn();
 render(<AssociarContextoRedacao redacao={redacao} turmas={[{id:'t',nome:'101',anoLetivo:2026,alunos:[{id:'a',nome:'Ana',dataNascimento:'0101'}]}]} professorUid="p" onSaved={vi.fn()}/>);
 expect(screen.getByRole('button',{name:'Confirmar associação',hidden:true})).toBeDisabled();
 fireEvent.click(screen.getByText('Conferir ou associar contexto desta redação'));
 fireEvent.click(screen.getByRole('button',{name:'1. Baixar cópia original'}));
 expect(linkClick).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByLabelText('Conferi a prévia e guardei a cópia original.'));
 expect(screen.getByRole('button',{name:'Confirmar associação'})).not.toBeDisabled();
 expect(m.associar).not.toHaveBeenCalled();linkClick.mockRestore();
});
it('publicação pede confirmação separada e mantém erro visível',async()=>{
 m.publicar.mockRejectedValueOnce(new Error('Conflito de acesso'));
 render(<RevisaoRedacao redacao={{...redacao,status:'revisado'}} professorUid="p" onSaved={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Disponibilizar ao aluno'}));expect(m.publicar).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Confirmar publicação'}));
 await screen.findByText('Conflito de acesso');expect(m.publicar).toHaveBeenCalledWith('p','one',1);
});

it('editar depois da confirmação impede publicar a versão antiga',async()=>{
 render(<RevisaoRedacao redacao={{...redacao,status:'revisado'}} professorUid="p" onSaved={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'Disponibilizar ao aluno'}));
 fireEvent.change(screen.getByLabelText('Devolutiva da revisão'),{target:{value:'Nova alteração ainda não salva'}});
 expect(screen.queryByRole('button',{name:'Confirmar publicação'})).not.toBeInTheDocument();
 expect(m.publicar).not.toHaveBeenCalled();
});
it('rascunho da revisão é privado e recuperável somente na mesma versão',async()=>{
 const first=render(<RevisaoRedacao redacao={redacao} professorUid="p" onSaved={vi.fn()}/>);
 fireEvent.change(screen.getByLabelText('Devolutiva da revisão'),{target:{value:'Devolutiva preservada antes de sair'}});
 first.unmount();
 const second=render(<RevisaoRedacao redacao={redacao} professorUid="p" onSaved={vi.fn()}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Recuperar rascunho da revisão'}));
 expect(screen.getByLabelText('Devolutiva da revisão')).toHaveValue('Devolutiva preservada antes de sair');second.unmount();
 render(<RevisaoRedacao redacao={{...redacao,revision:2}} professorUid="p" onSaved={vi.fn()}/>);
 await screen.findByText(/rascunho baseado em outra versão/i);
 expect(screen.queryByRole('button',{name:'Recuperar rascunho da revisão'})).not.toBeInTheDocument();
 expect(screen.getByLabelText('Devolutiva da revisão')).toHaveValue('Boa escrita');
});
it('associação resolve colisão global antes de persistir o acesso',async()=>{
 vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});URL.createObjectURL=vi.fn(()=>'blob:x');URL.revokeObjectURL=vi.fn();
 m.getDoc.mockImplementation(async path=>({exists:()=>path.endsWith('key-ana0101'),data:()=>({nome:'Ana Outra Pessoa',login:'ana0101'})}));
 m.associar.mockResolvedValue({...redacao,revision:2});
 render(<AssociarContextoRedacao redacao={redacao} turmas={[{id:'t',nome:'101',anoLetivo:2026,alunos:[{id:'a',nome:'Ana Maria',dataNascimento:'0101'}]}]} professorUid="p" onSaved={vi.fn()}/>);
 fireEvent.click(screen.getByText('Conferir ou associar contexto desta redação'));fireEvent.click(screen.getByRole('button',{name:'1. Baixar cópia original'}));
 fireEvent.click(screen.getByLabelText('Conferi a prévia e guardei a cópia original.'));fireEvent.click(screen.getByRole('button',{name:'Confirmar associação'}));
 await waitFor(()=>expect(m.associar).toHaveBeenCalledWith('p','one',expect.objectContaining({loginAluno:'anamaria0101',loginKey:'key-anamaria0101'}),1));
});
