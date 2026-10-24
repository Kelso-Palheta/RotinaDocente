import { render, screen, within } from '@testing-library/react';
import { MapaAnual } from '@/components/diario/MapaAnual';

test('Mapa diferencia aprovação semestral e situação anual incompleta',()=>{
 const turma={id:'t',alunos:[{id:'a',nome:'Ana Exemplo'}],bimestres:{}};
 for(const b of [1,2])turma.bimestres[b]={atividades:[],notas:{a:{simulado:5}}};
 render(<MapaAnual turma={turma} onSetRecuperacao={()=>{}}/>);
 const linha=within(screen.getByText('Ana Exemplo').closest('tr'));
 expect(linha.getByText('Aprovado')).toBeInTheDocument();
 expect(linha.getByText('Em andamento')).toBeInTheDocument();
 expect(screen.getByRole('columnheader',{name:'Falta S1'})).toBeInTheDocument();
 expect(screen.getByRole('columnheader',{name:'Situação anual'})).toBeInTheDocument();
});
