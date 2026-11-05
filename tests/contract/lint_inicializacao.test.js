import {it,expect} from 'vitest';
import {ESLint} from '../../frontend/node_modules/eslint/lib/api.js';
import {fileURLToPath} from 'node:url';
it('elimina os erros históricos sem desativar as regras oficiais',async()=>{
 const cwd=fileURLToPath(new URL('../../frontend/',import.meta.url));
 const eslint=new ESLint({cwd});
 const resultados=await eslint.lintFiles(['src/app/aluno/page.js','src/components/acessibilidade/BotaoLeitorVoz.jsx','src/components/adaptacoes/ModalAlunoPEI.jsx','src/components/adaptacoes/ModalImportarAtividadeTurma.jsx','src/components/adaptacoes/ModalNovaQuestao.jsx','src/components/ai/ModalConectarIA.jsx','src/lib/auth-context.js']);
 const erros=resultados.flatMap(r=>r.messages.filter(m=>m.severity===2).map(m=>({arquivo:r.filePath,regra:m.ruleId,linha:m.line})));
 expect(erros).toEqual([]);
},30000);
