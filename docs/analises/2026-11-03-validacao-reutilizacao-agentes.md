# Revisão independente — copiar/exportar/ajuda dos Agentes

Data: 03/11/2026. Base: `5adff9b`. Nenhuma alteração de produção ou de testes recebidos nesta revisão. Acrescentados três testes próprios de aceites já definidos na spec.

## Veredito

**Aprovado para publicar somente o pacote copiar/exportar/ajuda dos Agentes.**

## Conferência do escopo

Diff restrito ao ChatWindow e quatro componentes/utilitário novos. Nenhuma alteração de hook, API, autenticação, notas, persistência, provedor/modelo, pacote ou dependência. Os arquivos locais de logout são preservados e não entram na publicação.

- Copiar aparece somente nas respostas do assistente e envia conteúdo exato ao clipboard; erro/ausência de permissão é visível e não afirma sucesso.
- Exportar exige confirmação, usa somente mensagens do agente atual, gera TXT com autor/conteúdo na ordem e nome de arquivo seguro; cancelamento não inicia download. Erro mantém diálogo aberto e permite repetir. URL temporária e link são liberados.
- Ajuda explica navegador/dispositivo, separação por agente, ausência de sincronização e possibilidade de apagar ao sair. Não promete histórico por conta ou sobrevivência ao logout.
- Controles têm nome acessível; diálogo inicia e circula foco internamente, fecha com Escape e retorna ao gatilho. Limpar histórico mantém sua semântica.

## Evidência própria

- Conjunto completo dos Agentes: **47 testes em dez arquivos aprovados**, incluindo nove testes novos recebidos.
- Novos testes independentes `AgentesReutilizacaoRevisao.test.jsx`: **3/3 aprovados** para cancelamento sem download, falha/retry com liberação de URL/link e Tab/Shift+Tab/Escape com retorno de foco.
- Nenhum teste anterior foi editado/removido; `git diff --check` aprovado.

Árvore publicável criada por `git archive 5adff9b`, recebendo somente os cinco arquivos de produção do pacote, spec exclusiva e dois testes novos. Não inclui os arquivos locais do logout nem suas reproduções.

- Suíte completa: **1.131 testes em 246 arquivos aprovados**, exit 0.
- Lint dos cinco arquivos de produção: exit 0, sem erros/avisos.
- Build de produção Next/Turbopack: exit 0, 37 rotas. A primeira tentativa falhou internamente ao resolver fontes Google; removidos somente os artefatos `.next` da cópia temporária e repetido o mesmo build, que passou sem mudar fonte, dependência ou teste.
- Fontes/testes comparados por SHA-256 com a cópia validada antes do commit.
- Reprodução de logout REV3-R83-01 repetida separadamente nesta rodada: **uma falha**, portanto código e testes desse trabalho permanecem fora da publicação.

Logs locais ignorados: `tmp/reutilizacao-isolado-{testes,lint,build}.log`, `tmp/reutilizacao-isolado-build-primeira-tentativa.log` e `tmp/revisao-reutilizacao-logout-separado.log`. Não se declara aprovação integral da árvore local.

## Evidência visual e limites

Inspecionadas capturas entregues de conversa em 390×844/1440×900 e confirmação de exportação em 390×844. Cabeçalho, texto longo, ação de copiar, rascunho e diálogo ficam dentro da tela. Outros artefatos e medições em `docs/evidencias/2026-11-03-agentes-reutilizacao/`.

As capturas vieram do executor em harness local com componentes reais, dados sintéticos e autenticação/roteador/hook simulados. Esta revisão inspecionou os arquivos, não repetiu sessão com conta real, clipboard real em produção ou leitor de tela. Os testes jsdom não calculam media queries. Sem chamada paga ou nova escrita Firebase.

A revisão não garante isolamento de histórico por conta: a chave global por agente permanece conforme a entrega anterior. Selo de IA, rascunho persistente e migração por conta continuam fora de escopo. A antiga falha REV-AG-01 já está corrigida na base publicada; referência desatualizada foi corrigida na spec desta entrega.

## Próximas pendências

Resolver logout REV3-R83-01 com Antigravity, separadamente. Depois, alinhar a identificação do provedor à configuração BYOK e definir propriedade/migração dos históricos antes de novos rascunhos persistentes. Ao final das tarefas, concluir armazenamento de imagens adaptadas mantendo plano Firebase atual e sem ativar Blaze.
