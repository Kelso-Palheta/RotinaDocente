# Evidências RN-82 — 28/10/2026

Ensaio **local isolado** em navegador, renderizando os componentes reais de cópia e o caso de uso com repositório em memória. CSS real da aplicação. Não é homologação de produção/Firebase real; IA e extração desativadas no ensaio. Dados e figuras sintéticos, sem alunos reais. O servidor temporário e os mocks estão em `tmp/rn82-visual/`, ignorados pelo Git; foram encerrados após a inspeção.

- [Destino em 390 px](destino-390.jpg): turma, semestre, prazo e botões legíveis.
- [Revisão de contexto em 390 px](revisao-contexto-390.jpg): semestre fixo, seletor de data/hora e campos em uma coluna.
- [Questão em 390 px](revisao-questao-390.jpg): enunciado, figura, rubrica e botão de criação acessíveis por rolagem interna.
- [Destino em 1440 px](destino-1440.jpg): saldo 6 e aviso de fechamento/liberação.
- [Revisão em 1440 px](revisao-1440.jpg): contexto e aviso mantidos antes da confirmação.
- [Resultado local 4+6](resultado-local.jpg): segunda cópia completa 10 pontos na turma B fictícia.

Também foi conferido Shift+Tab do primeiro para o último controle no diálogo de destino e na revisão. Não houve ensaio com leitor de tela. Testes de infraestrutura usam banco sintético e cobrem gravação transacional, tokens e preservação; essas capturas verificam apresentação e interação, não substituem Firestore real.
