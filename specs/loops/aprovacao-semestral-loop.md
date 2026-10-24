# Aprovação por semestre — RN-67

## Perceber
Portal e boletim confundiam pontuação anual parcial abaixo de 50 com recuperação. Ficha 360º também convertia ano incompleto em recuperação. Mapa não informava a situação semestral, e a coluna de déficit do primeiro semestre tinha rótulo de segundo semestre. Publicação omitia recuperação semestral.

## Decidir
Separar S1, S2 e ano. Semestre completo: mínimo 25; ano completo: mínimo 50. Etapas incompletas ficam em andamento; sem lançamentos, sem notas. Preservar pesos 2/3, notas, recuperação e cores bimestrais. A aprovação anual considera a soma de 50, sem criar requisito adicional não solicitado sobre as situações semestrais.

## Agir
Classificação pura em `dominio/diario/aprovacao.js`; cálculo compartilhado por Diário, Portal e relatórios. Exibição por etapa no Mapa, Portal, boletim PDF, Ficha 360º e caderneta/CSV. Snapshot publicado inclui somente a recuperação daquele aluno. Documentos anteriores precisam ser republicados para refletir recuperações que antes não eram enviadas.

## Verificar
Testes novos falharam antes das alterações e passaram após a implementação: limites, ausência/zero, independência entre etapas, recuperação, Portal, Mapa, publicação e PDFs. Revisão visual de boletim, ficha e caderneta com primeiro semestre aprovado e ano em andamento. Teste específico protege espaço de assinaturas após aumentar a altura das linhas da caderneta. Verificação final: suíte completa, build, lint dos arquivos alterados e diferenças sem erro de espaços.

Resultado final: **543 testes em 92 arquivos aprovados**, build de produção aprovado, lint dos arquivos alterados sem erros e `git diff --check` aprovado. Testes existentes preservados.
