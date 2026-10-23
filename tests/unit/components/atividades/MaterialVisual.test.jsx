import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AtividadeForm from '@/components/atividades/AtividadeForm';
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';
vi.mock('@/utils/atividades/documentExtractor', () => ({extractTextFromDocument:vi.fn(async () => ({texto:'Conteúdo extraído do livro.'}))}));
afterEach(() => {cleanup();vi.restoreAllMocks();});
it('material aceita fotografia, extrai e permite revisar o texto', async () => {
 render(<AtividadeForm turmas={[]} onCreate={()=>{}} onUpdate={()=>{}} onClose={()=>{}}
  initialData={{id:'a',titulo:'Teste',bimestre:'1',turmas:[],questoes:[],textosBase:[],materiais:[]}} />);
 const create = document.createElement.bind(document);
 let input;
 vi.spyOn(document,'createElement').mockImplementation((tag,...args) => {
  const element = create(tag,...args);
  if(tag==='input') {input=element;vi.spyOn(element,'click').mockImplementation(()=>{});}
  return element;
 });
 fireEvent.click(screen.getByRole('button',{name:/^PDF \/ imagem$/}));
 expect(input.accept).toContain('.png');
 const file = new File(['imagem'],'livro.png',{type:'image/png'});
 fireEvent.change(input,{target:{files:[file]}});
 const editor = await screen.findByRole('textbox',{name:'Texto extraído de livro.png'});
 expect(extractTextFromDocument).toHaveBeenCalledWith(file,{allowImages:true});
 expect(editor).toHaveValue('Conteúdo extraído do livro.');
 fireEvent.change(editor,{target:{value:'Texto revisado pelo professor.'}});
 expect(editor).toHaveValue('Texto revisado pelo professor.');
});
