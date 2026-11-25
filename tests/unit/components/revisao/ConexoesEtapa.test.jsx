import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {ConexoesDoBloco} from '@/components/revisao/ConexoesDoBloco';
afterEach(cleanup);
const cena={tituloVisual:'Baião e identidade',tipoCena:'relacoes',destaques:['Luiz Gonzaga','baião','rádio','seca, migração, festa e saudade']};
it('ativa somente os conceitos da frase corrente; não força conceito quando nenhum corresponde',()=>{
 const {container,rerender}=render(<ConexoesDoBloco cena={cena} etapa={1} totalEtapas={4} textoEtapa="As letras tratam de seca, migração, festa e saudade."/>);
 const ativos=()=>[...container.querySelectorAll('li[data-ativo=true]')].map(el=>el.textContent);
 expect(ativos()).toHaveLength(1);expect(ativos()[0]).toContain('seca, migração, festa e saudade');
 rerender(<ConexoesDoBloco cena={cena} etapa={2} totalEtapas={4} textoEtapa="A sanfona ajuda a reconhecer a instrumentação."/>);
 expect(ativos()).toHaveLength(0);
 rerender(<ConexoesDoBloco cena={cena} etapa={0} totalEtapas={4} textoEtapa="Luiz Gonzaga difundiu o baião pelo rádio."/>);
 expect(ativos()).toHaveLength(3);
});
