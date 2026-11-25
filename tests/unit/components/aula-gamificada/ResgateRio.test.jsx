import React from 'react';
import { render,screen,fireEvent,cleanup } from '@testing-library/react';
import { describe,it,expect,vi,afterEach } from 'vitest';
import { ResgateRio } from '@/components/resgate/ResgateRio';
const q={imagem:{url:'/exemplo.svg',alt:'Mapa para interpretar'},id:'q1',enunciado:'Qual evidência sustenta a hipótese?',alternativas:[{id:'a',texto:'Comparar dados'},{id:'b',texto:'Ignorar dados'}]};
afterEach(cleanup);
describe('Resgate do Rio: experiência jogável acessível',()=>{
 it('investiga três estações e só então oferece desafio curricular',()=>{
  const enviar=vi.fn();render(<ResgateRio questao={q} indice={0} total={3} onEnviar={enviar}/>);
  expect(screen.queryByRole('group',{name:'Alternativas da questão'})).toBeNull();
  fireEvent.click(screen.getByText('Explorar pela lista acessível'));
  for(const nome of ['Coletar amostra','Ler mapa da bacia','Ouvir a guardiã']) fireEvent.click(screen.getByRole('button',{name:nome}));
  expect(screen.getByRole('group',{name:'Alternativas da questão'})).toBeTruthy();
  expect(screen.getByText(q.enunciado)).toBeTruthy();expect(screen.getByAltText('Mapa para interpretar').getAttribute('src')).toBe('/exemplo.svg');expect(enviar).not.toHaveBeenCalled();
 });
 it('checkpoint abre missão correta; feedback depende do recibo confirmado',()=>{
  render(<ResgateRio questao={q} indice={2} total={3} fase="feedback" recibo={{correta:false,pontuacao:0}}/>);
  expect(screen.getByText('3 / 3 · Recuperar o rio')).toBeTruthy();
  expect(screen.getByText(/Plano precisa de revisão/)).toBeTruthy();
  expect(screen.queryByRole('group',{name:'Alternativas da questão'})).toBeNull();
 });
});

import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';
it('integra projeção de sala e retomada solo usando experiência persistida',()=>{
 const estado={sala:{codigo:'RIO123',titulo:'Rio',modalidade:'quiz',experiencia:'resgate',fase:'pergunta',rodada:2,totalRodadas:3,semCronometro:true},rodada:{questao:q},semCronometro:true};
 render(<SalaAlunoView estado={estado}/>);
 expect(normalizarEstadoSala(estado).experiencia).toBe('resgate');
 expect(screen.getByText('2 / 3 · Conectar as evidências')).toBeTruthy();
 expect(screen.queryByRole('group',{name:'Alternativas da questão'})).toBeNull();
});
it('desafio bloqueado nunca envia respostas ou permite coleta',()=>{
 const enviar=vi.fn();render(<ResgateRio questao={q} indice={0} total={3} bloqueado onEnviar={enviar}/>);
 fireEvent.click(screen.getByText('Explorar pela lista acessível'));
 expect(screen.getByRole('button',{name:'Coletar amostra'}).disabled).toBe(true);
 expect(enviar).not.toHaveBeenCalled();
});

it('ausência de resposta não representa erro ou intervenção confirmada',()=>{
 render(<ResgateRio questao={q} indice={0} total={3} fase="feedback"/>);
 expect(screen.getByText(/Sem resposta registrada nesta rodada/)).toBeTruthy();
 expect(screen.queryByText(/Plano precisa de revisão/)).toBeNull();
});
