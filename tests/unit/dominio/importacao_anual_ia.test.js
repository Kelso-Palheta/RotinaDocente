import {describe,it,expect} from 'vitest';
import {validarEntradaImportacaoAnual,montarPromptAnual,normalizarAnualImportado} from '@/dominio/aula-gamificada/importacaoAnual';
const fonte='Ciclo da água\nSaneamento básico\nFontes de energia\nEcossistemas e sustentabilidade';
const entrada=()=>({disciplina:'Ciências',anoEscolar:'8º ano',anoLetivo:2027,tipo:'normal',texto:fonte});
const resposta=()=>({bimestres:fonte.split('\n').map((texto,i)=>({numero:i+1,conteudos:[texto],objetivo:'Investigar evidências e discutir hipóteses.'}))});
describe('Currículo anual importado',()=>{
 it('valida entrada completa, limites e nunca aceita material vazio',()=>{expect(validarEntradaImportacaoAnual(entrada())).toMatchObject({disciplina:'Ciências',anoLetivo:2027});for(const texto of ['', 'a'.repeat(60001)])expect(()=>validarEntradaImportacaoAnual({...entrada(),texto})).toThrow();for(const campo of ['disciplina','anoEscolar'])expect(()=>validarEntradaImportacaoAnual({...entrada(),[campo]:''})).toThrow();});
 it('prompt isola fonte como dado e proíbe currículo inventado',()=>{const p=montarPromptAnual(validarEntradaImportacaoAnual(entrada()));expect(p.systemPrompt).toMatch(/instruções.*material|material.*instruções/i);expect(p.systemPrompt).toMatch(/literal/i);expect(p.prompt).toContain(fonte);});
 it.each(['normal','gamificado'])('gera anual %s válido em quatro períodos sem identidade da IA',tipo=>{const json={...resposta(),id:'forjado',professorId:'outro',vinculoAnual:{planoId:'alheio'},apiKey:'segredo'};const {rascunho,avisos}=normalizarAnualImportado(json,validarEntradaImportacaoAnual({...entrada(),tipo}));expect(rascunho).toMatchObject({integracaoAnual:1,abrangencia:'planejamento',escala:'anual',tipo,disciplina:'Ciências',anoLetivo:2027,questaoIds:[]});expect(rascunho.etapas).toHaveLength(4);expect(rascunho.etapas[1].curriculo.conteudos).toBe('Saneamento básico');expect(rascunho).not.toHaveProperty('id');expect(rascunho).not.toHaveProperty('vinculoAnual');expect(JSON.stringify(rascunho)).not.toContain('segredo');expect(avisos.length).toBeGreaterThan(0);});
 it('recusa tema inventado, duplicado, bimestre ausente/repetido e JSON truncado',()=>{const e=validarEntradaImportacaoAnual(entrada());for(const json of [null,{}, {bimestres:resposta().bimestres.slice(0,3)}, {bimestres:resposta().bimestres.map(b=>({...b,numero:1}))}, {bimestres:resposta().bimestres.map(b=>({...b,conteudos:['Inventado']}))}, {bimestres:resposta().bimestres.map(b=>({...b,conteudos:['Ciclo da água']}))}])expect(()=>normalizarAnualImportado(json,e)).toThrow();});
 it('tolera caixa e espaços, mas não palavras adicionais',()=>{const json=resposta();json.bimestres[0].conteudos=['CICLO   DA ÁGUA'];expect(()=>normalizarAnualImportado(json,validarEntradaImportacaoAnual(entrada()))).not.toThrow();json.bimestres[0].conteudos=['Ciclo da água e astronomia'];expect(()=>normalizarAnualImportado(json,validarEntradaImportacaoAnual(entrada()))).toThrow();});
});
it('preserva retomadas em bimestres diferentes quando o currículo as repete explicitamente',()=>{
 const texto=[1,2,3,4].map(n=>`${n}º bimestre: Leitura e interpretação`).join('\n');
 const e=validarEntradaImportacaoAnual({disciplina:'Português',anoEscolar:'8º ano',anoLetivo:2027,tipo:'normal',texto});
 const json={bimestres:[1,2,3,4].map(numero=>({numero,conteudos:['Leitura e interpretação'],objetivo:'Ler e interpretar'}))};
 expect(normalizarAnualImportado(json,e).rascunho.etapas).toHaveLength(4);
});
it('não aceita palavra nova extraída de dentro de outra palavra',()=>{
 const e=validarEntradaImportacaoAnual({...entrada(),texto:'Parte de um argumento. Saneamento básico. Fontes de energia. Ecossistemas e sustentabilidade.'});
 const json=resposta();json.bimestres[0].conteudos=['Arte'];expect(()=>normalizarAnualImportado(json,e)).toThrow();
});
