import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {PodioRevisao} from '@/components/revisao/PodioRevisao';
afterEach(cleanup);
it('pódio destaca posições1a3 por acertos e preserva empates',()=>{render(<PodioRevisao ranking={[{participanteId:'a',nomeExibicao:'Ana',pontos:3000,posicao:1},{participanteId:'b',nomeExibicao:'Bia',pontos:3000,posicao:1},{participanteId:'c',nomeExibicao:'Caio',pontos:2000,posicao:3},{participanteId:'d',nomeExibicao:'Davi',pontos:1000,posicao:4}]}/>);expect(screen.getByText('Ana')).toBeInTheDocument();expect(screen.getByText('Bia')).toBeInTheDocument();expect(screen.getByText('Caio')).toBeInTheDocument();expect(screen.queryByText('Davi')).toBeNull();expect(screen.getAllByText('3 acertos').length).toBe(2);});
