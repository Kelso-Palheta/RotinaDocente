import React from 'react';
function Icone({tipo}) {
  if(tipo==='folha')return <><path d="M-15 12 Q-23-22 19-22 Q25 12-15 12" fill="#72CF48"/><path d="M-14 16 12-13" stroke="#184D40" strokeWidth="4"/></>;
  if(tipo==='frasco')return <><path d="M-5-20V-8L-17 13Q-19 22 0 22T17 13L5-8V-20" fill="#D9FFFF" stroke="#124E66" strokeWidth="3"/><path d="M-13 7H13L17 15Q16 20 0 20T-17 15Z" fill="#20D8CD"/></>;
  if(tipo==='pessoa')return <><circle cy="-12" r="10" fill="#A66647"/><path d="M-19 23Q-19 0 0 0T19 23" fill="#FFCA48"/><path d="M-13-18Q0-36 13-18" fill="#25104A"/></>;
  if(tipo==='casa')return <><path d="M-24-5 0-25 24-5Z" fill="#F88257"/><path d="M-19-5H19V23H-19Z" fill="#FFF2C8"/><path d="M-5 23V5H6V23" fill="#5D3B6B"/></>;
  if(tipo==='sensor')return <><rect x="-14" y="-22" width="28" height="41" rx="6" fill="#203854"/><rect x="-9" y="-16" width="18" height="18" rx="2" fill="#6FF1DF"/><path d="M-7-6 0-10 7-5" fill="none" stroke="#146C6F" strokeWidth="2"/><circle cy="11" r="3" fill="#FFE44E"/></>;
  return <><path d="M-23-17-7-22 8-17 23-22V18L8 23-7 18-23 23Z" fill="#FFF2C8" stroke="#725248" strokeWidth="3"/><path d="M-7-22V18M8-17V23M-17 10 0-7 15 5" fill="none" stroke="#24A9AA" strokeWidth="3"/></>;
}
export function CenarioRio({missao,exploracao,feedback,correta,onEstacao}) {
 return <svg viewBox="0 0 1000 560" role="img" aria-label={`Mapa da missão: ${missao.titulo}. Use os controles ou a lista acessível.`} className="resgate-mapa">
  <defs><linearGradient id="resgate-terra" x2="1" y2="1"><stop stopColor="#C6E8A5"/><stop offset="1" stopColor="#70B997"/></linearGradient><linearGradient id="resgate-agua"><stop stopColor={feedback&&!correta?'#758C96':'#249EB8'}/><stop offset=".5" stopColor={feedback&&!correta?'#A8A58A':'#67E3DD'}/><stop offset="1" stopColor="#207FA4"/></linearGradient><pattern id="resgate-ondas" width="65" height="55" patternUnits="userSpaceOnUse"><path d="M8 20Q22 11 38 20T65 20" fill="none" stroke="white" strokeOpacity=".35" strokeWidth="3"/></pattern></defs>
  <rect width="1000" height="560" fill="url(#resgate-terra)"/>
  <path d="M100 280 260 280 300 420M260 280 200 150M650 280 760 140M650 280 790 430" stroke="#EEE3B6" strokeWidth="40" strokeLinecap="round" fill="none"/>
  <path d="M420-20Q370 90 433 185T420 370Q385 460 430 580H590Q640 470 583 365T585 185Q630 65 580-20Z" fill="#5B9E87" stroke="#ADCE9C" strokeWidth="15"/>
  <path d="M441-20Q390 90 453 185T440 370Q405 460 450 580H570Q620 470 563 365T565 185Q610 65 560-20Z" fill="url(#resgate-agua)"/>
  <rect x="425" width="165" height="560" fill="url(#resgate-ondas)" className="resgate-corrente"/>
  <g stroke="#755039" strokeWidth="5"><rect x="370" y="245" width="260" height="70" rx="5" fill="#B88456"/>{Array.from({length:13},(_,i)=><path key={i} d={`M${378+i*20} 247V313`}/>)}<path d="M360 241H640M360 320H640" stroke="#FFF0CD" strokeWidth="7"/></g>
  {[ [65,90],[335,65],[90,460],[340,500],[680,65],[920,90],[930,460],[665,490] ].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><ellipse cy="25" rx="29" ry="10" fill="#27664C" opacity=".15"/><path d="M0 30V-12" stroke="#806144" strokeWidth="10"/><circle cy="-13" r="29" fill={i%2?'#438B61':'#277B5B'}/><circle cx="-12" cy="-23" r="17" fill="#72B776"/></g>)}
  {feedback&&correta&&[130,310,690,880].map((x,i)=><g className="resgate-recompensa" key={x} transform={`translate(${x} ${i%2?470:370})`}><path d="M0 20V-12M0 5Q-25 5-20-13Q0-14 0 5M0 0Q25 0 20-19Q0-20 0 0" fill="#27975C" stroke="#18744F" strokeWidth="3"/><circle cy="-20" r="7" fill="#FFE44E"/></g>)}
  <text x="45" y="43" fill="#205B4B" fontSize="18" fontWeight="800">RESERVA • RIO DAS IDEIAS</text>
  <text x="475" y="105" fill="#E6FFFC" fontSize="17" transform="rotate(90 475 105)">NASCENTE → COMUNIDADE → FOZ</text>
  {missao.estacoes.map((e,i)=><g key={e.id} transform={`translate(${e.x} ${e.y})`} onClick={()=>onEstacao(e.id)} style={{cursor:'pointer'}}>
    <ellipse cy="29" rx="36" ry="12" fill="#164C4D" opacity=".18"/><circle r="37" fill={exploracao.itens.includes(e.id)?'#D6FA82':'#FFFDF2'} stroke={exploracao.itens.includes(e.id)?'#4F8F44':missao.cor} strokeWidth="5"/><Icone tipo={e.icone}/><circle cx="29" cy="-26" r="13" fill="#25104A"/><text x="29" y="-21" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">{exploracao.itens.includes(e.id)?'✓':i+1}</text>
  </g>)}
  <g transform={`translate(${exploracao.posicao.x} ${exploracao.posicao.y})`} className="resgate-personagem"><ellipse cy="25" rx="21" ry="8" fill="#164C4D" opacity=".25"/><path d="M-9 10-8 25M9 10 8 25" stroke="#263B60" strokeWidth="8" strokeLinecap="round"/><rect x="-15" y="-16" width="30" height="32" rx="10" fill="#FF764F"/><rect x="11" y="-11" width="11" height="23" rx="4" fill="#F8C64E"/><circle cy="-25" r="13" fill="#A86747"/><path d="M-19-30Q0-49 19-30Z" fill="#FFDE70"/><path d="M-21-28H21" stroke="#FFDE70" strokeWidth="6" strokeLinecap="round"/><path d="M-5-23H-3M5-23H7" stroke="#25104A" strokeWidth="2"/></g>
 </svg>;
}
