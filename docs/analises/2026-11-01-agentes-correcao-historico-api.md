# Correção — histórico e API dos Agentes Pedagógicos

> Validação posterior de 03/11/2026: a correção de desmontagem foi aprovada em revisão própria e árvore isolada. Consulte `docs/analises/2026-11-03-validacao-final-agentes.md`; os resultados abaixo registram suas rodadas históricas.

Data: 01/11/2026. Base de trabalho: `a5705fb` + alterações locais desta rodada. Escopo: AG-01..AG-04 da análise `docs/analises/2026-11-01-agentes-pedagogicos.md`.
Spec: `specs/AGENTES_HISTORICO_API_SPEC.md`.

> **Atualização de 03/11/2026:** a revisão independente encontrou o bloqueador `REV-AG-01` — resposta pendente após desmontagem/saída recria o histórico apagado. A publicação foi retida. Ver `docs/analises/2026-11-03-revisao-entrega-agentes.md`. Os quatro cenários AG-01..04 continuam aprovados nos testes direcionados.

## Resultado

As quatro falhas críticas foram corrigidas sem alterar os testes de revisão:

| ID | Correção | Evidência |
|---|---|---|
| AG-01 | Troca de agente não grava mais o histórico de origem na chave do destino; a conversa só é exposta quando pertence à chave atual. | `AG-01b` e teste de revisão `AG-01` |
| AG-02 / REV-AG-01 | Cada envio tem token de versão e `AbortController` local; limpar, trocar de agente, desmontar o hook ou iniciar outro envio descarta resposta/erro/carregamento/persistência antigos (`REV-AG-01`); repetição após falha (`retryLastMessage` / **Tentar novamente**) preserva histórico anterior sem duplicar a pergunta. | `AG-02b`, `AG-02c..e`, `AG-02` e `REV-AG-01` |
| AG-03 | Histórico inválido é validado, copiado para `agente_history_backup_{agentId}` e informado por aviso neutro; falha de backup preserva a chave original e falha de quota mantém a conversa em memória. | `AG-03b..g` e teste de revisão `AG-03` |
| AG-04 | A rota aceita apenas `user`/`assistant`, exige exatamente `role` e `content`, limita quantidade/tamanho e recusa `system`/`developer` antes de chamar o provedor. | `AG-04b..h` e teste de revisão `AG-04` |

Arquivos de produção alterados:

- `frontend/src/hooks/agentes/useAgentChat.js`
- `frontend/src/app/api/agentes/route.js`
- `frontend/src/components/agentes/ChatWindow.jsx`
- `frontend/src/dominio/agentes/ConversaAgente.js` (novo)

Testes novos, sem edição dos existentes (`AgentesHistoricoRevisao.test.jsx`, `AgentesHistoricoRevisaoIndependente.test.jsx` e `agentes_api_revisao.test.js` preservados intactos):

- `tests/unit/components/agentes/AgentesHistoricoRobustez.test.jsx`
- `tests/unit/components/agentes/AgentesHistoricoAviso.test.jsx`
- `tests/unit/components/agentes/AgentesHistoricoDesmontagemRetry.test.jsx`
- `tests/integration/agentes_api_validacao.test.js`

## Evidência de execução

- Direcionado (novos + revisão, incluindo `REV-AG-01`): **24/24** em sete arquivos.
- Conjunto de agentes/configuração: **38/38** em nove arquivos.
- Suíte completa: **1.137 aprovados / 1.138 testes** (249/250 arquivos). A única falha é `tests/unit/components/atividades/LogoutAtividadesRascunhoAlteradoRevisao.test.jsx` (REV3-R83-01), reproduzida isoladamente e pertencente ao trabalho de logout/Atividades não tocado nesta rodada.
- Lint dos arquivos alterados: exit 0, sem erros ou avisos.
- Build de produção (`npm run build`): exit 0 (37 rotas).
- Não houve chamada paga, commit, push ou deploy.

## Decisões e limites

- A chave `agente_history_{agentId}` foi mantida. Migração de histórico por conta continua fora de escopo e exige contrato e revisão independentes.
- O backup é recuperável pelo navegador (`agente_history_backup_{agentId}`), mas ainda não há botão de restauração na interface.
- O aviso de recuperação/armazenamento aparece no `ChatWindow` com `role="status"` e pode ser fechado.
- O selo “Powered by sabiazinho-4 · Maritalk” continua inalterado e pendente de decisão entre RN-13 e RN-27.
- A rota não foi alterada para impor provedor/modelo: continua usando a configuração BYOK do professor, conforme o teste AG-05.

## Prompt pronto para o DeepSeek — pacote de usabilidade

Copie o bloco abaixo em uma tarefa nova do OpenCode/DeepSeek. Ele pressupõe que a correção AG-01..04 acima já está aplicada.

```text
Você vai implementar o pacote de usabilidade dos Agentes Pedagógicos do projeto RotinaDocente, sem refazer as correções de histórico/API já concluídas.

LEIA ANTES DE CODIFICAR
- AGENTS.md (regras de SDD/TDD, camadas e restrições)
- specs/AGENTES_HISTORICO_API_SPEC.md (contrato atual de histórico e API)
- specs/RULES.md (RN-13, RN-14, RN-15, RN-16, RN-27)
- docs/analises/2026-11-01-agentes-pedagogicos.md (análise e prioridades)
- docs/analises/2026-11-01-agentes-correcao-historico-api.md (correção já feita)
- frontend/src/hooks/agentes/useAgentChat.js
- frontend/src/components/agentes/ChatWindow.jsx
- frontend/src/components/agentes/PromptChips.jsx
- tests/unit/components/agentes/* e tests/integration/agentes_api_*.test.js

CONTEXTO
AG-01..AG-04 já foram corrigidos. O hook useAgentChat expõe messages, isLoading, error, sendMessage, clearHistory, storageNotice e dismissStorageNotice. O histórico é local por agente e usa a chave agente_history_{agentId}; conteúdo inválido vai para agente_history_backup_{agentId}. Não altere esse contrato, os system prompts, a rota /api/agentes nem o selo de provedor.

OBJETIVO (quatro entregas)
1. Rascunho por agente
   - Persistir o texto digitado no textarea por agente, em chave própria (sugestão: agente_draft_{agentId}).
   - Ao trocar de agente, restaurar o rascunho daquele agente; ao voltar, o rascunho anterior deve reaparecer.
   - Enviar mensagem limpa o rascunho daquele agente. Texto vazio/whitespace não deve ser salvo.
   - Falha de quota/localStorage não pode quebrar a tela; a digitação continua em memória e o professor recebe aviso discreto.
   - "Limpar histórico" apaga mensagens, não o rascunho atual, salvo se o campo estiver vazio.
2. Copiar resposta
   - Exibir ação acessível "Copiar resposta" apenas em bolhas do assistente.
   - Usar navigator.clipboard quando disponível e fallback seguro (por exemplo, seleção temporária + execCommand) quando não.
   - Copiar exatamente o conteúdo da resposta, sem prefixos, markdown alterado ou aviso da interface.
   - Mostrar feedback acessível "Copiado" por tempo curto e tratar falha com mensagem clara, sem afirmar sucesso.
3. Exportar conversa
   - Disponibilizar "Exportar conversa" quando houver mensagens.
   - Gerar arquivo .txt no cliente com cabeçalho do agente (nome/segmento), data/hora e mensagens na ordem, identificando professor e agente.
   - Não incluir avisos de armazenamento, erros internos, chaves, headers ou metadados sensíveis.
   - Nome de arquivo seguro (sem caracteres inválidos), Blob + URL.createObjectURL com revoke posterior.
   - Não exportar conversa vazia; não fazer chamada de servidor.
4. Orientação de uso do histórico
   - Adicionar ajuda acessível (botão com aria-expanded e painel) explicando em linguagem simples: o histórico fica neste navegador/dispositivo, é separado por agente, não é sincronizado na conta/nuvem nesta versão, pode ser limpo pelo botão e pode gerar backup quando o conteúdo salvo estiver inválido.
   - Não prometer sincronização, recuperação automática ou segurança que o código não oferece.
   - Fechar com Escape, manter foco visível e funcionar em 390 px e 1440 px.

ARQUIVOS
- Permitido alterar: frontend/src/hooks/agentes/useAgentChat.js, frontend/src/components/agentes/ChatWindow.jsx e novos componentes/utils dentro de frontend/src/components/agentes ou frontend/src/dominio/agentes.
- Permitido criar testes novos em tests/unit/components/agentes/ e tests/unit/ (nomes sugeridos: AgentesRascunhos.test.jsx, AgentesCopiarExportar.test.jsx, AgentesAjudaHistorico.test.jsx).
- Proibido alterar: tests/unit/components/agentes/AgentesHistoricoRevisao.test.jsx, AgentesHistoricoRobustez.test.jsx, AgentesHistoricoAviso.test.jsx, AgentesResponsividade.test.jsx, tests/integration/agentes_api_revisao.test.js, tests/integration/agentes_api_validacao.test.js.
- Proibido tocar: frontend/src/app/atividades/page.js, testes de logout/Atividades, autenticação, fila, Firebase, gateway central, rota /api/agentes, system prompts e o selo de provedor.
- Preserve alterações não commitadas de outras pessoas; não use git checkout/reset para limpar a árvore.

TDD E ACEITE
- Escreva primeiro os testes que falham (RED), depois a implementação mínima (GREEN) e refatore.
- Rascunhos: digitar em EM, trocar para EF2, voltar e recuperar; enviar limpa somente o rascunho do agente; texto só com espaços não persiste; quota não quebra.
- Copiar: botão só em resposta do assistente; clipboard recebe o texto exato; feedback aparece; falha não mostra sucesso; usuário de teclado consegue acionar.
- Exportar: sem mensagens não baixa; com mensagens gera .txt com cabeçalho, ordem e conteúdo; não vaza aviso/chave; nome seguro; URL revogada.
- Ajuda: abre/fecha por teclado e mouse, fecha com Escape, texto não promete nuvem, layout sem overflow em 390/1440.
- Regressão: os seis arquivos de teste protegidos acima continuam passando sem edição; AG-01..04 permanecem verdes.

VALIDAÇÃO E RELATO
- Rode primeiro os testes novos e os protegidos; depois a suíte completa.
- Rode lint apenas nos arquivos alterados.
- Não rode build se houver outro build em andamento; não faça commit, push, deploy ou chamada paga.
- No relatório final, informe: arquivos alterados, cenários RED→GREEN, contagem de testes, lint, falhas alheias encontradas (por exemplo, REV3-R83-01 em LogoutAtividadesRascunhoAlteradoRevisao.test.jsx) e qualquer aceite não verificado. Não declare sucesso sem a saída dos comandos.
```

## Pendências fora deste pacote

1. Decidir o selo de provedor (RN-13 exclusivo × RN-27 BYOK) e só então alterar `frontend/src/app/agentes/page.js`.
2. Definir contrato de migração de históricos por conta antes de qualquer código.
3. Validar em navegador real, 390/1440 px, teclado/leitor de tela e build quando a árvore de Atividades estiver estável.
