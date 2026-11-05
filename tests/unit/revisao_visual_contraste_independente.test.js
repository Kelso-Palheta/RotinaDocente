import fs from 'node:fs';
import path from 'node:path';
import {describe,it,expect} from 'vitest';
const raiz=path.resolve(process.cwd(),'src/components/revisao');
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const sobre=(f,b,a)=>f.map((v,i)=>v*a+b[i]*(1-a));
const luminancia=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contraste=(a,b)=>(Math.max(luminancia(a),luminancia(b))+.05)/(Math.min(luminancia(a),luminancia(b))+.05);
describe('Contraste independente de superfícies efetivamente usadas',()=>{
 it('não usa texto coral sobre a própria cor translúcida',()=>{
  for(const arquivo of ['PainelAluno.jsx','TelaProjecao.jsx']){
   const fonte=fs.readFileSync(path.join(raiz,arquivo),'utf8');
   expect(fonte).not.toMatch(/text-\[#FF4F9B\] bg-\[#FF4F9B\]\/20|bg-\[#FF4F9B\]\/30 text-\[#FF4F9B\]/);
  }
 });
 it('confere opacidades e hover sem reutilizar a calculadora da implementação',()=>{
  const palco=rgb('#25104A'),card=sobre(rgb('#6334E3'),palco,.25);
  for(const [texto,fundo] of [
   [rgb('#25104A'),rgb('#FF4F9B')],
   [rgb('#25104A'),rgb('#FF80B6')],
   [rgb('#FFFDF7'),sobre(rgb('#B7F247'),card,.2)],
   [rgb('#B7F247'),sobre(rgb('#B7F247'),card,.2)],
   [rgb('#00DDEB'),sobre(rgb('#6334E3'),card,.5)],
   [sobre(rgb('#FFFDF7'),card,.6),card],
  ])expect(contraste(texto,fundo)).toBeGreaterThanOrEqual(4.5);
 });
});
