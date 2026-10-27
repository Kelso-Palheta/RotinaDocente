import {it,expect,vi} from 'vitest';
const docs=vi.hoisted(()=>[]);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js',async()=>{const real=await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');return{jsPDF:function(...args){const d=new real.jsPDF(...args);const texto=d.text.bind(d);d.text=vi.fn((...a)=>texto(...a));d.save=vi.fn();docs.push(d);return d;}};});
import {generateBoletimPDF} from '@/lib/aluno/boletim-pdf';
it('boletim não transforma redação parcial em nota nula sobre 1000',()=>{
 generateBoletimPDF({redacao:{essayTheme:'Tema parcial',totalScore:null,modo:'parcial',scoreData:[{subject:'C3',A:120}]}});
 const texto=docs.at(-1).text.mock.calls.map(c=>c[0]).flat().join(' ');
 expect(texto).toContain('Avaliação parcial');expect(texto).not.toContain('null / 1000');
});
