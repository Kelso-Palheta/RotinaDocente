import React from 'react';
import {render,screen,fireEvent,act,cleanup,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({config:{provider:'gemini',apiKey:'chave-original',model:'',getMaskedKey:()=> 'ch***nal'},listar:vi.fn(),listarTodas:vi.fn()}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({config:m.config,temChave:true,salvar:vi.fn(),remover:vi.fn(),testar:vi.fn()})}));
vi.mock('@/lib/firebase-atividades',()=>({listAtividades:(...a)=>m.listar(...a),listAllAtividades:(...a)=>m.listarTodas(...a)}));
import {ModalNovaQuestao} from '@/components/adaptacoes/ModalNovaQuestao';
import {ModalAlunoPEI} from '@/components/adaptacoes/ModalAlunoPEI';
import {ModalImportarAtividadeTurma} from '@/components/adaptacoes/ModalImportarAtividadeTurma';
import {ModalConectarIA} from '@/components/ai/ModalConectarIA';
const pendente=()=>{let resolver;const promise=new Promise(r=>{resolver=r;});return{promise,resolver};};
beforeEach(()=>{m.config={provider:'gemini',apiKey:'chave-original',model:'',getMaskedKey:()=> 'ch***nal'};m.listar.mockReset().mockResolvedValue([]);m.listarTodas.mockReset().mockResolvedValue([]);});
afterEach(cleanup);
it('reinicia a questão ao reabrir ou trocar origem e preserva edição no rerender comum',()=>{
 const q={id:'q1',enunciado:'Questão original',alternativas:['A','B']};const props={isOpen:true,onClose:vi.fn(),onSalvar:vi.fn(),questaoParaEditar:q};
 const {rerender}=render(<ModalNovaQuestao {...props}/>);const campo=()=>screen.getByPlaceholderText(/Digite o enunciado adaptado/);
 expect(campo()).toHaveValue('Questão original');fireEvent.change(campo(),{target:{value:'Rascunho'}});
 rerender(<ModalNovaQuestao {...props}/>);expect(campo()).toHaveValue('Rascunho');
 rerender(<ModalNovaQuestao {...props} isOpen={false}/>);rerender(<ModalNovaQuestao {...props}/>);expect(campo()).toHaveValue('Questão original');
 rerender(<ModalNovaQuestao {...props} questaoParaEditar={{...q,id:'q2',enunciado:'Outra questão'}}/>);expect(campo()).toHaveValue('Outra questão');
});
it('atualiza a chave de IA por contexto sem apagar a digitação em rerender comum',()=>{
 const props={isOpen:true,onClose:vi.fn()};const {container,rerender}=render(<ModalConectarIA {...props}/>);const chave=()=>container.querySelector('input[type="password"]');
 expect(chave()).toHaveValue('chave-original');fireEvent.change(chave(),{target:{value:'nova-chave'}});
 rerender(<ModalConectarIA {...props}/>);expect(chave()).toHaveValue('nova-chave');
 rerender(<ModalConectarIA {...props} isOpen={false}/>);rerender(<ModalConectarIA {...props}/>);expect(chave()).toHaveValue('chave-original');
 m.config={...m.config,apiKey:'outra-configuração'};rerender(<ModalConectarIA {...props}/>);expect(chave()).toHaveValue('outra-configuração');
});
it('preserva o cadastro PEI em rascunho ao fechar e reabrir',async()=>{
 const repository={listarAlunos:vi.fn().mockResolvedValue([])};const props={isOpen:true,onClose:vi.fn(),userId:'a',repository};const {rerender}=render(<ModalAlunoPEI {...props}/>);
 await act(async()=>{});fireEvent.click(screen.getAllByRole('button',{name:/Cadastrar Estudante/})[0]);fireEvent.change(screen.getByPlaceholderText(/Lucas S/),{target:{value:'Rascunho PEI'}});
 rerender(<ModalAlunoPEI {...props} isOpen={false}/>);rerender(<ModalAlunoPEI {...props}/>);await act(async()=>{});
 fireEvent.click(screen.getAllByRole('button',{name:/Cadastrar Estudante/})[0]);expect(screen.getByPlaceholderText(/Lucas S/)).toHaveValue('Rascunho PEI');
});
it('ignora a lista PEI da conta anterior e limpa os dados visíveis na troca',async()=>{
 const a=pendente(),b=pendente();const repository={listarAlunos:vi.fn(id=>id==='a'?a.promise:b.promise)};const props={isOpen:true,onClose:vi.fn(),repository};const {rerender}=render(<ModalAlunoPEI {...props} userId="a"/>);
 rerender(<ModalAlunoPEI {...props} userId="b"/>);
 await act(async()=>{b.resolver([{id:'b1',nome:'Estudante B',necessidades:[]}]);});expect(screen.getByText('Estudante B')).toBeInTheDocument();
 await act(async()=>{a.resolver([{id:'a1',nome:'Estudante A',necessidades:[]}]);});expect(screen.queryByText('Estudante A')).not.toBeInTheDocument();expect(screen.getByText('Estudante B')).toBeInTheDocument();
});
it('recebe turmas atrasadas e mantém seleção manual no rerender do pai',async()=>{
 const user={uid:'p'};const props={isOpen:true,onClose:vi.fn(),user,onImportarAtividade:vi.fn()};const {rerender}=render(<ModalImportarAtividadeTurma {...props} turmas={[]}/>);
 const turmas=[{id:'a',nome:'Turma A'},{id:'b',nome:'Turma B'}];rerender(<ModalImportarAtividadeTurma {...props} turmas={turmas} turmaSelecionadaId="a"/>);
 await waitFor(()=>expect(m.listar).toHaveBeenCalledWith('p','a'));fireEvent.change(screen.getByRole('combobox'),{target:{value:'b'}});
 rerender(<ModalImportarAtividadeTurma {...props} turmas={[...turmas]} turmaSelecionadaId="a"/>);expect(screen.getByRole('combobox')).toHaveValue('b');
 await waitFor(()=>expect(m.listar).toHaveBeenCalledWith('p','b'));
 rerender(<ModalImportarAtividadeTurma {...props} turmas={turmas} turmaSelecionadaId="b"/>);rerender(<ModalImportarAtividadeTurma {...props} turmas={turmas} turmaSelecionadaId="a"/>);expect(screen.getByRole('combobox')).toHaveValue('a');
});
