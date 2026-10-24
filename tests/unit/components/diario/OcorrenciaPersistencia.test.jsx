import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {DiarioDeBordo} from '@/components/diario/DiarioDeBordo';
it('falha ao persistir mantém anotação e autorização familiar desligada por padrão',async()=>{
 render(<DiarioDeBordo turma={{id:'t',nome:'101',alunos:[]}} onSalvarOcorrencias={vi.fn().mockRejectedValue(new Error('Sem conexão'))}/>);
 fireEvent.click(screen.getByRole('button',{name:'+ Nova Anotação'}));
 expect(screen.getByLabelText('Autorizar inclusão na Ficha 360º familiar')).not.toBeChecked();
 fireEvent.change(screen.getByPlaceholderText('Ex: Evolução na produção textual dissertativa'),{target:{value:'Participação'}});
 fireEvent.change(screen.getByPlaceholderText('Descreva o ocorrido, intervenção realizada ou combinados com o aluno/turma...'),{target:{value:'Avanço observado'}});
 fireEvent.click(screen.getByRole('button',{name:'Salvar Anotação'}));
 await waitFor(()=>expect(screen.getByText(/Sem conexão/)).toBeInTheDocument());
 expect(screen.getByDisplayValue('Avanço observado')).toBeInTheDocument();
});
