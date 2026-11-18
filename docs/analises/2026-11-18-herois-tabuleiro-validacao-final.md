# Heróis e Tabuleiro — validação final

Entrega integrada em 18/11/2026.

## Funcionalidades

Catálogo com sete jogos. Heróis permite até duas tentativas no mesmo prazo, com feedback individual e pontuação máxima de 1000 por rodada. Tabuleiro usa equipes, turnos, cartas de avanço e chegada, com movimento consolidado uma única vez no servidor. Banco, geração por tema/material e dificuldades continuam disponíveis para qualquer disciplina.

As seis regressões independentes da revisão passaram. Foram acrescentados dois testes para as letras das alternativas quando o banco usa IDs internos, e a apresentação foi ajustada para A, B, C etc. A única alteração em teste anterior foi a lista do catálogo de cinco para sete modalidades, autorizada pelo usuário.

## Evidências

- Foco do módulo. 125 testes aprovados em 26 arquivos.
- Suíte completa na cópia isolada. 1665 aprovados, 10 ignorados e zero falhas. 361 arquivos aprovados e quatro ignorados.
- Lint geral. Zero erros e 16 avisos, incluindo cinco avisos de uso de img nas novas telas.
- Build de produção. Aprovado.
- As 39 mídias de Heróis foram comparadas por SHA-256 com o PPTX original. Nenhuma referência de mídia das novas telas aponta para arquivo ausente.
- Capturas desktop/celular da entrega foram conferidas. Utilizam dados sintéticos.
- Alterações anteriores da Revisão e auth-context.js ficam fora desta publicação.

## Limites

A validação não incluiu turma real nem teste de carga na rede escolar. Os testes automatizados utilizam serviços simulados. O áudio foi conferido por referência ao arquivo original e comportamento do controle; reprodução audível em diferentes aparelhos precisa de conferência no navegador do professor.
