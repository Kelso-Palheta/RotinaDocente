# Resgate do Rio — investigação 2D

## Escopo
Experiência `resgate` da modalidade Quiz, sem alterar as nove modalidades canônicas. Funciona em sala e na revisão autônoma. Reutiliza questões revisadas, respostas, pontuação, relatórios e avaliação atuais. Não adota a escala das planilhas nem cria rubricas.

## Critérios de aceite
1. Professor seleciona Resgate ao preparar Quiz; aluno seleciona Resgate ao revisar sozinho. Exigir ao menos três questões compatíveis. Nenhum acesso, publicação ou vínculo de turma é dispensado.
2. Três missões conectadas: observar a nascente, investigar a vila, restaurar a foz. A distribuição das questões mantém a sequência congelada da partida. O cenário é uma simulação fictícia; dados ambientais são ilustrativos e não inferem correção das questões de outra disciplina.
3. Mapa 2D original explorável por teclado e controles de toque, com personagem, margens, ponte, estações, pistas e inventário. Cada missão tem objetivos e interações distintas. Não usar personagens licenciados.
4. Investigar estações libera pistas e ferramentas; inventário não duplica itens. Oferecer lista acessível equivalente às ações espaciais. Movimento, velocidade e apoio acessível não alteram nota.
5. Coleta local é decorativa e reversível; só respostas confirmadas no servidor alteram pontos e progresso oficial. Retomada restaura o checkpoint do desafio e a missão a partir do índice persistido; investigação ainda não respondida pode recomeçar. Informar essa granularidade.
6. Respostas continuam 1000 por acerto, zero por erro. Erro mostra recuperação pedagógica e não impede avançar após feedback. Consequências visuais distinguem intervenção confirmada e recuperação, sem humilhar aluno. Nada altera notas automaticamente.
7. Em sala, professor continua controlando revelar/avançar; aluno não acessa questões futuras. Em casa, aluno avança após feedback; histórico mantém experiência e resultados. APIs não aceitam experiência desconhecida ou Resgate em modalidade incompatível.
8. Transições, água animada e feedback visual respeitam redução de movimento. Som inicia somente após gesto, tem controle e não é necessário para jogar. Sem dependências novas.
9. Catálogo mantém compatibilidade legada. Sessões antigas continuam funcionais; projeções propagam `resgate` sem expor respostas futuras.

## Conteúdo
O episódio é um cenário reutilizável para questões do professor em qualquer disciplina. Pistas do rio são contexto narrativo explicitamente fictício; o desafio curricular usa o banco selecionado e seu gabarito. Não publicar perguntas novas automaticamente. Uma versão com dados científicos próprios e autoria revisada pode ser adicionada depois.

## Verificação
Novos testes: validação da experiência, propagação sala/solo, pontuação/histórico, distribuição de missões, inventário idempotente, interações por teclado/lista, bloqueio/feedback e retomada. Preservar testes existentes. Rodar suíte, lint e build, capturar desktop/celular com dados sintéticos, revisão independente, commit/push após aprovação.
