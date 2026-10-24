import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {vi,it,expect,afterEach} from 'vitest';
import {confirmarTrocaContexto} from '@/utils/diario/confirmarTrocaContexto';
import {TabelaFrequencia} from '@/components/diario/TabelaFrequencia';
import {DiarioDeBordo} from '@/components/diario/DiarioDeBordo';
afterEach(()=>vi.restoreAllMocks());
it('sem edição navega; rascunho ou entrada inválida exige confirmação',()=>{
 const confirmar=vi.spyOn(window,'confirm').mockReturnValue(false);
 const {rerender}=render(<div>Nenhum rascunho</div>);expect(confirmarTrocaContexto()).toBe(true);expect(confirmar).not.toHaveBeenCalled();
 rerender(<div data-diario-rascunho="true"/>);expect(confirmarTrocaContexto()).toBe(false);
 confirmar.mockReturnValue(true);expect(confirmarTrocaContexto()).toBe(true);
 rerender(<input aria-invalid="true"/>);confirmar.mockReturnValue(false);expect(confirmarTrocaContexto()).toBe(false);
});
it('não interrompe gravação em curso nem oferece descarte',()=>{
 const confirmar=vi.spyOn(window,'confirm');render(<div data-diario-salvando="true"/>);
 expect(confirmarTrocaContexto()).toBe(false);expect(confirmar).not.toHaveBeenCalled();
});
it('chamada sinaliza edição e gravação até a confirmação persistida',async()=>{
 let concluir;const salvar=vi.fn(()=>new Promise(resolve=>{concluir=resolve;}));
 const {container}=render(<TabelaFrequencia turma={{id:'t',alunos:[{id:'a',nome:'Ana'}]}} onSalvarFrequencia={salvar}/>);
 expect(container.querySelector('[data-diario-rascunho="true"]')).toBeNull();
 fireEvent.click(screen.getByTitle('Presente'));
 expect(container.querySelector('[data-diario-rascunho="true"]')).not.toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Salvar Chamada do Dia'}));
 expect(container.querySelector('[data-diario-salvando="true"]')).not.toBeNull();concluir();
 await waitFor(()=>expect(container.querySelector('[data-diario-rascunho="true"]')).toBeNull());
});
it('buscas e filtros de ocorrências não são rascunho; formulário editado é',()=>{
 const {container}=render(<DiarioDeBordo turma={{id:'t',alunos:[]}}/>);
 fireEvent.change(screen.getByPlaceholderText('Buscar por termo ou motivo...'),{target:{value:'elogio'}});
 expect(container.querySelector('[data-diario-rascunho="true"]')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'+ Nova Anotação'}));
 expect(container.querySelector('[data-diario-rascunho="true"]')).toBeNull();
 fireEvent.change(screen.getByPlaceholderText('Ex: Evolução na produção textual dissertativa'),{target:{value:'Avanço'}});
 expect(container.querySelector('[data-diario-rascunho="true"]')).not.toBeNull();
});
