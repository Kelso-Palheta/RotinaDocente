/** Cenário fictício e reutilizável. Inventário narrativo nunca concede pontos. */
export const missoes = [
  { titulo:'Investigar a nascente', objetivo:'Reúna três fontes antes de formular sua hipótese.', cor:'#20D8CD',
    estacoes:[
      {id:'amostra',nome:'Coletar amostra',x:190,y:145,icone:'frasco',item:'Amostra virtual',pista:'Uma observação isolada não explica todo o rio. Compare fontes e registre o que ainda precisa investigar.'},
      {id:'mapa',nome:'Ler mapa da bacia',x:300,y:430,icone:'mapa',item:'Mapa da bacia',pista:'O rio conecta nascente, comunidade e foz. Uma ação em um ponto pode produzir efeitos em outro.'},
      {id:'guardia',nome:'Ouvir a guardiã',x:740,y:170,icone:'pessoa',item:'Relato da guardiã',pista:'“Antes de decidir, escute quem vive aqui e procure evidências. Uma hipótese pode mudar diante de novos dados.”'}]},
  { titulo:'Conectar as evidências',objetivo:'Atravesse a ponte, compare registros e teste sua hipótese.',cor:'#FFE44E',
    estacoes:[
      {id:'sensor',nome:'Consultar sensor',x:760,y:125,icone:'sensor',item:'Registro do sensor',pista:'Dados simulados: ponto A = 8 unidades; ponto B = 3. Unidades fictícias: essa diferença exige investigação, não uma conclusão automática.'},
      {id:'arquivo',nome:'Comparar registros',x:230,y:180,icone:'mapa',item:'Caderno de evidências',pista:'Compare o que mudou e o que permaneceu. Separe observação, hipótese e conclusão.'},
      {id:'oficina',nome:'Visitar oficina',x:760,y:440,icone:'casa',item:'Kit de investigação',pista:'Ferramentas ajudam a testar ideias. Use as informações do desafio da sua disciplina para justificar uma escolha.'}]},
  { titulo:'Recuperar o rio',objetivo:'Planeje uma intervenção e verifique suas consequências.',cor:'#FF80BD',
    estacoes:[
      {id:'viveiro',nome:'Visitar viveiro',x:210,y:420,icone:'folha',item:'Mudas virtuais',pista:'Recuperar exige acompanhar resultados. No cenário, vegetação representa cuidado contínuo, não uma solução imediata para toda poluição.'},
      {id:'assembleia',nome:'Ouvir comunidade',x:790,y:420,icone:'pessoa',item:'Plano coletivo',pista:'Decisões têm consequências para pessoas diferentes. Considere recursos, limites e as evidências reunidas.'},
      {id:'observatorio',nome:'Checar observatório',x:780,y:140,icone:'sensor',item:'Diário de monitoramento',pista:'Uma intervenção precisa ser acompanhada. Se a previsão falhar, revise o plano em vez de esconder o resultado.'}]},
];
export function missaoDoDesafio(indice,total) { return Math.max(0,Math.min(2,Math.floor(Math.max(0,indice)*3/Math.max(3,total)))); }
export function iniciarExploracao(missao) { return {missao,posicao:{x:120,y:280},itens:[],pronto:false,mensagem:'Explore as margens. Use a ponte para atravessar o rio.'}; }
export function distancia(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
export function mover(s,dx,dy) {
  const p={x:Math.max(45,Math.min(955,s.posicao.x+dx)),y:Math.max(55,Math.min(505,s.posicao.y+dy))};
  const passos=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8);
  for(let i=1;i<=passos;i++) {
    const x=s.posicao.x+(p.x-s.posicao.x)*i/passos,y=s.posicao.y+(p.y-s.posicao.y)*i/passos;
    if(x>395&&x<615&&(y<250||y>310))return s;
  }
  return {...s,posicao:p};
}
export function investigar(s,id) {
  const e=missoes[s.missao]?.estacoes.find(e=>e.id===id);
  if(!e||distancia(s.posicao,e)>85)return s;
  const itens=s.itens.includes(id)?s.itens:[...s.itens,id];
  return {...s,itens,pronto:itens.length===3,mensagem:e.pista};
}
