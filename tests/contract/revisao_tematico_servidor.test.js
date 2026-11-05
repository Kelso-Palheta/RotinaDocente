import {it,expect,vi,afterEach} from 'vitest';
import {listarCatalogoTematico,lerConteudoTematico,lerImagemConteudo} from '../../frontend/src/infraestrutura/revisao/acervoTematicoServidor';
afterEach(()=>vi.restoreAllMocks());
it('metadados privados com vínculos por ID, hash incluindo aula e cobertura, sem corpo de aula',async()=>{
 const c=await listarCatalogoTematico();expect(c.conteudos).toHaveLength(34);expect(c.questoes.length).toBeGreaterThan(0);
 for(const q of c.questoes){expect(q.conteudoIds.length).toBeGreaterThan(0);expect(new Set(q.conteudoIds).size).toBe(q.conteudoIds.length);}
 const m=c.conteudos.find(a=>a.id==='impressionismo');expect(m.hashFonte).toMatch(/^[a-f0-9]{64}$/);expect(m.blocos).toBeUndefined();
 const a=await lerConteudoTematico(m.id);expect(a.hashFonte).toBe(m.hashFonte);expect(a.conteudo.blocos.length).toBeGreaterThan(3);a.conteudo.blocos=[];expect((await lerConteudoTematico(m.id)).conteudo.blocos.length).toBeGreaterThan(3);
});
it('imagem declarada mantém bytes reais; path ou imagem não declarada são recusados',async()=>{
 const {conteudo}=await lerConteudoTematico('impressionismo');const img=await lerImagemConteudo(conteudo.id,conteudo.imagens[0].id);expect(img.mime).toBe('image/jpeg');expect(img.buffer[0]).toBe(255);
 await expect(lerConteudoTematico('../segredo')).rejects.toMatchObject({status:400});await expect(lerImagemConteudo(conteudo.id,'inexistente')).rejects.toMatchObject({status:404});
});
