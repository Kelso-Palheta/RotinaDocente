import React from 'react';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {PrepararAulao} from '@/components/revisao/PrepararAulao';
import {RevisarQuestao} from '@/components/revisao/RevisarQuestao';

afterEach(cleanup);
const turmas = [{id:'t1',nome:'Turma 101'}];
const questoes = [{id:'q1',tema:'Arte',apta:true,status:'revisada'}];
const selecao = {titulo:'Aulão',turmaIds:['t1'],questaoIds:['q1'],duracaoSegundos:60};
const confirmacoes = {transcricao:true,gabarito:true,imagens:true,explicacoes:true};
const fonte = {provaUrl:'https://download.inep.gov.br/prova.pdf',gabaritoUrl:'https://download.inep.gov.br/gabarito.pdf'};
function questao(extra = {}) {
  return {id:'q1',enunciado:'Observe a obra.',tema:'Arte',imagens:[],fontes:[fonte],
    alternativas:['A','B','C','D','E'].map(id=>({id,texto:`Opção ${id}`})),gabarito:'A',
    explicacoes:Object.fromEntries(['A','B','C','D','E'].map(id=>[id,`Justificativa ${id}`])),
    conteudoRevisao:[{tipo:'texto',texto:'Conteúdo preparatório'}],...extra};
}

describe('RV-REV-02 — validação independente da preparação', () => {
  it.each([
    {turmaIds:['inexistente']}, {turmaIds:['t1','t1']}, {questaoIds:['q1','q1']},
  ])('bloqueia IDs desconhecidos ou repetidos: %j', patch => {
    const onCriar=vi.fn();
    render(<PrepararAulao turmas={turmas} questoes={questoes} selecao={{...selecao,...patch}} onCriar={onCriar} />);
    const botao=screen.getByRole('button',{name:/criar aulão/i});
    expect(botao).toBeDisabled(); fireEvent.click(botao); expect(onCriar).not.toHaveBeenCalled();
  });

  it('não trata string false como questão apta', () => {
    render(<PrepararAulao turmas={turmas} questoes={[{...questoes[0],apta:'false'}]} selecao={selecao} />);
    expect(screen.getByRole('button',{name:/criar aulão/i})).toBeDisabled();
  });

  it('preserva duração fracionária para validação, sem convertê-la em um inteiro válido', () => {
    const onAlterar=vi.fn();
    render(<PrepararAulao turmas={turmas} questoes={questoes} selecao={selecao} onAlterar={onAlterar} />);
    fireEvent.change(screen.getByLabelText(/duração por questão/i),{target:{value:'10.5'}});
    expect(onAlterar).toHaveBeenCalledWith({...selecao,duracaoSegundos:10.5});
  });

  it.each([
    {enunciado:''}, {id:''}, {fontes:[{}]},
    {fontes:[{...fonte,provaUrl:'https://exemplo.com/prova.pdf'}]},
    {conteudoRevisao:[{tipo:'imagem',legenda:'Sem referência'}]},
  ])('não aprova registro incompleto: %j', patch => {
    const onAprovar=vi.fn();
    render(<RevisarQuestao questao={questao(patch)} confirmacoes={confirmacoes} onAprovar={onAprovar} />);
    const botao=screen.getByRole('button',{name:/aprovar questão/i});
    expect(botao).toBeDisabled(); fireEvent.click(botao); expect(onAprovar).not.toHaveBeenCalled();
  });

  it('não apresenta endereço arbitrário como fonte oficial', () => {
    render(<RevisarQuestao questao={questao({fontes:[{...fonte,provaUrl:'http://exemplo.com/prova.pdf'}]})} confirmacoes={confirmacoes} />);
    expect(screen.queryByRole('link',{name:/Prova Oficial/})).not.toBeInTheDocument();
  });

  it('exige booleanos de confirmação, sem aceitar texto truthy', () => {
    render(<RevisarQuestao questao={questao()} confirmacoes={{...confirmacoes,explicacoes:'false'}} />);
    expect(screen.getByRole('button',{name:/aprovar questão/i})).toBeDisabled();
  });
});
