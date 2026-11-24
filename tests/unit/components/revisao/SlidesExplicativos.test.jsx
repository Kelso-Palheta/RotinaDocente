import React from 'react';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlocoAulaTematica } from '@/components/revisao/BlocoAulaTematica';
import { ControlesSala } from '@/components/revisao/ControlesSala';
const texto = 'A fotografia registra um instante. A sequência permite comparar posições. O intervalo transforma a percepção. Observe as mudanças entre quadros.';
const bloco = { id: 'movimento', tipo: 'texto', titulo: 'O movimento em imagens', texto };
const apresentacao = { etapa: 1, totalEtapas: 4, automatica: false, intervaloMs: 8000, etapaBase: 1, iniciadaEmMs: 0, agoraServidorMs: 1000 };
afterEach(cleanup);
describe('slides explicativos', () => {
  it('exibe etapa compartilhada, imagem real e mantém texto integral para estudo', () => {
    render(<BlocoAulaTematica bloco={bloco} aula={{conteudoId:'fotografia', tituloConteudo:'Fotografia', apresentacao}} />);
    expect(screen.getByTestId('etapa-explicativa')).toHaveTextContent('A sequência permite comparar posições.');
    expect(screen.getByText(texto)).toBeInTheDocument();
    expect(screen.getAllByRole('img')[0].getAttribute('src')).toMatch(/^\/revisao\/visuais\//);
    expect(screen.getByText(/Texto completo para estudo/)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name:'Próxima etapa'})).not.toBeInTheDocument();
  });
  it('prévia tem navegação local separada de comandos da sala', () => {
    render(<BlocoAulaTematica bloco={bloco} aula={{conteudoId:'fotografia'}} />);
    fireEvent.click(screen.getByRole('button', {name:'Próxima etapa'}));
    expect(screen.getByTestId('etapa-explicativa')).toHaveTextContent('A sequência permite comparar posições.');
    fireEvent.click(screen.getByRole('button', {name:'Repetir explicação'}));
    expect(screen.getByTestId('etapa-explicativa')).toHaveTextContent('A fotografia registra um instante.');
  });
  it('preserva imagem e atribuição de bloco legado; rejeita protocolo inseguro', () => {
    const props = {bloco:{...bloco, tipo:'imagem', imagemId:'legado'}, imagens:[{id:'legado',url:'javascript:alert(1)',legenda:'Obra antiga',credito:'Autor antigo'}]};
    const {rerender} = render(<BlocoAulaTematica {...props} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(<BlocoAulaTematica {...props} imagens={[{...props.imagens[0],url:'/api/revisao/legado.jpg'}]} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/api/revisao/legado.jpg');
    expect(screen.getByText('Autor antigo')).toBeInTheDocument();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('status')).toHaveTextContent(/Imagem indisponível/);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });
  it('controles docentes enviam ações de explicação e bloqueiam sem conexão', () => {
    const onAcao=vi.fn();
    const estado={fase:'conteudo',conexao:'conectado',sala:{duracaoSegundos:60},aula:{apresentacao},rodada:{numero:1,total:2}};
    const {rerender}=render(<ControlesSala estado={estado} onAcao={onAcao} />);
    fireEvent.click(screen.getByRole('button',{name:'Próxima etapa'}));
    fireEvent.click(screen.getByRole('button',{name:'Reprodução automática'}));
    expect(onAcao.mock.calls).toEqual([['avancar_explicacao'],['reproduzir_explicacao']]);
    rerender(<ControlesSala estado={{...estado,conexao:'reconectando'}} onAcao={onAcao} />);
    expect(screen.getByRole('button',{name:'Próxima etapa'})).toBeDisabled();
  });
});

it('em sala legada não cria controles locais; esquema substituído recebe explicação compatível com fotografia',()=>{
 const bloco={id:'esquema',tipo:'imagem',imagemId:'esquema-fronteiras',titulo:'Música',texto:'Observe as caixas do esquema. Veja a seta entre elas. Leia os conceitos. Compare as caixas.'};
 render(<BlocoAulaTematica bloco={bloco} aula={{conteudoId:'musica-erudita-popular',bloco}} imagens={[{id:'esquema-fronteiras',url:'/api/revisao/esquema.png'}]}/>);
 expect(screen.queryByRole('button',{name:'Próxima etapa'})).not.toBeInTheDocument();
 expect(screen.getByTestId('etapa-explicativa')).not.toHaveTextContent('caixas do esquema');
 expect(screen.getByText(bloco.texto)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Esquema original do acervo'})).toHaveAttribute('href','/api/revisao/esquema.png');
});
