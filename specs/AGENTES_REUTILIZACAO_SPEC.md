# Spec — Reutilização da conversa dos Agentes Pedagógicos

Data: 03/11/2026. Escopo exclusivo desta tarefa, baseado na melhoria de prioridade média de `docs/analises/2026-11-01-agentes-pedagogicos.md`.

Este arquivo não altera `specs/PRD.md`, `specs/RULES.md`, `specs/TESTS_SPEC.md`, `specs/TASKS.md` nem qualquer especificação compartilhada.

## 1. Objetivo

Permitir que o professor reaproveite uma resposta e guarde a conversa fora do navegador, sem alterar o contrato de histórico, a API, a autenticação ou o comportamento de limpeza já existente.

A entrega adiciona somente:

1. botão acessível **Copiar resposta** nas mensagens do assistente;
2. confirmação antes de **Exportar conversa em TXT**, usando apenas o histórico atual do agente selecionado;
3. ajuda curta e acessível sobre o funcionamento do histórico local.

## 2. Arquivos permitidos

- `frontend/src/components/agentes/ChatWindow.jsx`
- `frontend/src/components/agentes/AcoesConversa.jsx` (novo)
- `frontend/src/components/agentes/CopiarRespostaBotao.jsx` (novo)
- `frontend/src/components/agentes/DialogoChat.jsx` (novo)
- `frontend/src/components/agentes/conversaTxt.js` (novo, utilitário exclusivo da exportação)
- `specs/AGENTES_REUTILIZACAO_SPEC.md`
- `tests/unit/components/agentes/AgentesReutilizacao.test.jsx` (novo)

## 3. Fora de escopo

- `frontend/src/hooks/agentes/useAgentChat.js`, rota `POST /api/agentes`, `api-client`, provedor/modelo de IA e prompts de servidor.
- Autenticação, Firebase, dados de estudante, logout, página/componentes de Atividades e fila de persistência.
- Alteração de `localStorage`, migração de histórico por conta, rascunhos ou sincronização entre dispositivos.
- Alteração, remoção ou afrouxamento de testes existentes.
- Novas bibliotecas, chamadas de IA, upload, telemetria ou analytics.
- Alteração da semântica de **Limpar histórico**: continua imediata, sem confirmação, removendo a conversa atual.

## 4. Regras funcionais

### R-REU-01 — Copiar somente a resposta pretendida

- Cada mensagem com `role === 'assistant'` exibe um botão com nome acessível **Copiar resposta**.
- Mensagens do professor (`role === 'user'`) não exibem esse botão.
- O clique copia exatamente o `content` daquela mensagem, sem cabeçalho, nome do agente, mensagens vizinhas ou metadados.
- A cópia usa `navigator.clipboard.writeText`; nenhuma biblioteca é adicionada.

### R-REU-02 — Confirmação e erro de cópia

- Sucesso: a mensagem exibe confirmação visível e anunciada (`role="status"`), por exemplo **Resposta copiada**.
- Falha ou ausência de `navigator.clipboard`: a mensagem exibe erro visível e anunciado (`role="alert"`), por exemplo **Não foi possível copiar. Selecione o texto manualmente.**
- O erro não pode ser silencioso nem alterar o texto original da resposta.
- A confirmação/erro pertence somente à mensagem acionada.

### R-REU-03 — Exportar com aviso prévio

- O botão **Exportar conversa em TXT** fica no cabeçalho do chat.
- Quando não há mensagens, o botão fica desabilitado e informa que ainda não há conteúdo para exportar.
- Ao abrir, um diálogo acessível explica, antes do download, que o arquivo TXT conterá toda a conversa com o agente atual, incluindo perguntas e respostas, e que nenhum outro dado da conta é incluído.
- O usuário pode cancelar sem gerar arquivo.
- Confirmar gera um arquivo `text/plain;charset=utf-8` com o nome do agente no conteúdo e no nome do arquivo (`conversa-<nome-do-agente>.txt`).
- A exportação usa apenas a lista `messages` recebida pelo chat no momento do clique. Não lê `localStorage`, não inclui avisos de armazenamento, erros, chaves, IDs internos ou dados de outro agente.
- Falha ao gerar o download mantém o diálogo aberto e mostra erro visível.

### R-REU-04 — Ajuda sobre histórico local

- O botão **Ajuda sobre o histórico local** fica no cabeçalho do chat e funciona mesmo com a conversa vazia.
- A ajuda informa, em linguagem curta:
  - o histórico fica salvo apenas neste navegador e neste dispositivo;
  - é separado por agente;
  - não é sincronizado entre dispositivos ou contas;
  - pode ser apagado ao sair da conta, limpar os dados do navegador ou usar **Limpar histórico**;
  - a exportação em TXT é a forma de guardar uma cópia fora do navegador.
- A ajuda não promete que o histórico sobrevive ao logout.

### R-REU-05 — Teclado e acessibilidade

- Todos os novos controles são botões nativos, alcançáveis por `Tab` e acionáveis por `Enter`/`Espaço`.
- Os diálogos têm `role="dialog"`, nome acessível, foco inicial dentro do diálogo, ciclo de foco entre os controles e fechamento por `Escape`.
- Ao fechar, o foco retorna ao botão que abriu o diálogo.
- Nomes acessíveis não dependem de ícone, cor ou posição.

### R-REU-06 — Layout e conteúdo longo

- Em 390 px, os novos controles permanecem dentro do cabeçalho sem criar rolagem horizontal; os rótulos visuais podem ser reduzidos a ícones, mas os nomes acessíveis permanecem.
- Em 1440 px, os controles e a conversa continuam legíveis e alinhados.
- Respostas longas, inclusive sequências sem espaços, quebram linha dentro da bolha (`overflow-wrap: anywhere`, `word-break: break-word`).
- Eventos de `resize` não limpam mensagens nem o rascunho digitado.

## 5. Contrato do arquivo TXT

Formato determinístico, sem data ou metadados voláteis:

```text
Conversa com <nome do agente>

Você:
<pergunta>

<nome do agente>:
<resposta>
```

- Uma linha em branco separa cada bloco.
- O conteúdo das mensagens é preservado como recebido.
- Mensagens que não sejam objetos com `content` textual são ignoradas.
- Conversa vazia não gera download; o botão permanece desabilitado.

## 6. Critérios de aceite

| ID | Critério | Verificação |
|---|---|---|
| REU-01 | Copiar existe somente em respostas do assistente | teste DOM com duas respostas e duas perguntas |
| REU-02 | Copiar envia apenas o texto da resposta acionada | mock de clipboard + confirmação na mensagem correta |
| REU-03 | Falha e ausência de clipboard mostram erro visível | mock rejeitado e clipboard indefinido |
| REU-04 | Exportação exige confirmação e baixa TXT do agente atual | diálogo + Blob + conteúdo capturado |
| REU-05 | Conversa vazia não permite exportação | botão desabilitado e ausência de diálogo |
| REU-06 | Ajuda cobre navegador/dispositivo, separação por agente, ausência de sincronização e logout | texto do diálogo |
| REU-07 | Teclado e nomes acessíveis funcionam; `Escape` fecha e devolve foco | teste com `Tab`/`Enter`/`Escape` |
| REU-08 | Texto longo quebra e resize preserva mensagens/rascunho | estilos da bolha + eventos de resize em 390/1440 |
| REU-09 | Nenhum teste existente é alterado e nenhum arquivo fora do escopo muda | `git diff`/status |

## 7. Teste novo

Arquivo: `tests/unit/components/agentes/AgentesReutilizacao.test.jsx`.

Cenários mínimos:

1. botões de cópia apenas nas respostas do assistente;
2. cópia da resposta pretendida com confirmação local;
3. erro de clipboard rejeitado;
4. erro quando `navigator.clipboard` não existe;
5. confirmação antes da exportação e conteúdo TXT com todas as mensagens atuais;
6. exportação do agente selecionado sem vazar o outro agente;
7. conversa vazia desabilita exportação e mantém ajuda disponível;
8. ajuda informa histórico local, separação por agente, falta de sincronização e risco no logout;
9. abertura por teclado, foco no diálogo, fechamento por `Escape` e retorno de foco;
10. texto longo quebrável e preservação de mensagem/rascunho em 390 ↔ 1440.

## 8. Limitações e riscos

- Testes em `jsdom` não calculam media queries nem pixels; a quebra de texto é verificada pelos estilos declarados e a composição visual deve ser conferida em revisão no navegador.
- A árvore local contém a falha de logout `REV3-R83-01`, fora deste pacote. A antiga `REV-AG-01` dos Agentes já foi corrigida e publicada em `5adff9b`; não é bloqueio atual.
- Nenhum commit, push ou deploy será feito nesta rodada; a entrega é para revisão independente.


## Revisão independente — aceite complementar

Novos cenários em `tests/unit/components/agentes/AgentesReutilizacaoRevisao.test.jsx`: cancelar exportação não gera arquivo; falha de download mantém diálogo aberto com erro e permite nova tentativa; exportação bem-sucedida libera a URL temporária; Tab/Shift+Tab ficam entre os controles do diálogo e Escape retorna ao gatilho. Não alterar testes recebidos.
