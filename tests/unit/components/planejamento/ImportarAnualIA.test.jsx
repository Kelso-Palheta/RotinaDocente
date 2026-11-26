import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({temChave:true,gerar:vi.fn(),extrair:vi.fn()}));
vi.mock('@/hooks/useAIConfig',()=>({useAIConfig:()=>({temChave:mocks.temChave,config:{provider:'openai'}})}));
vi.mock('@/components/ai/ModalConectarIA',()=>({ModalConectarIA:({isOpen,onClose})=>isOpen?<button onClick={onClose}>Conectar sua IA</button>:null}));
vi.mock('@/components/aula-gamificada/api',async original=>({...await original(),gerarPlanoAnualIA:(...a)=>mocks.gerar(...a)}));
vi.mock('@/utils/atividades/documentExtractor',()=>({extractTextFromDocument:(...a)=>mocks.extrair(...a)}));
import {ImportarPlanoAnual} from '@/components/planejamento/ImportarPlanoAnual';
import {criarRascunho} from '@/components/planejamento/modelos';
const texto='Água e saneamento. Energia e ambiente. Ecossistemas e sustentabilidade.';
const plano={...criarRascunho('normal','anual'),integracaoAnual:1,titulo:'Ciências anual',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:texto,objetivo:'Investigar fenômenos'};
function preencher(){for(const [label,value]of [['Disciplina','Ciências'],['Série / ano escolar','8º ano'],['Texto do currículo',texto]])fireEvent.change(screen.getByLabelText(label),{target:{value}});fireEvent.click(screen.getByLabelText('Conferi o texto do currículo'));}
afterEach(()=>{cleanup();vi.clearAllMocks();mocks.temChave=true;});
it('gera rascunho somente após revisar texto e abre editor só após conferir distribuição',async()=>{
 const abrir=vi.fn();mocks.gerar.mockResolvedValue({rascunho:plano,avisos:['Revise a distribuição.']});render(<ImportarPlanoAnual uid="p1" onCriado={abrir}/>);
 preencher();fireEvent.click(screen.getByRole('button',{name:'Organizar anual com IA'}));await screen.findByRole('heading',{name:'Revise a distribuição por bimestre'});
 expect(abrir).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Usar rascunho no editor'})).toBeDisabled();
 fireEvent.click(screen.getByLabelText('Conferi a distribuição e quero revisar no editor'));fireEvent.click(screen.getByRole('button',{name:'Usar rascunho no editor'}));expect(abrir).toHaveBeenCalledWith(plano);
 expect(mocks.gerar.mock.calls[0][0].entrada).toMatchObject({disciplina:'Ciências',anoEscolar:'8º ano',texto});
});
it('lê arquivo somente por ação explícita e mostra texto extraído para revisão',async()=>{
 mocks.extrair.mockResolvedValue({texto,nomeArquivo:'curriculo.txt'});render(<ImportarPlanoAnual uid="p1"/>);
 const arquivo=new File([texto],'curriculo.txt',{type:'text/plain'});fireEvent.change(screen.getByLabelText('Arquivo do currículo'),{target:{files:[arquivo]}});expect(mocks.extrair).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:/Ler arquivo/}));await waitFor(()=>expect(screen.getByLabelText('Texto do currículo').value).toBe(texto));expect(mocks.gerar).not.toHaveBeenCalled();expect(screen.getByLabelText('Conferi o texto do currículo')).not.toBeChecked();
});
it('troca de conta descarta material e resposta tardia',async()=>{
 let resolver;mocks.gerar.mockImplementation(()=>new Promise(r=>resolver=r));const abrir=vi.fn(),v=render(<ImportarPlanoAnual uid="p1" onCriado={abrir}/>);preencher();fireEvent.click(screen.getByRole('button',{name:'Organizar anual com IA'}));await waitFor(()=>expect(mocks.gerar).toHaveBeenCalled());v.rerender(<ImportarPlanoAnual uid="p2" onCriado={abrir}/>);resolver({rascunho:plano,avisos:[]});expect(screen.getByLabelText('Texto do currículo').value).toBe('');expect(abrir).not.toHaveBeenCalled();
});
it('sem chave abre conexão e não chama geração',()=>{
 mocks.temChave=false;render(<ImportarPlanoAnual uid="p1"/>);preencher();fireEvent.click(screen.getByRole('button',{name:'Organizar anual com IA'}));expect(screen.getByRole('button',{name:'Conectar sua IA'})).toBeTruthy();expect(mocks.gerar).not.toHaveBeenCalled();
});
