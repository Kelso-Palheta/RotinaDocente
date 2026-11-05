import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {BlocoAulaTematica} from '@/components/revisao/BlocoAulaTematica';
afterEach(cleanup);
it('exibe crédito e links de fonte/licença e permite ampliar a imagem',()=>{
 render(<BlocoAulaTematica bloco={{id:'b',titulo:'Obra',tipo:'imagem',imagemId:'i',texto:'Comentário'}} imagens={[{id:'i',url:'/api/revisao/conteudos/a/imagens/i',alt:'Obra',legenda:'Legenda',credito:'Foto: Maria',fonteUrl:'https://example.org/obra',licenca:'CC BY 4.0',licencaUrl:'https://creativecommons.org/licenses/by/4.0/'}]}/>);
 expect(screen.getByText('Foto: Maria')).toBeInTheDocument();expect(screen.getByRole('link',{name:/fonte da imagem/i})).toHaveAttribute('href','https://example.org/obra');expect(screen.getByRole('link',{name:/licença de uso/i})).toHaveAttribute('href','https://creativecommons.org/licenses/by/4.0/');expect(screen.getByRole('link',{name:/ampliar imagem/i})).toHaveAttribute('href','/api/revisao/conteudos/a/imagens/i');
});
