import { describe, expect, it } from 'vitest';
import { gerarDesenhoExato, aprovarImagem, imagemAprovada, pendenciasVisuais, medirDpi, assinaturaVisual } from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
const questao = () => ({ id:'q1', enunciado:'Conte os objetos.', apoioVisualDescricao:'Objetos separados', imagemUrl:'data:image/png;base64,eA==', planoVisual:{tipo:'ilustracao',descricao:'Objetos separados',larguraCm:10}, visual:{versao:2,obrigatoria:true,metadados:{width:1536,height:1024},historico:[]} });
describe('RN72: revisão visual por versão',()=>{
 it('aprovação exige descrição, imagem e resolução suficiente e invalida ao mudar questão/plano',()=>{
  const q=questao();expect(imagemAprovada(q)).toBe(false);
  const a=aprovarImagem(q,'professor');expect(imagemAprovada(a)).toBe(true);expect(q.visual.aprovacao).toBeUndefined();
  expect(imagemAprovada({...a,enunciado:'Outra pergunta'})).toBe(false);
  expect(imagemAprovada({...a,planoVisual:{...a.planoVisual,descricao:'Outra cena'}})).toBe(false);
  expect(assinaturaVisual(a)).not.toBe(assinaturaVisual({...a,imagemUrl:'outra'}));
 });
 it('bloqueia figura obrigatória sem imagem/revisão e rejeita tamanho insuficiente',()=>{
  const q=questao();expect(pendenciasVisuais([q])).toHaveLength(1);
  expect(()=>aprovarImagem({...q,imagemUrl:''},'p')).toThrow();
  expect(()=>aprovarImagem({...q,visual:{...q.visual,metadados:{width:1,height:1}}},'p')).toThrow(/resolu|tamanho/i);
  expect(pendenciasVisuais([aprovarImagem(q,'p')])).toEqual([]);
  expect(medirDpi(1182,10)).toBeGreaterThanOrEqual(300);
 });
 it('legado com figura não recebe aprovação implícita',()=>expect(imagemAprovada({imagemUrl:'https://example.invalid/a.png'})).toBe(false));
});
describe('RN72: desenhos exatos',()=>{
 it('gera exatamente três elementos sem texto fornecido pelo usuário virar SVG executável',()=>{
  const d=gerarDesenhoExato({tipo:'contagem',quantidade:3});expect(d.svg.match(/data-objeto=/g)).toHaveLength(3);expect(d.metadados.width).toBeGreaterThanOrEqual(1536);
  expect(()=>gerarDesenhoExato({tipo:'contagem',quantidade:0})).toThrow();
 });
 it('fração preserva partes e preenchimento; rejeita dados inválidos',()=>{
  const d=gerarDesenhoExato({tipo:'fracao',total:4,partes:3});expect(d.svg.match(/data-parte=/g)).toHaveLength(4);expect(d.svg.match(/data-preenchida="true"/g)).toHaveLength(3);
  expect(()=>gerarDesenhoExato({tipo:'fracao',total:4,partes:5})).toThrow();
 });
 it('gráfico usa valores exatos e escapa rótulos; geometria respeita medidas',()=>{
  const d=gerarDesenhoExato({tipo:'grafico',dados:[{rotulo:'<script>',valor:2},{rotulo:'B',valor:5}]});expect(d.svg).toContain('&lt;script&gt;');expect(d.svg).not.toContain('<script>');expect(d.svg).toContain('data-valor="5"');
  expect(()=>gerarDesenhoExato({tipo:'grafico',dados:[{valor:NaN}]})).toThrow();
  expect(gerarDesenhoExato({tipo:'geometria',forma:'retangulo',largura:4,altura:2}).svg).toContain('data-largura="4"');
 });
});
