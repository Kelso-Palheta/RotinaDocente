import { describe, it, expect } from 'vitest';
import { missoes, missaoDoDesafio, iniciarExploracao, investigar, mover, distancia } from '@/dominio/resgate/expedicao';
describe('Resgate: exploração sem alterar avaliação', () => {
  it('distribui desafios em três missões e retoma pelo índice oficial', () => {
    expect(Array.from({length:6},(_,i)=>missaoDoDesafio(i,6))).toEqual([0,0,1,1,2,2]);
    expect(missaoDoDesafio(2,3)).toBe(2);
  });
  it('coleta perto da estação, não duplica e libera desafio só após investigar', () => {
    let s=iniciarExploracao(0); const m=missoes[0];
    expect(investigar(s,m.estacoes[0].id)).toEqual(s);
    for(const e of m.estacoes) {
      s=investigar({...s,posicao:{x:e.x,y:e.y}},e.id);
      expect(investigar(s,e.id).itens).toEqual(s.itens);
    }
    expect(s.itens).toHaveLength(3); expect(s.pronto).toBe(true);
    const primeira=m.estacoes[0];const relida=investigar({...s,posicao:primeira},primeira.id);
    expect(relida.itens).toEqual(s.itens);expect(relida.mensagem).toBe(primeira.pista);
    expect(s).not.toHaveProperty('pontos');
  });
  it('bloqueia atravessar o rio fora da ponte e permite ponte', () => {
    const a={...iniciarExploracao(0),posicao:{x:380,y:100}};
    expect(mover(a,60,0).posicao).toEqual(a.posicao);
    expect(mover({...a,posicao:{x:380,y:280}},60,0).posicao.x).toBe(440);
    expect(distancia({x:0,y:0},{x:3,y:4})).toBe(5);
  });
});
