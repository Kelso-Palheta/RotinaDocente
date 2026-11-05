import {it,expect} from 'vitest';
import config from '../../frontend/next.config.mjs';
it('inclui o acervo privado apenas no trace da API de revisão',()=>{
 expect(config.outputFileTracingRoot).toMatch(/RotinaDocente$/);
 const includes=config.outputFileTracingIncludes;
 expect(includes['/api/revisao/*']).toContain('../content/revisao-enem/**/*');
 expect(includes['/*']).toBeUndefined();
});
