# Calendário Pedagógico seguro — plano de implementação

**Objetivo:** executar toda a análise aprovada, inclusive integração Meu Horário Escolar.
**Arquitetura:** domínio puro para identidade/estado de conteúdos, distribuição, feriados e reconciliação; persistência com transação e escopo turma/ano; componentes com prévia e confirmação. Compatibilidade legada sem descartar histórico.
**Tecnologias:** React/Next, Firestore, date-fns, jsPDF e Vitest.

1. Escrever testes de regressão de domínio e verificar falhas; implementar motor seguro mantendo contratos antigos de arrays e histórico visível.
2. Testar e implementar carregamento/gravação transacional por ano, revalidação da prévia e preservação de registros legados.
3. Em frente independente, corrigir extração de horários reais e configuração com correspondência exata/manual e prévia. Preservar conversor legado testado; novo conversor estrito para o fluxo novo.
4. Em frente independente, importar arquivo/texto com extrator compartilhado, revisão editável e escolha mesclar/substituir.
5. Em frente independente, exportar PDF com todo o conteúdo, observações e paginação; verificar visualmente.
6. Integrar três áreas, filtros, biblioteca pesquisável, lista móvel, justificativa/restante, prévias, pendências e reposições; aguardar gravações e descartar carregamentos obsoletos.
7. Executar testes de integração/UI, suíte completa, lint, build e revisão de cenários sintéticos. Atualizar documentação com evidências. Não operar dados reais nem publicar sem pedido.

Nenhum teste preexistente será alterado para acomodar mudanças. Histórico visível em aulas canceladas/parciais permanece, com indicador separado de vínculo ativo.

## Execução

Frentes concluídas: domínio/persistência; horários; importação; biblioteca/registro; PDF. Integração revisada com regressões adicionais para capacidade, cancelamentos manuais, período e histórico. Guia em `docs/guias/calendario-pedagogico.md`; evidências visuais na análise. Nenhum teste preexistente foi alterado; não houve gravações em turmas reais.

Validação final: 523 testes (87 arquivos), build e lint aprovados. Revisão visual com turma sintética e PDF longo concluída. Escopo da análise e inclusão Meu Horário implementados; documentação atualizada.
