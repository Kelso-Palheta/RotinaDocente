/** Prévia sintética do componente real; não chama serviços de IA. */
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {writeFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {EditorVisualQuestao} from '@/components/adaptacoes/EditorVisualQuestao';
import {gerarDesenhoExato} from '@/dominio/adaptacoes/qualidadeVisual';
it('exporta prévia sintética do editor real',()=>{
 const plano={tipo:'fracao',total:4,partes:3,larguraCm:10,descricao:'Quatro partes iguais de um retângulo; três preenchidas.',elementosObrigatorios:'Preservar quatro partes iguais e três preenchidas.',restricoes:'Contornos nítidos; sem elementos decorativos.'};
 const d=gerarDesenhoExato(plano);const q={id:'sintetica',numero:1,enunciado:'Observe a figura e explique a relação entre as partes.',apoioVisualDescricao:'Retângulo dividido em partes iguais, com partes preenchidas e vazias.',imagemUrl:d.imagemUrl,planoVisual:plano,visual:{versao:2,origem:'desenho_exato',metadados:d.metadados,planoImagem:plano}};
 const html=renderToStaticMarkup(<main style={{maxWidth:1000,margin:'24px auto',padding:16}}><h1 style={{fontSize:24,fontWeight:800}}>Revisão de imagem adaptada</h1><p style={{margin:'8px 0'}}>Prévia com dados sintéticos. A figura ainda depende de conferência e aprovação do professor.</p><EditorVisualQuestao questao={q} professorId="sintetico" onChange={()=>{}} temChave={false} getAIHeaders={()=>({})}/></main>);
 expect(html).toContain('Pendente de revisão');if(process.env.RD_PREVIA_VISUAL)writeFileSync(process.env.RD_PREVIA_VISUAL,html);
});
