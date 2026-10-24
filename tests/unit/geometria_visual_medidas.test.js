import {expect,it} from 'vitest';
import {gerarDesenhoExato} from '../../frontend/src/dominio/adaptacoes/qualidadeVisual';
it('círculo não ignora silenciosamente medidas incompatíveis',()=>{
 expect(()=>gerarDesenhoExato({tipo:'geometria',forma:'circulo',largura:4,altura:2})).toThrow(/círculo|iguais/i);
 expect(gerarDesenhoExato({tipo:'geometria',forma:'circulo',largura:4,altura:4}).svg).toContain('<circle');
});
