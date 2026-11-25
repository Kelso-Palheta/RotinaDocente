import {describe,it,expect} from 'vitest';
import {BIBLIOTECA,CATEGORIAS,criarRascunho} from '@/components/planejamento/modelos';
describe('Biblioteca pedagógica independente',()=>{
 it('preserva100 referências únicas em10 categorias com sínteses autorais',()=>{expect(BIBLIOTECA).toHaveLength(100);expect(new Set(BIBLIOTECA.map(m=>m.id)).size).toBe(100);expect(CATEGORIAS).toHaveLength(10);expect(BIBLIOTECA.every(m=>m.titulo&&m.resumo&&m.categoriaId)).toBe(true);});
 it('planejamento anual regular não exige jogo nem duração fictícia em minutos',()=>{const p=criarRascunho('normal','anual');expect(p.modalidade).toBeNull();expect(p.questaoIds).toEqual([]);expect(p.duracaoMinutos).toBeNull();expect(p.etapas).toHaveLength(4);expect(p.etapas.every(e=>e.prazo&&e.tipo==='desenvolvimento')).toBe(true);});
 it('aula regular contém desenvolvimento e gamificada permanece executável',()=>{expect(criarRascunho('normal','aula').etapas.some(e=>e.tipo==='jogo')).toBe(false);expect(criarRascunho('gamificado','aula').modalidade).toBe('quiz');});
});
