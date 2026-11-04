# Prompt para copiar no Antigravity

Implemente a correção do cabeçalho da caderneta PDF do projeto `/Users/kelsopalheta/Developer/RotinaDocente`, partindo do commit publicado `1a95f58` ou descendente que o preserve.

Leia e execute, nesta ordem:
1. `AGENTS.md` e `frontend/AGENTS.md`.
2. `specs/PRD.md`, `specs/RULES.md`, `specs/TESTS_SPEC.md`.
3. `specs/CABECALHO_CADERNETA_SPEC.md`.
4. `docs/plans/2026-11-04-caderneta-cabecalho.md`.

Problema confirmado: turma, total de alunos, professor e emissão são impressos na mesma linha em posições fixas e se sobrepõem com nomes longos. Corrija a quebra de linhas e altura do cabeçalho com fonte e largura reais; a tabela deve descer conforme necessário.

Produção permitida: somente `frontend/src/lib/diario/caderneta-export.js`, no cabeçalho e posicionamento vertical indispensável. Novo teste: `tests/integration/caderneta_cabecalho.test.js`. Preserve tabela, colunas/larguras, cálculos 25/25/50, notas/cores, CSV, ordem dos alunos e assinatura pública. Não refatore outros PDFs. Não altere/delete testes existentes.

Comece pelo teste RED geométrico, depois implemente e obtenha GREEN. Cubra nomes curtos/longos, emissão/faixa/tabela separadas, 45 alunos com paginação/assinaturas, zero versus ausência e turma vazia sem mutação. Execute regressões, suíte completa, lint e build conforme o plano. Renderize PDFs reais sintéticos e inspecione todas as páginas; não considere apenas extração de texto como validação visual.

Use dependências existentes e preserve alterações alheias. Não adicionar pacotes, alterar autenticação/persistência, escrever no Firebase, chamar IA paga ou mudar plano de cobrança. Não tocar no armazenamento das imagens adaptadas.

Entregue relatório, diff e evidências nos caminhos do plano. Não faça commit, push ou deploy nesta execução delegada: a entrega será revisada neste chat e publicada automaticamente após aprovação. Não peça confirmação sobre decisões já especificadas; se encontrar bloqueio real, descreva-o sem esconder falhas.
