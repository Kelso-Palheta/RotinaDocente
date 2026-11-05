import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import * as aluno from '@/components/revisao/PainelAluno';
import * as projecao from '@/components/revisao/TelaProjecao';
afterEach(cleanup);
const raiz = path.resolve(process.cwd(), 'src/components/revisao');
describe('Revisão independente do visual', () => {
  it('preserva exports padrão públicos', () => {
    expect(aluno.default).toBe(aluno.PainelAluno);
    expect(projecao.default).toBe(projecao.TelaProjecao);
  });
  it('não inventa um código válido quando a sala não foi carregada', () => {
    render(<projecao.TelaProjecao estado={{fase:'espera'}} />);
    expect(screen.queryByText('ARTE42')).not.toBeInTheDocument();
    expect(screen.getByText('------')).toBeInTheDocument();
  });
  it('atribui o mesmo destaque a participantes empatados', () => {
    const {container} = render(<aluno.PainelAluno estado={{fase:'ranking',conexao:'conectado',ranking:[
      {participanteId:'a',nomeExibicao:'Ana',posicao:1,pontos:10},
      {participanteId:'b',nomeExibicao:'Bia',posicao:1,pontos:10}
    ]}} />);
    const linhas = [...container.querySelectorAll('[data-posicao="1"]')];
    expect(linhas).toHaveLength(2);
    expect(linhas[0].className).toBe(linhas[1].className);
  });
  it('desativa também animações utilitárias e transições descendentes no modo reduzido', () => {
    const css=fs.readFileSync(path.join(raiz,'revisaoTema.module.css'),'utf8');
    const reduzido=css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduzido).toContain('.palco *');
    expect(reduzido).toContain('animation: none !important');
    expect(reduzido).toContain('transition: none !important');
  });
});
