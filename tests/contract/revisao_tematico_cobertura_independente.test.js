import {it,expect} from 'vitest';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const arquivo=fileURLToPath(new URL('../../content/revisao-enem/aulas/vinculos.json',import.meta.url));
it('não oferece arquitetura medieval sob mercado de arte nem escultura arcaica como Cubismo/Futurismo sem cobertura',()=>{
 const mapa=JSON.parse(fs.readFileSync(arquivo,'utf8')).questoes;
 for(const id of ['enem-2024-ppl-arte-47','enem-2024-regular-arte-36']){const q=mapa.find(v=>v.questaoId===id);expect(q.situacao).toBe('pendente');expect(q.vinculos).toEqual([]);expect(q.observacao.length).toBeGreaterThan(50);}
});
