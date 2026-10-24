import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
const docs=vi.hoisted(()=>[]);
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js',async()=>{
 const actual=await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
 return {jsPDF:function(...args){const doc=new actual.jsPDF(...args);doc.save=vi.fn();const originalText=doc.text.bind(doc);doc.text=vi.fn((...values)=>originalText(...values));docs.push(doc);return doc;}};
});
import {generateBoletimPDF} from '@/lib/aluno/boletim-pdf';
import {generateFichaAluno360PDF} from '@/lib/diario/fichaAlunoExport';
const historico=[{titulo:'Atividade de Arte',bimestre:3,nota:1,notaMaxima:2,tipoCorrecao:'manual',feedback:'Comentário geral do professor.',questoes:[{numero:1,enunciado:'Explique o tema.',resposta:'Resposta do aluno.',nota:1,notaMaxima:2,feedback:'Comentário detalhado '.repeat(500)+'FIM DO FEEDBACK LONGO'}]}];
it('boletim e Ficha 360 incluem feedback completo com paginação',async()=>{
 const aluno={id:'a',nome:'Ana Exemplo'};const turma={id:'t',nome:'301',alunos:[aluno],bimestres:{}};
 generateBoletimPDF({nomeAluno:aluno.nome,turmaNome:turma.nome,historicoAtividades:historico});
 await generateFichaAluno360PDF({aluno,turma,historicoAtividades:historico});
 expect(docs).toHaveLength(2);
 for(const [i,doc] of docs.entries()){
  expect(doc.getNumberOfPages()).toBeGreaterThan(2);
  const texto=doc.text.mock.calls.map(call=>call[0]).flat().join(' ').replace(/\s+/g,' ');
  expect(texto).toContain('FIM DO FEEDBACK LONGO');
  expect(texto).toContain('Resposta do aluno.');
  if(process.env.RD_PDF_FIXTURE_DIR){
   fs.mkdirSync(process.env.RD_PDF_FIXTURE_DIR,{recursive:true});
   fs.writeFileSync(path.join(process.env.RD_PDF_FIXTURE_DIR,i?'ficha-feedback.pdf':'boletim-feedback.pdf'),Buffer.from(doc.output('arraybuffer')));
  }
 }
});
