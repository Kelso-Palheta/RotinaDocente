import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
vi.mock('@/utils/atividades/documentExtractor',()=>({extractTextFromDocument:vi.fn().mockRejectedValueOnce(new Error('Rede indisponível')).mockResolvedValue({texto:'Texto recuperado'})}));
vi.mock('@/components/ui/RichTextEditor',()=>({RichTextEditor:()=>null}));
import AtividadeForm from '@/components/atividades/AtividadeForm';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('falha conserva arquivo selecionado e permite repetir leitura sem novo upload',async()=>{
 render(<AtividadeForm turmas={[]} onCreate={vi.fn()}/>);
 const create=document.createElement.bind(document);let input;
 vi.spyOn(document,'createElement').mockImplementation((tag,...args)=>{const el=create(tag,...args);if(tag==='input'){input=el;vi.spyOn(el,'click').mockImplementation(()=>{});}return el;});
 fireEvent.click(screen.getByRole('button',{name:'PDF / imagem'}));fireEvent.change(input,{target:{files:[new File(['a'],'livro.png',{type:'image/png'})]}});
 expect(await screen.findByRole('button',{name:'Tentar ler livro.png novamente'})).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Tentar ler livro.png novamente'}));
 expect(await screen.findByRole('textbox',{name:'Texto extraído de livro.png'})).toHaveValue('Texto recuperado');
});
