import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {vi,it,expect} from 'vitest';
import {TabelaFrequencia} from '@/components/diario/TabelaFrequencia';
it('reabre chamada com quantidade salva, pede revisão e aguarda gravação real',async()=>{
 const data=new Date().toISOString().slice(0,10);let concluir;
 const salvar=vi.fn(()=>new Promise(resolve=>{concluir=resolve;}));
 vi.spyOn(window,'confirm').mockReturnValue(true);
 render(<TabelaFrequencia turma={{id:'t',alunos:[{id:'a',nome:'Ana'}],frequencias:{[data]:{quantidadeAulas:4,presencas:{a:'F'}}}}} onSalvarFrequencia={salvar}/>);
 expect(screen.getByRole('combobox')).toHaveValue('4');
 fireEvent.click(screen.getByRole('button',{name:'Salvar Chamada do Dia'}));
 expect(window.confirm).toHaveBeenCalled();
 expect(screen.getByRole('button',{name:'Salvando...'})).toBeDisabled();
 expect(salvar.mock.calls[0][1][data]).toMatchObject({quantidadeAulas:4,presencas:{a:'F'}});
 concluir();await waitFor(()=>expect(screen.getByText('Chamada registrada com sucesso!')).toBeInTheDocument());
 vi.restoreAllMocks();
});
it('nova chamada requer marcar cada aluno ou confirmar todos presentes',()=>{
 const salvar=vi.fn();render(<TabelaFrequencia turma={{id:'t',alunos:[{id:'a',nome:'Ana'}]}} onSalvarFrequencia={salvar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Salvar Chamada do Dia'}));
 expect(salvar).not.toHaveBeenCalled();expect(screen.getByText(/Confirme a presença de todos os alunos/)).toBeInTheDocument();
});
