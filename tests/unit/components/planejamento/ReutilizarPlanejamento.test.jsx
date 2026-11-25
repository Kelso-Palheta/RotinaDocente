import React from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@/components/aula-gamificada/api',()=>({obterPlano:vi.fn(),salvarPlano:vi.fn(),gerarRequestId:vi.fn(()=> 'copia_1')}));
import * as api from '@/components/aula-gamificada/api';
import {ReutilizarPlanejamento} from '@/components/planejamento/ReutilizarPlanejamento';
const origem={id:'regular1',revision:3,tipo:'normal',escala:'anual',titulo:'Ciências no ano',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água, energia e ambiente',objetivo:'Comparar evidências',duracaoMinutos:null,turmaIds:['t1'],questaoIds:[],contexto:{apoios:'Leitura compartilhada'},etapas:[{id:'b1',tipo:'desenvolvimento',titulo:'Água',prazo:'1º bimestre',minutos:null,orientacao:'Investigar água.'},{id:'b2',tipo:'desenvolvimento',titulo:'Energia',prazo:'2º bimestre',minutos:null,orientacao:'Investigar energia.'}]};
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('seleciona etapas, cria cópia gamificada e preserva fonte regular',async()=>{
 const antes=structuredClone(origem),criado=vi.fn();api.obterPlano.mockResolvedValue({plano:origem});api.salvarPlano.mockImplementation(async({plano})=>({plano:{...plano,id:'filho1',revision:1}}));
 render(<ReutilizarPlanejamento planos={[origem]} origemInicialId="regular1" turmas={[{id:'t1'}]} onCriado={criado}/>);
 await screen.findByText('Ciências no ano');expect(api.salvarPlano).not.toHaveBeenCalled();
 fireEvent.click(screen.getByLabelText('Energia'));
 fireEvent.change(screen.getByLabelText('Formato da versão gamificada'),{target:{value:'aula'}});
 fireEvent.click(screen.getByRole('button',{name:'Criar versão gamificada'}));await waitFor(()=>expect(criado).toHaveBeenCalled());
 const p=api.salvarPlano.mock.calls[0][0].plano;expect(p.id).toBeUndefined();expect(p.origem).toMatchObject({planoId:'regular1',revision:3,etapaIds:['b1']});expect(p.etapas.some(e=>e.orientacao==='Investigar água.')).toBe(true);expect(origem).toEqual(antes);
});
it('envio incerto bloqueia opções e repete a mesma cópia',async()=>{
 api.obterPlano.mockResolvedValue({plano:origem});api.salvarPlano.mockReset().mockRejectedValueOnce(new Error('Rede indisponível')).mockResolvedValueOnce({plano:{id:'filho1'}});
 render(<ReutilizarPlanejamento planos={[origem]} origemInicialId="regular1" turmas={[{id:'t1'}]}/>);await screen.findByText('Ciências no ano');fireEvent.click(screen.getByRole('button',{name:'Criar versão gamificada'}));await screen.findByText('Rede indisponível');
 expect(screen.getByLabelText('Formato da versão gamificada')).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'Tentar criar novamente'}));await waitFor(()=>expect(api.salvarPlano).toHaveBeenCalledTimes(2));expect(api.salvarPlano.mock.calls[0][0]).toEqual(api.salvarPlano.mock.calls[1][0]);expect(api.gerarRequestId).toHaveBeenCalledTimes(1);
});
it('não permite cópia sem etapas e não cria jogo automaticamente',async()=>{
 api.obterPlano.mockResolvedValue({plano:origem});render(<ReutilizarPlanejamento planos={[origem]} origemInicialId="regular1"/>);await screen.findByText('Ciências no ano');fireEvent.click(screen.getByRole('button',{name:'Desmarcar todas'}));expect(screen.getByRole('button',{name:'Criar versão gamificada'})).toBeDisabled();expect(api.salvarPlano).not.toHaveBeenCalled();
});
