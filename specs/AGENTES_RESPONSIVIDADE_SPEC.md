# Responsividade — Agentes Pedagógicos IA

Data: 31/10/2026. Escopo exclusivo desta tarefa. Este arquivo não altera `specs/PRD.md`, `specs/RULES.md`, `specs/TESTS_SPEC.md` nem `specs/TASKS.md`.

## Objetivo

Tornar a página de Agentes Pedagógicos utilizável em 390 px e preservar a composição lado a lado em 1440 px, sem alterar API, autenticação, hooks, histórico, modelo/provedor de IA ou qualquer arquivo de Atividades/logout.

## Arquivos permitidos

- `frontend/src/app/agentes/page.js`
- `frontend/src/components/agentes/ChatWindow.jsx`
- `frontend/src/components/agentes/AgentCard.jsx`
- `frontend/src/components/agentes/PromptChips.jsx`
- Novos testes e documentação exclusivos desta tarefa em `tests/` e `docs/`.

## Fora de escopo

- `specs/PRD.md`, `specs/RULES.md`, `specs/TESTS_SPEC.md`, `specs/TASKS.md` e demais especificações compartilhadas.
- `frontend/src/hooks/agentes/useAgentChat.js`, rotas de API, `api-client`, autenticação, Firebase, histórico em `localStorage`, modelo `sabiazinho-4`, provedor Maritalk e prompts de servidor.
- Página/componentes de Atividades e o logout corrigido em paralelo por Antigravity.
- Alteração de testes existentes. Todos os testes desta entrega são novos.

## Regras de layout

- **R-AR-01 — Mobile (390 px):** a página não pode criar rolagem horizontal. A seleção de agentes ocupa a largura disponível; após selecionar, a conversa ocupa a tela e a seleção fica acessível por um botão explícito de voltar. Cabeçalho, mensagens, sugestões e área de envio permanecem dentro da viewport.
- **R-AR-02 — Desktop (1440 px):** seleção de agente e conversa continuam visíveis lado a lado, com painel de seleção de 300 px e conversa ocupando o restante.
- **R-AR-03 — Ponto de quebra único:** o layout alterna em `min-width: 900px`. Abaixo disso, é mobile/tablet de uma coluna; a partir disso, duas colunas. A alternância é feita por CSS, sem desmontar o `ChatWindow`.
- **R-AR-04 — Preservação ao redimensionar:** mensagens já enviadas e texto ainda não enviado permanecem no componente após qualquer sequência de resize (390 → 1440 → 390). Nenhum listener de `resize` deve limpar estado.
- **R-AR-05 — Acessibilidade:** cards de agente continuam sendo botões com `aria-pressed` e nome “Selecionar …”; sugestões são botões com o texto completo; textarea tem nome acessível; envio e limpeza têm nomes acessíveis; o botão de voltar é focável e rotulado; a ordem de foco permanece natural.
- **R-AR-06 — Conteúdo longo:** nomes, segmentos, descrições, mensagens e sugestões quebram linha dentro do painel, sem `nowrap` que provoque corte ou overflow horizontal. Bolhas usam `word-break`/`overflow-wrap` e `max-width` responsivo.

## Critérios de aceite

| ID | Critério | Verificação |
|---|---|---|
| AR-01 | Em 390 px, selecionar agente, conversar, ver sugestões e enviar funciona sem corte ou rolagem horizontal | teste DOM + captura/medição no navegador |
| AR-02 | Em 1440 px, seleção e conversa aparecem lado a lado | teste DOM + captura/medição no navegador |
| AR-03 | Redimensionar não apaga mensagens nem texto digitado | teste de resize com texto e mensagem |
| AR-04 | Teclado, foco e nomes acessíveis preservados | testes com `Tab`, `Enter`, `aria-pressed`, nomes acessíveis |
| AR-05 | Nenhum arquivo fora do escopo alterado | `git diff`/status |

## Testes novos

Arquivo: `tests/unit/components/agentes/AgentesResponsividade.test.jsx`.

Cenários mínimos:

1. Seleção inicial expõe os dois agentes como botões acessíveis e `aria-pressed=false`.
2. Ao selecionar um agente em viewport de 390 px, a conversa fica disponível, o painel de seleção permanece montado (para resize) e o botão de voltar é acessível.
3. Voltar reabre a seleção e mantém os cards operáveis.
4. Sugestões são botões, preenchem o campo e devolvem o foco ao textarea.
5. `Enter` envia; `Shift+Enter` não envia; o botão de envio tem nome acessível.
6. Alternar 390 → 1440 → 390 via evento `resize` preserva a mensagem enviada e o texto digitado.
7. O cabeçalho do chat expõe os nomes acessíveis de voltar, limpar histórico e enviar mensagem.
8. O DOM mantém os dois painéis montados quando há agente selecionado, permitindo a composição lado a lado no desktop.

## Evidência visual

Capturas em 390×844 e 1440×900 da página real com dados sintéticos, registrando também:

- `scrollWidth` do documento e dos painéis (deve ser menor ou igual à viewport);
- posição/visibilidade dos cards, cabeçalho do chat, sugestões, textarea e botão de envio;
- no desktop, coordenadas dos painéis confirmando lado a lado;
- sequência de resize com texto digitado e mensagem preservados quando verificável no navegador.

As capturas e o JSON de medições ficam em `docs/evidencias/2026-10-31-agentes-responsividade/`. Nenhum dado real de estudante é usado.

## Limitações e riscos

- Os testes unitários em jsdom não calculam media queries; a composição visual é comprovada pelas capturas e medições no navegador.
- Não serão executados build ou deploy simultaneamente a Antigravity. As validações ficam registradas no relatório final.
- Não há alteração de contrato de API, autenticação, persistência de histórico ou modelo de IA.
