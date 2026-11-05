import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {PrepararAulaoTematico} from '@/components/revisao/PrepararAulaoTematico';
import {ConferirConteudoTematico} from '@/components/revisao/ConferirConteudoTematico';
import {BlocoAulaTematica} from '@/components/revisao/BlocoAulaTematica';
afterEach(cleanup);
const selecao={titulo:'Aula',turmaIds:['t'],questaoIds:['q'],conteudoIds:['a'],quantidadeQuestoes:1,duracaoSegundos:30,duracaoPorQuestao:{}};
const props={trilhas:[{id:'tr',titulo:'Trilha'}],conteudos:[{id:'a',titulo:'Aula',trilhaId:'tr',apta:true}],questoes:[{id:'q',tema:'Questão',conteudoIds:['a'],apta:true}],turmas:[{id:'t',nome:'Turma'}]};
it('recusa questão fora do tema, conteúdo desconhecido, apta truthy e duração órfã',()=>{
 for(const [extra,s] of [[{questoes:[{...props.questoes[0],conteudoIds:['outra']}]},selecao],[{}, {...selecao,conteudoIds:['fantasma']}],[{conteudos:[{...props.conteudos[0],apta:'true'}]},selecao],[{}, {...selecao,duracaoPorQuestao:{fantasma:30}}]]){
  render(<PrepararAulaoTematico {...props} {...extra} selecao={s} onCriar={vi.fn()}/>);expect(screen.getByRole('button',{name:/criar.*sala|criar.*aulão/i})).toBeDisabled();cleanup();
 }
});
it('criação envia seleção exata ao controlador',()=>{const criar=vi.fn();render(<PrepararAulaoTematico {...props} selecao={selecao} onCriar={criar}/>);fireEvent.click(screen.getByRole('button',{name:/criar.*sala|criar.*aulão/i}));expect(criar).toHaveBeenCalledWith(selecao);});
it('não aceita confirmações string nem fonte executável',()=>{render(<ConferirConteudoTematico conteudo={{id:'a',fontes:[{titulo:'Fonte perigosa',url:'javascript:alert(1)'}]}} confirmacoes={{conteudo:'true',imagens:true,cobertura:true}}/>);expect(screen.getByRole('button',{name:/aprovar conteúdo/i})).toBeDisabled();expect(document.querySelector('a[href^="javascript:"]')).toBeNull();});
it('imagem sem referência correspondente não usa primeira imagem nem caminho local',()=>{render(<BlocoAulaTematica bloco={{tipo:'imagem',imagemId:'errada',titulo:'Figura'}} imagens={[{id:'outra',url:'https://example.org/errada.png',arquivo:'aulas/imagens/privado.png'}]}/>);expect(screen.queryByRole('img')).toBeNull();});
