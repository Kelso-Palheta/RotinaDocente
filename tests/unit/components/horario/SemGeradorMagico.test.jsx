import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi,afterEach} from 'vitest';
vi.mock('@/lib/auth-context',()=>({useAuth:()=>({user:{uid:'prof-teste'}})}));
vi.mock('@/lib/firebase',()=>({db:{}}));
vi.mock('@/infraestrutura/horario/HorarioRepository',()=>({HorarioRepository:class{async carregarGrade(){return {teacherName:'Professor Teste',schoolName:'Escola Teste',shift:'manha',schedule:{}};}async salvarGrade(){return {};}}}));
import HorarioApp from '@/apresentacao/horario/HorarioApp';
afterEach(cleanup);
test('remove geração automática e preserva cadastro manual e importação',async()=>{
 render(<HorarioApp/>);await screen.findByText(/Total de Aulas/i);
 expect(screen.queryByRole('button',{name:/Gerador Mágico/})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Importar Horário'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Horários'})).toBeInTheDocument();
 fireEvent.click(screen.getAllByText('+')[0]);
 expect(screen.getByText(/Adicionar Aula/)).toBeInTheDocument();
});
