import {it,expect} from 'vitest';
import {contemAcervoPrivado} from '../../scripts/lib/revisao-bundle.mjs';
it('palavras genéricas de atribuição não significam acervo privado no cliente',()=>{expect(contemAcervoPrivado('Autor da fotografia',{idsQuestoes:['enem-2025-regular-arte-15'],textosAulas:['Explicação privada e completa da aula.']})).toBe(false);});
it('ID real de questão ou texto privado de aula, inclusive escapado, impedem publicação',()=>{const p={idsQuestoes:['enem-2025-regular-arte-15'],textosAulas:['Primeiro parágrafo\nSegundo parágrafo.']};for(const js of ['"enem-2025-regular-arte-15"',p.textosAulas[0],JSON.stringify(p.textosAulas[0])])expect(contemAcervoPrivado(js,p)).toBe(true);});
