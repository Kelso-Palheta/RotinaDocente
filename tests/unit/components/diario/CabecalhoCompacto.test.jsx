import {render,screen,within,fireEvent,cleanup} from '@testing-library/react';
import {expect,it,vi,afterEach} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync} from 'node:fs';
vi.mock('@/components/diario/TabelaNotas',()=>({TabelaNotas:()=> <p>Tabela de notas disponível</p>}));
vi.mock('@/components/diario/TabelaFrequencia',()=>({TabelaFrequencia:()=> <p>Frequência aberta</p>}));
vi.mock('@/components/diario/DiarioDeBordo',()=>({DiarioDeBordo:()=>null}));
vi.mock('@/components/diario/ImportModal',()=>({ImportModal:()=> <div role="dialog" aria-label="Importar alunos"/>}));
vi.mock('@/components/diario/ImportarSimuladoModal',()=>({ImportarSimuladoModal:()=> <div role="dialog" aria-label="Importar simulado"/>}));
import {TurmaView} from '@/components/diario/TurmaView';
const alunos=Array.from({length:35},(_,i)=>({id:`a${i}`,nome:`Aluno ${String(i+1).padStart(2,'0')}`}));
const turma={id:'t',nome:'103',alunos,bimestres:{3:{atividades:[{id:'trabalho',nome:'Atividade',max:5}],notas:Object.fromEntries(alunos.slice(0,34).map((a,i)=>[a.id,i<10?{simulado:5,trabalho:5}:i<22?{simulado:3,trabalho:3}:{simulado:1,trabalho:1}]))}}};
const props={turma,bimestre:3,onImportarSimulado:()=>{},onRemoveTurma:()=>{}};
afterEach(cleanup);
it('identifica cabeçalho e mantém contagens, cores semânticas e todas as ações acessíveis',()=>{
 render(<TurmaView {...props}/>);
 if(process.env.RD_CABECALHO_HTML)writeFileSync(process.env.RD_CABECALHO_HTML,renderToStaticMarkup(<TurmaView {...props}/>));
 const cabecalho=screen.getByRole('region',{name:'Cabeçalho da turma'});const resumo=within(cabecalho).getByLabelText('Resumo de desempenho');
 for(const [rotulo,valor]of [['Excelentes','10'],['Aprovados','12'],['Abaixo da média','12'],['Sem nota','1']]){
  const item=within(resumo).getByText(rotulo).closest('div');expect(within(item).getByText(valor)).toBeInTheDocument();
 }
 for(const rotulo of ['Notas','Frequência','Ocorrências','Resumo anual','Caderneta anual PDF','CSV anual','Importar Alunos','Importar Simulado'])expect(within(cabecalho).getByRole('button',{name:rotulo})).toBeInTheDocument();
 expect(screen.getByText('Tabela de notas disponível')).toBeInTheDocument();
});
it('mantém navegação e abertura das importações após compactar controles',()=>{
 render(<TurmaView {...props}/>);const cabecalho=screen.getByRole('region',{name:'Cabeçalho da turma'});
 fireEvent.click(within(cabecalho).getByRole('button',{name:'Importar Simulado'}));expect(screen.getByRole('dialog',{name:'Importar simulado'})).toBeInTheDocument();
 fireEvent.click(within(cabecalho).getByRole('button',{name:'Importar Alunos'}));expect(screen.getByRole('dialog',{name:'Importar alunos'})).toBeInTheDocument();
 fireEvent.click(within(cabecalho).getByRole('button',{name:'Frequência'}));expect(screen.getByText('Frequência aberta')).toBeInTheDocument();
});
