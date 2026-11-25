import React from 'react';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { afterEach,it,expect,vi } from 'vitest';
import { PlanejarAula } from '@/components/aula-gamificada/PlanejarAula';
import * as api from '@/components/aula-gamificada/api';
vi.mock('@/components/aula-gamificada/api',()=>({listarPlanos:vi.fn(),obterPlano:vi.fn(),salvarPlano:vi.fn(),gerarRequestId:vi.fn(()=> 'pedido1')}));
afterEach(()=>{cleanup();vi.clearAllMocks();});
const plano={id:'p1',revision:1,titulo:'Água em investigação',disciplina:'Ciências',anoEscolar:'8º ano',conteudo:'Água',objetivo:'Comparar evidências',duracaoMinutos:50,modalidade:'quiz',experiencia:'resgate',turmaIds:['t1'],questaoIds:['q1','q2','q3'],etapas:[{id:'a',titulo:'Abertura',tipo:'introducao',minutos:5,orientacao:''},{id:'m',titulo:'Missão',tipo:'jogo',minutos:35,orientacao:''},{id:'f',titulo:'Fechamento',tipo:'fechamento',minutos:10,orientacao:''}]};
const questoes=plano.questaoIds.map(id=>({id,tipo:'multipla_escolha',status:'revisada',disciplina:'Ciências',conteudo:'Água',enunciado:`Pergunta ${id}`}));
it('reabre plano persistido e transmite versão/conteúdo para gerar e preparar',async()=>{
 api.listarPlanos.mockResolvedValue({planos:[plano]});api.obterPlano.mockResolvedValue({plano});
 const usar=vi.fn();render(<PlanejarAula turmas={[{id:'t1',nome:'Turma 1'}]} questoes={questoes} onUsarPlano={usar}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Abrir Água em investigação'}));
 await waitFor(()=>expect(screen.getByLabelText('Título do plano').value).toBe(plano.titulo));
 fireEvent.click(screen.getByRole('button',{name:'Gerar questões deste plano'}));expect(usar).toHaveBeenLastCalledWith(plano,'gerar');
 fireEvent.click(screen.getByRole('button',{name:'Preparar partida deste plano'}));expect(usar).toHaveBeenLastCalledWith(plano,'salas');
 fireEvent.change(screen.getByLabelText('Objetivo de aprendizagem'),{target:{value:'Objetivo alterado'}});
 expect(screen.getByRole('button',{name:'Preparar partida deste plano'}).disabled).toBe(true);
});
it('persiste edição com revisão, sem publicar nem criar sala',async()=>{
 api.listarPlanos.mockResolvedValue({planos:[plano]});api.obterPlano.mockResolvedValue({plano});api.salvarPlano.mockResolvedValue({plano:{...plano,revision:2,objetivo:'Objetivo alterado'}});
 const usar=vi.fn();render(<PlanejarAula turmas={[{id:'t1',nome:'Turma 1'}]} questoes={questoes} onUsarPlano={usar}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Abrir Água em investigação'}));await waitFor(()=>expect(screen.getByLabelText('Título do plano').value).toBe(plano.titulo));
 fireEvent.change(screen.getByLabelText('Objetivo de aprendizagem'),{target:{value:'Objetivo alterado'}});fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));
 await screen.findByText('Planejamento salvo na nuvem.');expect(api.salvarPlano).toHaveBeenCalledWith(expect.objectContaining({expectedRevision:1,requestId:'pedido1',plano:expect.objectContaining({objetivo:'Objetivo alterado'})}));expect(usar).not.toHaveBeenCalled();
});
it('permite descartar rascunho novo explicitamente e abrir plano salvo',async()=>{
 api.listarPlanos.mockResolvedValue({planos:[plano]});api.obterPlano.mockResolvedValue({plano});
 render(<PlanejarAula questoes={questoes}/>);await screen.findByRole('button',{name:'Abrir Água em investigação'});
 fireEvent.change(screen.getByLabelText('Título do plano'),{target:{value:'Rascunho local'}});
 fireEvent.click(screen.getByRole('button',{name:'Descartar alterações locais'}));
 fireEvent.click(screen.getByRole('button',{name:'Abrir Água em investigação'}));
 await waitFor(()=>expect(screen.getByLabelText('Título do plano').value).toBe(plano.titulo));
});
it('permite retirar turma indisponível sem perder o restante do plano',async()=>{
 api.listarPlanos.mockResolvedValue({planos:[plano]});api.obterPlano.mockResolvedValue({plano});
 render(<PlanejarAula questoes={questoes}/>);fireEvent.click(await screen.findByRole('button',{name:'Abrir Água em investigação'}));
 fireEvent.click(await screen.findByRole('button',{name:'Remover turma indisponível t1'}));
 expect(screen.getByLabelText('Título do plano').value).toBe(plano.titulo);
 expect(screen.queryByRole('button',{name:'Remover turma indisponível t1'})).toBeNull();
});
it('conflito permite reabrir versão atual mediante descarte explícito',async()=>{
 api.listarPlanos.mockResolvedValue({planos:[plano]});api.obterPlano.mockResolvedValueOnce({plano}).mockResolvedValueOnce({plano:{...plano,revision:2,objetivo:'Versão atual'}});
 api.salvarPlano.mockRejectedValue(Object.assign(new Error('O plano mudou.'),{status:409}));
 render(<PlanejarAula questoes={questoes} turmas={[{id:'t1',nome:'Turma 1'}]}/>);fireEvent.click(await screen.findByRole('button',{name:'Abrir Água em investigação'}));await waitFor(()=>expect(screen.getByLabelText('Título do plano').value).toBe(plano.titulo));
 fireEvent.change(screen.getByLabelText('Objetivo de aprendizagem'),{target:{value:'Edição local'}});fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));
 fireEvent.click(await screen.findByRole('button',{name:'Reabrir versão atual (descarta alterações locais)'}));
 await waitFor(()=>expect(screen.getByLabelText('Objetivo de aprendizagem').value).toBe('Versão atual'));
});
it('envio incerto bloqueia edição e repete o mesmo pedido',async()=>{
 api.listarPlanos.mockResolvedValue({planos:[plano]});api.obterPlano.mockResolvedValue({plano});api.salvarPlano.mockReset().mockRejectedValueOnce(new Error('Rede indisponível')).mockResolvedValueOnce({plano:{...plano,revision:2,objetivo:'Edição local'}});
 render(<PlanejarAula questoes={questoes} turmas={[{id:'t1',nome:'Turma 1'}]}/>);fireEvent.click(await screen.findByRole('button',{name:'Abrir Água em investigação'}));await waitFor(()=>expect(screen.getByLabelText('Título do plano').value).toBe(plano.titulo));
 fireEvent.change(screen.getByLabelText('Objetivo de aprendizagem'),{target:{value:'Edição local'}});fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));await screen.findByText('Rede indisponível');
 expect(screen.getByLabelText('Título do plano')).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'Salvar planejamento'}));await screen.findByText('Planejamento salvo na nuvem.');
 expect(api.gerarRequestId).toHaveBeenCalledTimes(1);expect(api.salvarPlano.mock.calls[0][0]).toEqual(api.salvarPlano.mock.calls[1][0]);
});
