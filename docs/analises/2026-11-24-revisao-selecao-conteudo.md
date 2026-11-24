# Revisão autônoma — seleção de conteúdo e dificuldade

- Disciplina legada «Arte / ENEM» aparece como «Arte» na preparação, no jogo e no histórico. Payloads/sessões preservam o valor original; nenhuma migração do banco.
- Conteúdo mostra nomes únicos; dificuldade tem campo próprio com os níveis disponíveis. Quando há um único nível, ele é selecionado. Quantidade disponível e configuração da aventura correspondem ao registro escolhido.
- Assunto/nível em vários vínculos exige origem explícita. Retirada da origem escolhida não troca silenciosamente de professor; retirada de dificuldade invalida a seleção.
- Cinco regressões de UI novas: nomes/níveis/payload legado, troca de assunto, isolamento de origem, retirada de nível e retirada de vínculo. O usuário autorizou somente a adaptação dos seletores antigos: quatro arquivos trocam `Conteúdo e dificuldade` por `Conteúdo`, sem alterar expectativas do jogo, acesso ou histórico.
- Direcionados: 55 testes aprovados. Validação completa registrada abaixo após conclusão.

Escopo desta entrega: filtros da revisão autônoma. A unificação dos módulos e todos os jogos no modo autônomo continuam como tarefa separada.

Validação final isolada: 1.907 testes aprovados, 10 ignorados (emuladores opcionais); lint sem erros, 22 avisos; build aprovado. A primeira execução teve um timeout de percurso com build simultâneo e um quarto seletor antigo; o seletor foi adaptado dentro da autorização, o percurso passou isoladamente e a suíte completa passou com três workers. Nenhum tempo limite ou expectativa de comportamento foi alterado.
