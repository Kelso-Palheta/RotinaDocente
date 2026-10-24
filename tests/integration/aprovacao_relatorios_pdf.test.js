import { expect, it, vi } from 'vitest';
import fs from 'node:fs';
const docs=vi.hoisted(()=>[]);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js',async()=>{
 const actual=await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
 return {jsPDF:function(...args){const doc=new actual.jsPDF(...args);doc.save=vi.fn();const text=doc.text.bind(doc);doc.text=vi.fn((...values)=>text(...values));docs.push(doc);return doc;}};
});
import { generateBoletimPDF } from '@/lib/aluno/boletim-pdf';
import { generateFichaAluno360PDF } from '@/lib/diario/fichaAlunoExport';
import { generateCadernetaPDF } from '@/lib/diario/caderneta-export';
import { calcDesempenhoAnual } from '@/utils/diario/calculos';
it.each([[5,5,null,null],[5,5,5,5]])('relatórios com notas %j não confundem aprovação semestral e anual',async(...args)=>{
 const valores=args.slice(0,4);
 const turma={id:'t',nome:'301',alunos:[{id:'a',nome:'Ana Exemplo'}],bimestres:Object.fromEntries(valores.map((n,i)=>[i+1,{atividades:[],notas:{a:{simulado:n}}}]))};
 const d=calcDesempenhoAnual(turma,'a');
 docs.length=0;
 generateBoletimPDF({nomeAluno:'Ana Exemplo',...d});
 await generateFichaAluno360PDF({aluno:turma.alunos[0],turma});
 await generateCadernetaPDF(turma);
 for(const [i,doc] of docs.entries()){
  const texto=doc.text.mock.calls.map(call=>call[0]).flat().join(' ').toLowerCase();
  expect(texto).toContain('aprovado');
  expect(texto).not.toContain('recuperação');
  if(valores[2]===null)expect(texto).toContain('em andamento');
  if(process.env.RD_SEMESTRE_PDF_DIR){fs.mkdirSync(process.env.RD_SEMESTRE_PDF_DIR,{recursive:true});fs.writeFileSync(`${process.env.RD_SEMESTRE_PDF_DIR}/${valores[2]===null?'parcial':'anual'}-${i}.pdf`,Buffer.from(doc.output('arraybuffer')));}
 }
});
it('caderneta reserva espaço entre a última linha ampliada e as assinaturas',async()=>{
 const alunos=Array.from({length:14},(_,i)=>({id:`a${i}`,nome:`Aluno ${i+1}`}));
 await generateCadernetaPDF({nome:'301',alunos,bimestres:{}});
 const doc=docs.at(-1);
 const ultimaLinha=doc.text.mock.calls.find(call=>String(call[0]).startsWith('14. '));
 const assinatura=doc.text.mock.calls.find(call=>call[0]==='Assinatura do(a) Professor(a) Regente');
 expect(doc.getNumberOfPages()>1 || assinatura[2]-4>=ultimaLinha[2]+6.5).toBe(true);
});
