# Dashboard Analytics

O painel consulta o Diário. Ele não modifica notas, cria recuperação nem publica resultados no Portal.

## Escolher o contexto

1. Selecione ano letivo; turmas antigas sem ano ficam em **Legado — ano não informado**.
2. Escolha turma ou todas as turmas do filtro. Ative **Turmas arquivadas** para consultar o arquivo.
3. Selecione bimestre, semestre ou ano completo. O período inicial considera a preferência desta conta no Diário.

Se a turma selecionada desaparecer, o painel pede nova seleção; não amplia sozinho para outras turmas.

## Ler os indicadores

- **Visão geral:** média, cobertura, desempenho e atenção. A contagem representa matrículas; a mesma pessoa pode ter vínculos em mais de uma turma/disciplina.
- **Atenção e pendências:** notas abaixo do mínimo e, separadamente, notas ausentes/parciais. Use busca e paginação. **Abrir Diário** abre uma prévia de acompanhamento, com link para turma/período/aluno no Diário.
- **Evolução:** trajetória bimestral em percentual da escala, com alternativa em tabela.
- **Relatórios:** conferir todos os alunos do filtro antes de baixar o PDF, incluindo notas ausentes, zero real, critérios e resultados parciais.

No bimestre, percentuais consideram alunos com algum lançamento, conforme a regra do Diário; por isso são provisórios. Em semestre/ano, aprovação e atenção consideram etapas concluídas. Etapa em andamento não significa reprovação.

Semestre exige pelo menos 25 pontos; ano, 50, com pesos e recuperação calculados pelo mesmo domínio do Diário/Portal. As cores bimestrais seguem o mínimo configurado, azul até abaixo de 8 e verde para excelente a partir de 8; abaixo do mínimo é vermelho. Sem nota permanece neutro. A faixa adicional de atenção não altera a regra de recuperação escolar.

Critérios e escalas diferentes são informados. A média bruta consolidada não é exibida quando as escalas diferem; compare cada turma e consulte as notas originais. Gráficos comparam percentual da escala, não estabelecem ranking de mérito entre turmas.

## Origem e atualização

**Atualizar dados** consulta novamente a fonte autenticada do Diário. A data exibida é o horário da consulta, não o horário de lançamento de cada nota.

Se houver rascunho local pendente, o painel informa que a análise da nuvem pode diferir dele e orienta conferir o Diário. Em falha de leitura, pode mostrar somente o cache desta conta, marcado como cópia local/desatualizada. Falha não é interpretada como cadastro vazio. O painel não aplica nem grava rascunhos.

## PDF

O relatório usa o mesmo conjunto calculado da tela, com todas as matrículas do filtro e paginação. Exportar não envia mensagens, publica notas ou homologa resultados escolares.

Validação visual utiliza dados fictícios em `docs/validacoes/analytics-rn79/`. Não substitui conferência docente dos lançamentos reais.
