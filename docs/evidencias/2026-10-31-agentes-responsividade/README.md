# Evidências — responsividade de Agentes Pedagógicos IA

Data: 31/10/2026. Dados exclusivamente sintéticos. Esta pasta registra a conferência visual de `frontend/src/app/agentes/page.js` e dos componentes de Agentes em 390×844 e 1440×900. Não é homologação de produção e não houve deploy.

## Método

- **Página real:** os componentes reais (`page.js`, `ChatWindow.jsx`, `AgentCard.jsx`, `PromptChips.jsx`) foram servidos por um ensaio Vite local. Apenas `useAuth` (autenticação), `next/navigation` e `useAgentChat` (hook de dados) foram substituídos por implementações sintéticas, sem Firestore, sem token, sem conta real e sem chamada de API ou provedor de IA.
- **Capturas:** Google Chrome headless via DevTools Protocol, em viewport de 390×844 e 1440×900, com interação real por clique (selecionar agente, clicar em sugestão, digitar, enviar) e por teclado (`Tab`). A mesma aba permaneceu aberta ao alternar 390 → 1440 → 390, para verificar preservação de rascunho e mensagens.
- **Medições:** `Page.captureScreenshot` + `Runtime.evaluate` registrando `scrollWidth`/`clientWidth`, retângulos dos painéis, cabeçalho, sugestões, textarea e botão de envio, além de nomes acessíveis e foco. Resultado bruto em [medicoes.json](medicoes.json).
- **Fonte:** o ensaio usa a pilha de fontes de sistema como fallback (Manrope/Inter não são carregadas via `next/font` fora do Next). Cores, espaçamentos, quebras e breakpoints são os do código real.
- **Git:** o harness e o perfil do Chrome ficaram em `tmp/agentes-preview/`, ignorado pelo Git. Nenhum arquivo de aplicação fora do escopo foi alterado.

## Resultados observados

| Evidência | Resultado |
|---|---|
| [agentes-390-selecao.png](agentes-390-selecao.png) | 390 px: título, ícone, instrução, os dois cards e o selo do modelo visíveis; `scrollWidth` 390 = viewport; nenhum painel ultrapassa a tela. |
| [agentes-390-conversa.png](agentes-390-conversa.png) | Após selecionar o Agente EM, a seleção sai de cena por CSS e a conversa ocupa 0–390 px, com botão de voltar, cabeçalho, boas-vindas, 5 sugestões em botões e área de envio. |
| [agentes-390-rascunho.png](agentes-390-rascunho.png) | Rascunho longo quebra em duas linhas dentro do campo (altura 41 → 62 px), sem corte; sugestões e botão de envio continuam visíveis. |
| [agentes-390-conversa-enviada.png](agentes-390-conversa-enviada.png) | Mensagem do professor e resposta do agente visíveis; a resposta contém um token longo sem espaços e quebra dentro da bolha, sem rolagem horizontal. |
| [agentes-390-foco-voltar.png](agentes-390-foco-voltar.png) | Foco de teclado no botão **Voltar para os agentes**, com contorno visível; o botão é alcançado por `Tab`. |
| [agentes-1440-selecao.png](agentes-1440-selecao.png) | 1440 px sem agente escolhido: área de seleção centralizada (400–1040 px), cards e selo sem overflow. |
| [agentes-1440-rascunho-apos-resize.png](agentes-1440-rascunho-apos-resize.png) | Após resize 390 → 1440, o rascunho digitado continua no campo e a seleção (0–300 px) fica lado a lado com a conversa (300–1440 px). |
| [agentes-1440-conversa.png](agentes-1440-conversa.png) | Conversa com mensagens preservadas após 390 → 1440; bolhas limitadas a 34 rem para leitura, painéis lado a lado. |
| [medicoes.json](medicoes.json) | `scrollWidth` igual à viewport nas oito capturas; `ladosALado: true` somente em 1440 com agente selecionado; rascunho preservado nos dois sentidos; foco alcançou **Voltar para os agentes**. |

### Medidas principais

| Captura | Viewport | `scrollWidth`/`clientWidth` | Painel de seleção | Painel de conversa | Lado a lado |
|---|---|---|---|---|---|
| agentes-390-selecao | 390×844 | 390/390 | 0–390 | oculto | não |
| agentes-390-conversa | 390×844 | 390/390 | oculto | 0–390 | não |
| agentes-390-rascunho | 390×844 | 390/390 | oculto | 0–390 | não |
| agentes-1440-rascunho-apos-resize | 1440×900 | 1440/1440 | 0–300 | 300–1440 | sim |
| agentes-390-conversa-enviada | 390×844 | 390/390 | oculto | 0–390 | não |
| agentes-1440-conversa | 1440×900 | 1440/1440 | 0–300 | 300–1440 | sim |
| agentes-1440-selecao | 1440×900 | 1440/1440 | 400–1040 | oculto | não |
| agentes-390-foco-voltar | 390×844 | 390/390 | oculto | 0–390 | não |

## Validação automatizada

- Testes novos: `tests/unit/components/agentes/AgentesResponsividade.test.jsx` — **8/8 aprovados**.
- Suíte completa: **1.110 aprovados de 1.110**, em 240 arquivos. A execução final já inclui os testes paralelos de logout/Atividades (Antigravity), que estavam vermelhos em execuções intermediárias e foram corrigidos por aquele trabalho; nenhum deles foi alterado nesta entrega.
- Lint dos quatro arquivos alterados: sem avisos.
- Nenhum build foi executado, para não concorrer com o build do Antigravity.

## Limitações

- jsdom não calcula media queries; a composição em 390/1440 é comprovada pelas capturas e medições acima, não pelos testes unitários.
- O ensaio substitui autenticação e hook de chat por dublês sintéticos; portanto valida layout, foco e preservação de estado no navegador, não a integração com Firebase, API ou provedor de IA.
- O rascunho é preservado enquanto o agente permanece selecionado. Clicar em **Voltar para os agentes** fecha a conversa intencionalmente; o histórico continuararia vindo do `localStorage` pelo hook real, que não foi alterado.
- Capturas usam fallback de fonte do sistema; pequenas diferenças de quebra de linha em relação ao Next com `next/font` são esperadas e não afetam os limites de largura medidos.
- Não houve commit, push ou deploy.
