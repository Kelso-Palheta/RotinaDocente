# Validação RN-79 / RN-80 — 27/10/2026

- Suíte completa: 902 testes, 198 arquivos, exit 0 (`npx vitest run --maxWorkers=2`). Os 875 testes anteriores permanecem intactos; 27 testes novos.
- Lint dos arquivos de produção alterados/adicionados: exit 0, sem erros/avisos.
- Produção: `NODE_USE_SYSTEM_CA=1 npm run build`, exit 0. Comando executado com essa opção de ambiente; nenhuma alteração das fontes da aplicação foi necessária.
- Prévia no Chrome com componentes reais, fonte autenticada substituída por fixture inteiramente fictícia: 1440 px e 390 px; sem erros de execução; largura da página igual à viewport em 390 px; diálogo recebe foco e fecha com Escape.
- Download pelo botão real: PDF de 42 matrículas, três páginas A4, notas zero/ausentes e parciais preservadas. Primeira página renderizada e conferida; testes verificam também paginação com 60 nomes longos e símbolos compatíveis com a fonte.

Capturas versionadas: `desktop.png` e `celular.png`. O PDF fictício foi gerado e conferido localmente; `.gitignore` exclui PDFs, portanto esse exemplo não integra o commit. Prévia não acessou Firebase, Gemini ou contas reais. Scripts temporários de prévia não integram o produto.

Uma rodada concorrente de testes/build/lint apresentou timeouts em dois testes de outros módulos e foi interrompida. Ambos passaram isoladamente (11 testes), e duas rodadas completas posteriores passaram (899 e 900 testes). Nenhum teste preexistente, evidência histórica ou limite de timeout foi alterado.

O módulo é consultivo. Publicação de notas continua sendo ação explícita no Diário. A configuração pendente de armazenamento das imagens e o lembrete de atividades de recuperação semestral continuam registrados na auditoria sequencial.

Revisão independente antes do push identificou um caminho de tema/turno que contornava o conflito. Correção centralizada, duas regressões adicionais em Red→Green e nova suíte completa com 902 aprovações. O revisor confirmou resolução do P1.
