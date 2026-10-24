import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {CardAula} from '@/components/calendario/CardAula';
import {CalendarioView} from '@/components/calendario/CalendarioView';
const aula={id:'a',dataAgendada:'2026-11-02',horarioInicio:'07:00',horarioFim:'08:00',status:'AGENDADA',topicosAssociados:[{id:'t',titulo:'Arte moderna'}]};
afterEach(cleanup);
it('título abre detalhes e há ação visível sem passar mouse',()=>{
 const abrir=vi.fn();render(<CardAula aula={aula} onOpenDetalhes={abrir}/>);
 fireEvent.click(screen.getByText('Arte moderna'));expect(abrir).toHaveBeenCalledWith(aula);expect(screen.getByRole('button',{name:/Ver aula/})).toBeVisible();
});
it('oferece lista por data além de semana/mês',()=>{
 render(<CalendarioView aulas={[aula]} dataAtual={new Date(2026,10,2)} setDataAtual={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Lista'}));expect(screen.getByText('Arte moderna')).toBeVisible();
});
it('Hoje permanece no ano/período selecionado',()=>{
 const navegar=vi.fn();render(<CalendarioView aulas={[]} dataAtual={new Date(2027,1,1)} dataInicio="2027-02-01" dataFim="2027-12-01" setDataAtual={navegar}/>);
 fireEvent.click(screen.getByRole('button',{name:'Hoje'}));expect(navegar.mock.calls[0][0].getFullYear()).toBe(2027);
});
