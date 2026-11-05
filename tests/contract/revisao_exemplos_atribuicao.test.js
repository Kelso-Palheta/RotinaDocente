import {it,expect} from 'vitest';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {publicarTematico} from '../../frontend/src/dominio/revisao/tematico';
it('preserva créditos e links de autor/licença no bloco publicado',()=>{
 const img={id:'i',alt:'Obra',legenda:'Legenda',credito:'Foto: Fotógrafo',fonteUrl:'https://example.org/obra',licenca:'CC BY-SA 4.0',licencaUrl:'https://creativecommons.org/licenses/by-sa/4.0/',autorUrl:'https://example.org/autor'};
 const sala={schemaVersion:2,codigo:'COD12345',indiceBloco:0,sequenciaAula:[{conteudoId:'a',blocoId:'b'}]};
 const p=publicarTematico({fase:'conteudo',rodada:{}},sala,{conteudo:{id:'a',titulo:'Aula',blocos:[{id:'b',tipo:'imagem',imagemId:'i'}],imagens:[img]}});
 expect(p.aula.bloco.imagens[0]).toMatchObject({credito:img.credito,fonteUrl:img.fonteUrl,licencaUrl:img.licencaUrl,autorUrl:img.autorUrl});
});
it('identifica corretamente local da Ceia e distingue fotógrafo da escultura em domínio público',()=>{
 const a=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../content/revisao-enem/aulas/conteudos/barroco-brasileiro.json',import.meta.url))));
 const ceia=a.imagens.find(i=>i.id==='ataide-ceia'),jonas=a.imagens.find(i=>i.id==='aleijadinho-jonas');expect(ceia.legenda).toMatch(/Caraça/);expect(ceia.legenda).toContain('1828');expect(jonas.licenca).toContain('CC BY-SA 4.0');expect(jonas.credito).toContain('Martin Thurnherr');
});
