import { render, screen, cleanup } from '@testing-library/react';
import { BimestreCard } from '@/components/aluno/BimestreCard';
afterEach(cleanup);
it.each([[4.99,'red'],[5,'blue'],[7.99,'blue'],[8,'green'],[10,'green'],[0,'red']])('total %s usa %s no portal', (nota,cor) => {
 const turma = {bimestres:{'1':{atividades:[],notas:{a:{simulado:nota}},config:{simuladoMaxLanca:10,simuladoMaxFinal:10,atividadesMaxFinal:0}}}};
 render(<BimestreCard numero={1} turma={turma} alunoId="a" />);
 const total = screen.getByText('Total do Bimestre').parentElement;
 expect(total.lastElementChild).toHaveClass(`text-${cor}-600`);
});
it('atividade cadastrada sem nota não vira zero nem alerta', () => {
 const turma = {bimestres:{'1':{atividades:[{id:'x',nome:'Trabalho',max:5}],notas:{}}}};
 render(<BimestreCard numero={1} turma={turma} alunoId="a" />);
 expect(screen.queryByText('Atenção')).toBeNull();
 expect(screen.queryByText('Abaixo da média')).toBeNull();
 expect(screen.getByText(/Nenhuma nota/)).toBeInTheDocument();
});
