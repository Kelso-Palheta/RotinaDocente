import {it,expect,vi} from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {lerConteudoTematico,lerImagemConteudo} from '../../frontend/src/infraestrutura/revisao/acervoTematicoServidor';
it('hash muda com aula/cobertura e symlink para fora da pasta de imagens da aula é negado',async()=>{
 const src=fileURLToPath(new URL('../../content/revisao-enem',import.meta.url));const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'revisao-tematica-'));const raiz=path.join(tmp,'content/revisao-enem');
 try{
  await fs.mkdir(raiz,{recursive:true});await fs.cp(path.join(src,'questoes'),path.join(raiz,'questoes'),{recursive:true});await fs.cp(path.join(src,'aulas'),path.join(raiz,'aulas'),{recursive:true});vi.spyOn(process,'cwd').mockReturnValue(tmp);
  const primeiro=await lerConteudoTematico('impressionismo');const arq=path.join(raiz,'aulas/conteudos/impressionismo.json');const aula=JSON.parse(await fs.readFile(arq));aula.blocos[0].texto+=' Contexto ampliado.';await fs.writeFile(arq,JSON.stringify(aula));expect((await lerConteudoTematico('impressionismo')).hashFonte).not.toBe(primeiro.hashFonte);
  const segundo=await lerConteudoTematico('impressionismo');const mapaPath=path.join(raiz,'aulas/vinculos.json'),mapa=JSON.parse(await fs.readFile(mapaPath));const vinculo=mapa.questoes.find(q=>q.vinculos.some(v=>v.conteudoId==='impressionismo'));vinculo.observacao='Cobertura alterada';await fs.writeFile(mapaPath,JSON.stringify(mapa));expect((await lerConteudoTematico('impressionismo')).hashFonte).not.toBe(segundo.hashFonte);
  const img=aula.imagens[0],alvo=path.join(raiz,img.arquivo),outro=path.join(raiz,'questoes/arquivo-alheio.jpg');await fs.copyFile(alvo,outro);await fs.unlink(alvo);await fs.symlink(outro,alvo);await expect(lerImagemConteudo('impressionismo',img.id)).rejects.toMatchObject({status:422});
 }finally{vi.restoreAllMocks();await fs.rm(tmp,{recursive:true,force:true});}
},10000);
