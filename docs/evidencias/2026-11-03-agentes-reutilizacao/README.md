# Evidências — reutilização da conversa dos Agentes Pedagógicos

Data: 03/11/2026. Dados exclusivamente sintéticos. Esta pasta registra a conferência visual do pacote de copiar resposta, exportar conversa em TXT e ajuda sobre histórico local em 390×844 e 1440×900. Não é homologação de produção e não houve deploy.

## Método

- **Componentes reais:** `ChatWindow.jsx`, `AcoesConversa.jsx`, `CopiarRespostaBotao.jsx`, `DialogoChat.jsx` e `conversaTxt.js` foram servidos por um ensaio Vite local. Apenas `useAuth`, `next/navigation` e `useAgentChat` foram substituídos por implementações sintéticas — sem conta real, Firestore, token, API ou provedor de IA.
- **Capturas:** Google Chrome headless via DevTools Protocol, em 390×844 e 1440×900, com interação real por clique e teclado.
- **Clipboard:** emulação de foco habilitada e permissão de clipboard concedida à origem do ensaio; a confirmação **Resposta copiada** foi observada na captura, sem depender do teste unitário.
- **Medições:** `Page.captureScreenshot` + `Runtime.evaluate`, registrando rolagem horizontal, posição dos controles, quebra de texto, foco, diálogo e rascunho. Resultado bruto em [medicoes.json](medicoes.json).
- **Harness (ignorado pelo Git):** `tmp/agentes-preview/capturar-reutilizacao.mjs`.

## Capturas

| Arquivo | Conteúdo |
|---|---|
| [agentes-390-reutilizacao.png](agentes-390-reutilizacao.png) | Conversa em 390 px com Copiar, Exportar e Ajuda; rascunho digitado |
| [agentes-390-copia-confirmada.png](agentes-390-copia-confirmada.png) | Confirmação **Resposta copiada** na mensagem acionada |
| [agentes-390-exportar-confirmacao.png](agentes-390-exportar-confirmacao.png) | Diálogo avisando que o TXT contém a conversa, com nome do agente e do arquivo |
| [agentes-390-ajuda-historico.png](agentes-390-ajuda-historico.png) | Ajuda sobre histórico local, separação por agente, ausência de sincronização e logout |
| [agentes-1440-reutilizacao.png](agentes-1440-reutilizacao.png) | Composição lado a lado em 1440 px, com rótulos visíveis e rascunho preservado |
| [agentes-1440-exportar-confirmacao.png](agentes-1440-exportar-confirmacao.png) | Confirmação de exportação em 1440 px |

## Resultado

- Cópia confirmada: **sim** (`Resposta copiada`).
- Exportação: aviso prévio presente, nome do agente e `conversa-agente-em.txt` corretos.
- Ajuda: cobre navegador/dispositivo, separação por agente, falta de sincronização, logout, **Limpar histórico** e exportação.
- `Escape` fecha a ajuda e devolve o foco ao botão que abriu o diálogo.
- Sem rolagem horizontal em 390 e 1440.
- Controles e diálogos dentro da viewport nas duas larguras.
- Texto longo quebra dentro da bolha nas duas larguras.
- Rascunho preservado após 390 → 1440 → 390.

Nenhum dado de aluno, conta real ou chamada de IA foi usado.
