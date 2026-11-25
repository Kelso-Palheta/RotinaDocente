import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {BlocoAulaTematica} from '@/components/revisao/BlocoAulaTematica';
import regional from '../../../../content/revisao-enem/aulas/conteudos/musica-popular-regional.json';
afterEach(cleanup);
const mostrar=(id)=>{const bloco=regional.blocos.find(b=>b.id===id);return <BlocoAulaTematica bloco={bloco} aula={{conteudoId:regional.id,tituloConteudo:regional.titulo}}/>;};
it('manguebeat ganha visual e conexões próprios; outro bloco muda composição e conceitos',()=>{
 const {rerender,container}=render(mostrar('exemplo-mangue'));
 expect(container.querySelector('img[src*="almeida-junior-violeiro"]')).toBeNull();
 expect(screen.queryByText('Cena musical')).not.toBeInTheDocument();
 expect(screen.getByTestId('conexoes-bloco').textContent).toMatch(/mangue|rock|funk|hip-hop|maracatu/i);
 const anterior=screen.getByTestId('conexoes-bloco').textContent;
 rerender(mostrar('exemplo-baiao'));
 expect(screen.getByTestId('conexoes-bloco').textContent).not.toBe(anterior);
});
it('anima unidades de texto e destaca conceitos sem perder acessibilidade ou reiniciar em heartbeat',()=>{
 const {container,rerender}=render(mostrar('exemplo-mangue'));
 const texto=screen.getByTestId('etapa-explicativa');
 expect(texto.querySelectorAll('[data-unidade-texto]').length).toBeGreaterThan(5);
 expect(texto.querySelector('mark')).not.toBeNull();
 const unidade=texto.querySelector('[data-unidade-texto]');
 rerender(mostrar('exemplo-mangue'));
 expect(screen.getByTestId('etapa-explicativa').querySelector('[data-unidade-texto]')).toBe(unidade);
 fireEvent.click(screen.getByRole('button',{name:'Próxima etapa'}));
 expect(screen.getByTestId('etapa-explicativa').querySelector('[data-unidade-texto]')).not.toBe(unidade);
 expect(container.textContent).toContain(regional.blocos.find(b=>b.id==='exemplo-mangue').texto);
});
