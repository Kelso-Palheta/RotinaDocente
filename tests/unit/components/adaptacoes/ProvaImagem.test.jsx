import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {PainelMontadorProvas} from '@/components/adaptacoes/PainelMontadorProvas';
afterEach(cleanup);
it('prévia da prova preserva imagem e impede imprimir figura sem revisão',()=>{
 const imprimir=vi.spyOn(window,'print').mockImplementation(()=>{});
 render(<PainelMontadorProvas prova={{titulo:'Figura',questoes:[{id:'q',enunciado:'Observe',imagemUrl:'https://example.invalid/fig.png',apoioVisualDescricao:'Cena de referência'}]}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Visualizar & Imprimir'}));expect(screen.getByRole('img',{name:'Cena de referência'})).toHaveAttribute('src','https://example.invalid/fig.png');
 fireEvent.click(screen.getByRole('button',{name:'Imprimir / Salvar PDF'}));expect(imprimir).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent(/revisão/);imprimir.mockRestore();
});
