'use client';
import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const mecanismos = {
  'cubismo-futurismo':'perspectivas', 'forma-abstracao':'formas',
  'barroco-brasileiro':'luz', 'tradicao-academica':'perspectivas',
  'fotografia':'movimento', 'danca-moderna-contemporanea':'movimento', 'dancas-populares':'movimento',
  'musica-erudita-popular':'ritmo', 'musica-popular-regional':'ritmo', 'matrizes-africanas-musica':'ritmo',
  'hip-hop-rap-slam':'ritmo', 'rock-tropicalismo-festivais':'ritmo',
  'artes-graficas':'impressao', 'comunicacao-visual-audiovisual':'impressao', 'pop-art-apropriacao':'impressao',
  'arte-digital-tecnologia':'camadas', 'arquitetura-design':'camadas',
  'dada-surrealismo':'contexto', 'ready-made-conceitual':'contexto', 'instalacao-materiais':'contexto',
  'performance-participacao':'contexto', 'arte-urbana-publica':'contexto',
  'teatro-moderno-contemporaneo':'luz', 'teatro-dramaturgia':'luz', 'teatro-educacao':'contexto',
  'impressionismo':'pinceladas', 'expressionismo-figurativismo':'formas',
  'modernismo-brasileiro':'contexto', 'arte-afro-brasileira':'contexto', 'artes-indigenas':'contexto',
  'imagem-colonizacao-retrato':'perspectivas', 'culturas-populares-patrimonio':'contexto',
  'arte-sociedade-sistema':'contexto', 'arte-asiatica':'pinceladas',
};
const nomes = {perspectivas:'Planos e pontos de vista',formas:'Forma, cor e expressão',luz:'Luz, contraste e direção do olhar',movimento:'Corpo, tempo e movimento',ritmo:'Pulso, repetição e variação',impressao:'Matrizes, camadas e reprodução',camadas:'Elementos que constroem a experiência',contexto:'Objeto, contexto e participação',pinceladas:'Marcas, cor e percepção'};

/** Modelos conceituais originais, separados da reprodução documental. Nenhuma imagem é atribuída a artista. */
export function MecanismoVisual({ conteudoId, etapa }) {
  const gradiente = useId();
  const tipo = mecanismos[conteudoId];
  const reduzido = useReducedMotion();
  if (!tipo) return null;
  const p = Math.min(3, etapa);
  const transicao = { duration: reduzido ? 0 : .65, ease:'easeInOut' };
  const revelar = (i) => ({ opacity: i <= p ? 1 : .14 });
  return <div aria-label={`Animação explicativa: ${nomes[tipo]}`} data-mecanismo={tipo}>
    <svg viewBox="0 0 350 145" style={{width:'100%',height:84}} role="img" aria-label={`${nomes[tipo]} — modelo didático, etapa ${p+1}`}>
      <defs><linearGradient id={gradiente} x2="0" y2="1"><stop stopColor="#FFE14D" stopOpacity=".9"/><stop offset="1" stopColor="#FFE14D" stopOpacity=".08"/></linearGradient></defs>
      {tipo==='perspectivas' && <g>
        <motion.path initial={false} d="M140 23L200 30L235 103L165 128L115 83Z" fill="#6315D9" animate={{x:p>0?-25:0,rotate:p>1?-12:0}} transition={transicao}/>
        <motion.path initial={false} d="M170 25L227 50L205 120L166 96Z" fill="#FF2994" animate={{x:p>0?25:0,rotate:p>1?12:0}} transition={transicao}/>
        <motion.path initial={false} d="M120 80L190 52L180 111Z" fill="#00DDEB" animate={{x:p>1?-40:0,y:p>1?10:0}} transition={transicao}/>
        <motion.path initial={false} d="M170 54L208 70L194 96Z" fill="#FFE14D" animate={{x:p>2?45:0}} transition={transicao}/>
        <path d="M35 120H105M250 120H315" stroke="#25104A" strokeDasharray="4 4"/>
      </g>}
      {tipo==='formas' && <g>
        <motion.circle initial={false} cx="125" cy="70" r="44" fill="#FFE14D" animate={{cx:125+p*14}} transition={transicao}/>
        <motion.rect initial={false} x="156" y="25" width="72" height="90" fill="#6315D9" animate={{rotate:p*15,scale:1-p*.05}} transition={transicao}/>
        <motion.path initial={false} d="M110 120L180 12L245 120Z" fill="#FF2994" fillOpacity=".65" animate={{x:p*12,opacity:.3+p*.2}} transition={transicao}/>
        <path d="M40 115L70 70L90 100" stroke="#25104A" strokeWidth="4" fill="none"/>
      </g>}
      {tipo==='luz' && <g>
        <rect x="35" y="15" width="280" height="120" rx="16" fill="#25104A"/>
        <motion.path initial={false} d="M70 20L280 115L140 130Z" fill={`url(#${gradiente})`} animate={{opacity:.25+p*.25,x:p*5}} transition={transicao}/>
        <motion.circle initial={false} cx="183" cy="61" r="18" fill="#FFE14D" animate={revelar(1)} transition={transicao}/>
        <motion.path initial={false} d="M174 80Q150 100 148 120H240Q222 91 194 79Z" fill="#FF2994" animate={revelar(2)} transition={transicao}/>
        <motion.path initial={false} d="M90 110Q150 130 245 85" stroke="#00DDEB" strokeWidth="3" fill="none" animate={{pathLength:p>1?1:0}} transition={transicao}/>
      </g>}
      {tipo==='movimento' && <g>
        {[0,1,2,3].map((i)=><motion.g initial={false} key={i} animate={{...revelar(i),x:i<=p?0:-8}} transition={transicao}>
          <circle cx={55+i*80} cy={34+Math.sin(i)*9} r="10" fill={i===p?'#FF2994':'#6315D9'}/>
          <path d={`M${55+i*80} ${46+Math.sin(i)*9}l${i*4-4} 32m${4-i*4} -24l-18 16m18 -16l21 ${i*6}m-21 24l-19 35m19 -35l22 ${34-i*3}`} stroke={i===p?'#25104A':'#6315D9'} strokeWidth="5" fill="none" strokeLinecap="round"/>
        </motion.g>)}
        <motion.path initial={false} d="M30 132H320" stroke="#00A9B6" strokeWidth="3" animate={{pathLength:(p+1)/4}} transition={transicao}/>
      </g>}
      {tipo==='ritmo' && <g>
        {[0,1,2,3,4,5,6,7].map((i)=><motion.rect initial={false} key={i} x={35+i*36} y={70-(i%3+1)*12} width="21" height={(i%3+1)*24} rx="7" fill={i%2?'#6315D9':'#FF2994'} animate={{scaleY:i<=p*2+1?1:.2,opacity:i<=p*2+1?1:.25}} transition={transicao}/>)}
        <motion.path initial={false} d="M20 73Q40 10 60 73T100 73T140 73T180 73T220 73T260 73T300 73T340 73" stroke="#00A9B6" strokeWidth="2" fill="none" animate={{pathLength:(p+1)/4}} transition={transicao}/>
      </g>}
      {(tipo==='impressao'||tipo==='camadas') && <g>
        {['#00DDEB','#FF2994','#FFE14D','#6315D9'].map((cor,i)=><motion.rect initial={false} key={cor} x={90+i*22} y={15+i*14} width="125" height="75" rx={tipo==='impressao'?4:12} fill={cor} fillOpacity=".72" stroke="#FFFDF7" strokeWidth="2" animate={{x:p>1?(3-i)*5:0,y:p>1?(3-i)*-4:0,...revelar(i)}} transition={transicao}/>)}
        <motion.path initial={false} d="M45 125H310" stroke="#25104A" strokeWidth="2" animate={{pathLength:(p+1)/4}} transition={transicao}/>
      </g>}
      {tipo==='contexto' && <g>
        <motion.rect initial={false} x="122" y="25" width="105" height="92" rx="15" fill="#6315D9" animate={{scale:p>0?.68:1}} transition={transicao}/>
        {[['Público',55,70],['Espaço',175,18],['Sentido',295,70]].map(([nome,x,y],i)=><motion.g initial={false} key={nome} animate={revelar(i+1)} transition={transicao}>
          <path d={`M175 70L${x} ${y}`} stroke="#FF2994" strokeWidth="2" strokeDasharray="4 4"/>
          <circle cx={x} cy={y} r="20" fill="#FFE14D"/>
          <text x={x} y={y+34} textAnchor="middle" fontSize="11" fontWeight="800" fill="#25104A">{nome}</text>
        </motion.g>)}
      </g>}
      {tipo==='pinceladas' && <g>
        {Array.from({length:18},(_,i)=><motion.path initial={false} key={i} d={`M${42+(i%6)*47} ${35+Math.floor(i/6)*32}l25 ${i%2?9:-9}`} stroke={['#00A9B6','#6315D9','#FF2994','#E3BB00'][i%4]} strokeWidth="13" strokeLinecap="round" animate={{opacity:i<=(p+1)*5?1:.08,pathLength:i<=(p+1)*5?1:0}} transition={transicao}/>)}
      </g>}
    </svg>
    <p style={{fontSize:11,fontWeight:800,margin:'2px 0 10px',color:'#5c4878'}}>{nomes[tipo]}</p>
  </div>;
}
