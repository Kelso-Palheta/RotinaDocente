import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {PerfilAlunoDiario} from '@/components/diario/PerfilAlunoDiario';
it('prévia familiar filtra registros antes de exportar sem enviar nem publicar',()=>{
 const exportar=vi.fn();
 render(<PerfilAlunoDiario aluno={{id:'a',nome:'Ana'}} turma={{ocorrencias:[{id:'p',alunoIds:['a'],visivelFamilia:true,titulo:'Elogio',descricao:'Boa participação'},{id:'i',alunoIds:['a'],visivelFamilia:false,titulo:'Sigilo',descricao:'Somente professor'}]}} onExportar={exportar}/>);
 expect(screen.queryByText('Sigilo')).not.toBeInTheDocument();
 expect(screen.getByText(/não envia mensagens nem publica/)).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Privacidade da linha do tempo'),{target:{value:'todos'}});
 expect(screen.getByText('Sigilo')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Exportar Ficha 360º'}));
 expect(exportar).toHaveBeenCalledTimes(1);
});
