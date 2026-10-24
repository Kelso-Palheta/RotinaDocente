import React from 'react';
import { expect,it,vi } from 'vitest';
import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { FeriadosModal } from '../../../../frontend/src/components/calendario/FeriadosModal';
const preencher = (fim='2027-07-20') => {
 fireEvent.change(screen.getByLabelText('Data inicial'),{target:{value:'2027-07-10'}});
 fireEvent.change(screen.getByLabelText('Data final (opcional)'),{target:{value:fim}});
 fireEvent.change(screen.getByLabelText('Descrição'),{target:{value:'Recesso escolar'}});
};
it('envia intervalo completo e só limpa formulário depois do sucesso',async()=>{
 let resolver;const onAddFeriado=vi.fn(()=>new Promise(resolve=>{resolver=resolve;}));
 render(<FeriadosModal isOpen anoLetivo={2027} onAddFeriado={onAddFeriado}/>);
 preencher();fireEvent.click(screen.getByRole('button',{name:'Cadastrar e remanejar aulas'}));
 expect(onAddFeriado).toHaveBeenCalledWith({data:'2027-07-10',dataFim:'2027-07-20',nome:'Recesso escolar'});
 expect(screen.getByLabelText('Descrição').value).toBe('Recesso escolar');
 expect(screen.getByRole('button',{name:'Importar'}).disabled).toBe(true);
 resolver();await waitFor(()=>expect(screen.getByLabelText('Descrição').value).toBe(''));
});
it('falha conserva intervalo e descrição com erro visível',async()=>{
 render(<FeriadosModal isOpen anoLetivo={2027} onAddFeriado={vi.fn().mockRejectedValue(new Error('Falha ao salvar'))}/>);
 preencher();fireEvent.click(screen.getByRole('button',{name:'Cadastrar e remanejar aulas'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar');
 expect(screen.getByLabelText('Descrição').value).toBe('Recesso escolar');
 expect(screen.getByLabelText('Data final (opcional)').value).toBe('2027-07-20');
});
it('recusa fim anterior ao início e datas fora do ano letivo',async()=>{
 const adicionar=vi.fn();render(<FeriadosModal isOpen anoLetivo={2027} onAddFeriado={adicionar}/>);
 preencher('2027-07-01');fireEvent.submit(screen.getByRole('button',{name:'Cadastrar e remanejar aulas'}).closest('form'));
 expect(screen.getByRole('alert')).toHaveTextContent('data final');
 fireEvent.change(screen.getByLabelText('Data final (opcional)'),{target:{value:'2028-07-01'}});
 fireEvent.submit(screen.getByRole('button',{name:'Cadastrar e remanejar aulas'}).closest('form'));
 expect(screen.getByRole('alert')).toHaveTextContent('ano letivo');expect(adicionar).not.toHaveBeenCalled();
});
it('remoção explica alcance e só executa depois da confirmação',async()=>{
 const remover=vi.fn().mockRejectedValue(new Error('Falha na remoção'));const confirmar=vi.spyOn(window,'confirm').mockReturnValue(true);
 render(<FeriadosModal isOpen anoLetivo={2027} feriados={[{data:'2027-09-07',nome:'Feriado'}]} onRemoveFeriado={remover}/>);
 fireEvent.click(screen.getByRole('button',{name:'Remover Feriado'}));
 expect(confirmar).toHaveBeenCalledWith(expect.stringContaining('Reabre somente aulas bloqueadas automaticamente; conteúdos futuros não serão redistribuídos.'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha na remoção');expect(remover).toHaveBeenCalledWith('2027-09-07');confirmar.mockRestore();
});
it('aguarda importação nacional e apresenta falha sem fechar',async()=>{
 let rejeitar;const fechar=vi.fn();
 render(<FeriadosModal isOpen anoLetivo={2027} onClose={fechar} onImportarFeriadosNacionais={()=>new Promise((_,reject)=>{rejeitar=reject;})}/>);
 fireEvent.click(screen.getByRole('button',{name:'Importar'}));
 expect(screen.getByRole('button',{name:'Concluir'}).disabled).toBe(true);
 rejeitar(new Error('Falha ao importar datas'));
 expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao importar datas');
 expect(fechar).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Importar'}).disabled).toBe(false);
});
