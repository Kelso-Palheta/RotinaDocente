import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import {it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {ConferirConteudoTematico} from '@/components/revisao/ConferirConteudoTematico';

it('conferência repassa referências corretas e renderiza todas as imagens das aulas reais',()=>{
 const dir=path.resolve(process.cwd(),'../content/revisao-enem/aulas/conteudos');let total=0;
 try{for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
  const aula=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));aula.imagens=aula.imagens.map(i=>({...i,url:`/api/revisao/conteudos/${aula.id}/imagens/${i.id}`}));
  render(<ConferirConteudoTematico conteudo={aula}/>);
  const imagens=screen.getAllByRole('img');expect(imagens.length,aula.id).toBe(aula.imagens.length);
  for(const i of aula.imagens)expect(imagens.some(el=>el.getAttribute('src')===i.url),`${aula.id}/${i.id}`).toBe(true);
  expect(screen.queryByText('Imagem contextual associada ao bloco')).toBeNull();total+=imagens.length;cleanup();
 }expect(total).toBeGreaterThanOrEqual(38);}finally{cleanup();}
},15000);
