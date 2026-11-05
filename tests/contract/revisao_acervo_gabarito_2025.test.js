import fs from 'node:fs';
import {expect,it} from 'vitest';
it('preserva o gabarito oficial B para 2025 azul questão 41',()=>{
 const q=JSON.parse(fs.readFileSync(new URL('../../content/revisao-enem/questoes/enem-2025-regular-arte-41.json',import.meta.url),'utf8'));
 expect(q.gabarito).toBe('B');
 expect(q.explicacoes.B).toContain('herança');
 expect(q.revisao.explicacoes).toBe(false);
});
