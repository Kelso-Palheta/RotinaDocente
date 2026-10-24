import {it,expect,vi} from 'vitest';
import fs from 'node:fs';
vi.mock('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js',async()=>{
 const actual=await vi.importActual('../../frontend/node_modules/jspdf/dist/jspdf.node.min.js');
 return {jsPDF:function(...args){const doc=new actual.jsPDF(...args);doc.save=vi.fn();const text=doc.text.bind(doc);doc.text=vi.fn((...values)=>text(...values));return doc;}};
});
import {generateFichaAluno360PDF} from '@/lib/diario/fichaAlunoExport';
it('Ficha exporta ocorrência autorizada completa paginada e exclui internas/outros alunos',async()=>{
 const doc=await generateFichaAluno360PDF({aluno:{id:'a',nome:'Ana'},turma:{nome:'101',ocorrencias:[{id:'1',data:'2026-10-23',alunoIds:['a'],visivelFamilia:true,titulo:'Evolução',descricao:'Acompanhamento pedagógico. '.repeat(600)+'FIM DA OCORRÊNCIA'},{id:'2',visivelFamilia:false,alunoIds:['a'],titulo:'SEGREDO INTERNO',descricao:'Sigilo'},{id:'3',visivelFamilia:true,alunoIds:['b'],titulo:'OUTRO ESTUDANTE',descricao:'Privado'}]},parecerManual:'Parecer detalhado '.repeat(500)+'FIM DO PARECER'});
 const texto=doc.text.mock.calls.map(c=>c[0]).flat().join(' ');
 expect(texto).toContain('FIM DA OCORRÊNCIA');expect(texto).toContain('FIM DO PARECER');expect(texto).not.toContain('SEGREDO INTERNO');expect(texto).not.toContain('OUTRO ESTUDANTE');expect(doc.getNumberOfPages()).toBeGreaterThan(2);
 if(process.env.RD_PDF_FIXTURE_DIR){fs.mkdirSync(process.env.RD_PDF_FIXTURE_DIR,{recursive:true});fs.writeFileSync(`${process.env.RD_PDF_FIXTURE_DIR}/ficha-ocorrencias.pdf`,Buffer.from(doc.output('arraybuffer')));}
});
