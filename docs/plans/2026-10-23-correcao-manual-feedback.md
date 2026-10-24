# Correção manual e feedback — Plano

Objetivo: oferecer IA e correção manual por resposta, com devolutivas no Portal, boletim PDF e Ficha 360º.

1. Testar domínio de correção manual (validação, soma, feedback e auditoria) e histórico isolado por aluno/turma/professor.
2. Implementar domínio e editor manual independente de IA. Integrar ao hook e painel, mantendo sincronização restrita da RN-64.
3. Persistir feedback atual e origem. Garantir que revisão manual não conserve resultado antigo como atual e que manual zero não seja penalizado automaticamente.
4. Compartilhar histórico de devolutivas entre Portal e relatórios. Incluir feedback geral e por questão em PDF paginado, sem truncamentos.
5. Executar testes novos e suíte completa; lint, build e renderização de PDFs de teste com comentários longos. Não alterar testes antigos nem publicar automaticamente.

Validação: testes de domínio, hook, painel, Portal, carregamento isolado e PDF. Revisão visual dos PDFs com comentário longo em três páginas, preservando texto final e rodapés.
