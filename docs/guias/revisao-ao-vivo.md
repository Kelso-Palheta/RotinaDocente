# Revisão ao Vivo — guia de uso

## Professor

1. Entre no Rotina Docente e, no Hub, abra **Revisão ao Vivo → Preparar aulão**. Também é possível acessar `/revisao`.
2. Confira as turmas já cadastradas no Diário Pedagógico. A sala admite até cem alunos elegíveis somando as turmas selecionadas; esse é o teto inicial do piloto, não uma garantia de conexão na escola.
3. No catálogo, use **Inspecionar**. Compare enunciado, alternativas e gabarito com os links oficiais, confira as imagens e escreva/revise o conteúdo preparatório e as explicações de A a E. O acervo inicial é parcial e está em rascunho; publicação técnica não substitui conferência pedagógica.
4. Confirme os quatro itens e aprove. Alterar o texto reinicia as confirmações. A aprovação pertence à sua conta e à versão específica da questão/imagens.
5. Selecione as questões aprovadas, a ordem, as turmas e o tempo; crie a sala. A criação congela o conteúdo textual revisado.
6. Abra **Abrir projeção** numa segunda aba e projete essa aba. Mantenha o painel de controle no seu dispositivo. Compartilhe o código exibido.
7. Mostre o conteúdo, abra a pergunta e acompanhe respondentes e quantidade de escolhas por alternativa. A tela não associa o nome de um aluno à alternativa escolhida. O prazo encerra a aceitação de respostas no servidor.
8. Após encerrar, use **Mostrar feedback** para revelar gabarito e comentário de cada alternativa; depois mostre o ranking e avance ou finalize. Acerto vale mil pontos, sem bônus de velocidade; empates recebem a mesma posição. A revisão não modifica notas.
9. Se fechar a aba, volte à preparação e use **Retomar uma sala**. Se perder conexão, aguarde a retomada ou use **Reconectar sala** antes de novos comandos.

## Aluno

Entre normalmente no Portal do Aluno. No boletim, abra **Revisão ao Vivo**, ou acesse `/aluno/revisao`, e digite o código do professor. Somente alunos das turmas convidadas, ainda cadastrados e com vínculo ativo, podem participar; saber o código não substitui o login.

Escolha uma alternativa. **Enviando** não significa **confirmado**: aguarde o recibo. Se o envio falhar, a repetição preserva a mesma alternativa e não duplica pontos. Uma resposta confirmada não pode ser trocada. Clique antes do término não garante aceitação se a requisição só chegar ao servidor depois do prazo. Ao reconectar, o sistema recupera o recibo persistido.

O gabarito aparece quando o professor abre o feedback. O ranking do aluno mostra os dez primeiros e sua própria posição quando fora desse grupo.

## Limites do piloto

- O acervo reúne questões regulares, PPL e reaplicações, com cobertura parcial documentada no próprio acervo. Não anuncia todas as questões históricas nem conferência humana já concluída.
- O limite inicial é de cem alunos elegíveis por sala. Faça um ensaio na escola antes de um aulão: internet, Wi-Fi, aparelhos, quotas do plano e duração da aula influenciam o resultado.
- Streams renovam a conexão periodicamente. Um erro de autenticação ou matrícula exige resolver o acesso; o sistema não anuncia sucesso sem confirmação.
- Revisões e salas ficam no Firestore existente, acessado exclusivamente pelo servidor. Não foi contratado serviço nem ativado plano Blaze. Permanecem aplicáveis as quotas do plano atual.
- Se uma atualização do acervo alterar os arquivos de uma questão, a aprovação anterior deixa de valer para novas salas. Em salas antigas, imagens cuja fonte divergir são bloqueadas em vez de exibir pixels não conferidos; confira a versão nova e crie outra sala. O texto congelado permanece preservado.

Ao terminar o aulão, feche as abas de projeção e participação para encerrar as conexões ao vivo.

## Aulas temáticas

Na nova preparação, escolha primeiro uma ou mais aulas específicas. Somente questões associadas a esses conteúdos aparecem para seleção; rascunhos podem ser inspecionados, mas precisam de aprovação. Ao trocar aulas, seleções incompatíveis são retiradas com aviso. Confira o texto completo, exemplos, fontes, imagens e assuntos vinculados; confirme os três itens da aula. Questões continuam com sua conferência própria.

Defina uma quantidade exata de 1–20 questões, escolha/reordene os itens compatíveis e configure o tempo padrão (10–600s), com exceção individual se necessário. Se faltarem questões aptas, reduza a quantidade ou revise mais itens do mesmo conteúdo; o sistema não completa com outro assunto.

Na sala nova, o professor avança ou volta pelos blocos da introdução. Todos acompanham o mesmo bloco. Apenas no último bloco é possível abrir o desafio. Depois de cada pergunta: tempo encerrado → Mostrar Feedback → Mostrar Ranking/pódio → Iniciar próxima questão. Essa última ação já inicia o cronômetro da próxima pergunta; não repete a introdução. O pódio é acumulado e respeita empates. Salas antigas mantêm o funcionamento anterior.

As 34 aulas iniciais continuam em rascunho para conferência docente; todas possuem exemplos visuais comentados (obras, registros ou esquemas autorais identificados). Revise a suficiência dos exemplos visuais e das referências antes de usar em aula. Dois vínculos sem cobertura suficiente ficaram pendentes; esses itens não são oferecidos automaticamente sob o tema errado. Bônus por velocidade permanece adiado.

Nos blocos ilustrados, use **Ampliar imagem** para examinar detalhes ou esquemas. Créditos e links de fonte/licença acompanham a figura. A nova versão dos arquivos invalida conferências anteriores; confira novamente a aula antes de abrir outra sala.
