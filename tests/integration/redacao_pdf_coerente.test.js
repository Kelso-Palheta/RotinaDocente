import { it,expect,vi,beforeEach } from 'vitest';
const docs=vi.hoisted(()=>[]);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js',async()=>{const real=await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');return{jsPDF:function(...a){const d=new real.jsPDF(...a);const text=d.text.bind(d);d.text=vi.fn((...args)=>text(...args));d.save=vi.fn();docs.push(d);return d;}};});
import { generatePDF } from '@/lib/redacao/pdf-generator';
const scores=[1,2,3,4,5].map(n=>({subject:`C${n}`,A:160,fullMark:200}));
const texto=()=>docs.at(-1).text.mock.calls.map(c=>c[0]).flat().join(' ');
beforeEach(()=>{docs.length=0;});
it('relatório usa nota validada, data original e versão, com cabeçalhos longos e conteúdo paginados',()=>{
 const d=generatePDF('Devolutiva '.repeat(3000)+'FIM DA DEVOLUTIVA','Nome longo '.repeat(40),'101','Tema longo '.repeat(40),scores,{createdAt:'2025-03-15T12:00:00Z',revision:3,totalScore:800,status:'publicado'});
 expect(d).toBe(docs[0]);expect(d.getNumberOfPages()).toBeGreaterThan(2);expect(texto()).toContain('15/03/2025');expect(texto()).toContain('Versão 3');expect(texto()).toContain('800 / 1000');expect(texto()).toContain('FIM DA DEVOLUTIVA');expect(d.save).toHaveBeenCalledOnce();
});
it('parcial e nota inválida não aparecem como total ENEM completo',()=>{
 generatePDF('Feedback','Ana','101','Tema',scores.slice(0,1),{modo:'parcial',totalScore:null});
 expect(texto()).toContain('Avaliação parcial');expect(texto()).not.toContain('/ 1000');
 generatePDF('Feedback','Ana','101','Tema',scores,{totalScore:999});
 expect(texto()).not.toContain('800 / 1000');expect(texto()).toContain('Conferir notas');
});
