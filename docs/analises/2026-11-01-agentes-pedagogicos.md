# Análise funcional — Agentes Pedagógicos IA

Data: 01/11/2026. Base: `d0f194d`. Escopo: análise, testes independentes e propostas. Nenhuma implementação de produto nesta rodada; logout RN-83 permanece separado.

## Resultado

A responsividade foi corrigida e publicada em `2013388`. O módulo ainda precisa de correções funcionais antes de ganhar novos recursos: troca de agente pode sobrescrever conversa, resposta atrasada repovoa histórico limpo e dados locais fora do formato esperado podem quebrar a interface. A identificação do provedor na tela também diverge da execução real.

## Evidências e limites

Execução própria direcionada: **19 testes em quatro arquivos; 15 aprovados e quatro falhas**. Os seis testes existentes de configuração e oito de responsividade passaram. AG-05, novo teste de integração, confirmou o encaminhamento da chave/modelo Gemini sintéticos até o domínio Google com rede simulada. Não ocorreu chamada paga.

Reproduções independentes novas, sem editar testes existentes:

| ID | Aceite testado | Resultado |
|---|---|---|
| AG-01 | Alternar EM → EF2 carrega histórico EF2 sem sobrescrever com EM | Falhou: conversa EM aparece no destino |
| AG-02 | Limpar durante resposta pendente mantém histórico vazio depois de ela concluir | Falhou: resposta antiga reaparece |
| AG-03 | JSON local válido, mas fora do formato de mensagens, não quebra conversa | Falhou: hook retorna objeto em vez de array |
| AG-04 | API rejeita mensagem `system` do cliente antes de chamar o provedor | Falhou: HTTP 200 e chamada à IA simulada |
| AG-05 | Provedor/modelo pessoais conectados são encaminhados | Passou: Gemini e modelo sintético preservados |

Arquivos novos locais: `tests/unit/components/agentes/AgentesHistoricoRevisao.test.jsx` e `tests/integration/agentes_api_revisao.test.js`. Log ignorado: `tmp/analise-agentes-20261101.log`. A análise e o mapeamento dos casos precederam os testes.

Esta rodada não executou suíte completa/build: não houve alteração de produção e já existem defeitos reproduzidos. A árvore local inclui também a reprodução reprovada do logout; não está inteiramente aprovada. Não houve nova homologação de navegador, conta real, isolamento entre contas em sessão real, leitor de tela ou avaliação factual de respostas pedagógicas. A prova visual anterior foi preservada, sem alegar que valida estes novos fluxos.

## O que funciona no escopo examinado

- Dois agentes definidos: Ensino Médio e Fundamental II; nomes, segmentos e sugestões cobertos pelos seis testes de configuração.
- Prompts pedagógicos ficam no servidor. Isso evita expor sua configuração ao bundle; não impede, por si só, influência de instruções enviadas nas mensagens.
- API recusa ausência de chave pessoal, segmento desconhecido e lista vazia de mensagens, conforme leitura do código; AG-05 exercita o caminho válido BYOK.
- Layout responsivo e teclado continuam cobertos pelos oito testes anteriores. Eles simulam o hook de conversa, portanto não detectam os defeitos de histórico real.

## Correções prioritárias

### P1 — histórico do agente errado e resposta atrasada

Em `frontend/src/hooks/agentes/useAgentChat.js`, o efeito que persiste mensagens roda antes do efeito que carrega o novo `storageKey`. Quando troca o agente, as mensagens anteriores são gravadas na chave do destino e depois relidas. Isso é observado em AG-01, sem rede.

O envio também não captura uma versão de conversa/contexto. Depois de `clearHistory`, sua resposta pendente executa `setMessages` e reaparece. AG-02 comprova a falha. A mesma estrutura merece cobertura para troca de segmento e desmontagem durante envio; esses cenários adicionais foram identificados por leitura, ainda sem reprodução própria nesta rodada.

Proposta: carregar antes de permitir persistir no novo contexto; vincular envio a agente, conversa e conta; invalidar resultados antigos em limpar/trocar/sair. AbortController pode cancelar a espera local, mas não deve prometer desfazer custo já incorrido no provedor. Manter histórico anterior preservado e não duplicar perguntas no retry.

### P1 — validar mensagens antes da IA

`frontend/src/app/api/agentes/route.js` valida apenas que `messages` é array não vazio. AG-04 comprova que `role: system` do cliente chega ao caminho do provedor. O gateway central prependa o prompt próprio e depois concatena as mensagens recebidas nos provedores OpenAI-compatible; assim uma mensagem de sistema extra não é recusada.

Proposta: contrato exclusivo de conversa textual com papéis `user`/`assistant`, objetos e conteúdo string não vazio; recusar `system`, `developer`, objetos malformados e entradas excedentes antes de chamar IA. Definir limites de corpo, quantidade e tamanho das mensagens e retorno de erro legível. Os limites precisam constar de spec/testes e interface; não reutilizar silenciosamente o orçamento multimodal das atividades. Não prometer imunidade absoluta a instruções maliciosas apenas por validar papéis.

### P2 — robustez e isolamento do armazenamento

O hook usa `JSON.parse` sem validar array, papéis ou conteúdo. AG-03 comprova objeto inválido retornado ao consumidor, que chama `messages.map` em `ChatWindow`. Validar, preservar dado inválido de modo recuperável e informar recuperação; não apagar silenciosamente histórico do professor. Quota de armazenamento é ignorada hoje: a interface não informa quando deixa de salvar.

A chave `agente_history_{agentId}` não inclui conta e o hook não recebe UID. Não foi reproduzida leitura cruzada entre contas reais; o logout atual limpa storages. Ainda assim, o módulo não deve depender de toda troca de conta passar por esse caminho. Proposta: chave por conta e agente, com transição explícita dos históricos legados; como eles não identificam proprietário, não atribuí-los automaticamente ao próximo usuário. Essa mudança exige revisão independente e contrato de migração antes de código.

### P2 — regra antiga, execução e informação da tela divergem

RN-13 exige Maritalk/sabiazinho-4 exclusivo; RN-27 exige a chave/provedor do professor e o gateway já usa essa configuração. AG-05 confirmou o caminho Gemini sintético. O selo fixo “Powered by sabiazinho-4 · Maritalk” de `frontend/src/app/agentes/page.js` pode informar provedor diferente do utilizado.

Recomendação para decisão na implementação: manter BYOK multi-provedor que já funciona, alinhar RN-13 a RN-27 e mostrar configuração conectada. Quando houver fallback de modelo, distinguir “modelo configurado” de “modelo efetivo”; não alegar identificar o efetivo sem metadado da API. Não trocar provedor silenciosamente nem remover compatibilidade de configuração só para ajustar o selo. Esta análise não altera a regra nem a configuração atual.

## Melhorias para facilitar o uso

| Prioridade | Mudança proposta | Benefício/aceite |
|---|---|---|
| Alta | Aviso de chave ausente com acesso à conexão de IA | Professor entende como começar antes de enviar uma pergunta que falhará |
| Alta | Rascunho separado por agente, preservado ao voltar para seleção | Texto não enviado não desaparece ao navegar; preservar resize já aprovado |
| Alta | Repetir envio com falha sem duplicar pergunta nem misturar conversa | Erro recuperável; loading e resultado antigo vinculados à conversa correta |
| Média | Copiar resposta, com confirmação de cópia e erro de permissão visível | Reutilizar orientação em aula sem selecionar texto manualmente |
| Média | Exportar conversa em TXT com nome do agente | Guardar orientação fora do navegador; avisar que arquivo contém a conversa |
| Média | Ajuda curta sobre histórico local | Explicar que está neste navegador, não sincronizado entre dispositivos; sem prometer que sobreviva ao logout atual |
| Média | Campo opcional de contexto: disciplina, ano e objetivo | Respostas mais situadas, sem exigir nome/dado de estudante; preservar o prompt fixo do servidor |
| Baixa | Melhor apresentação de listas/títulos das respostas | Facilitar leitura; se usar Markdown, renderizar sem HTML arbitrário e testar links/conteúdo inseguro |

A limpeza atual é imediata e sem confirmação. Avaliar posteriormente uma ação “Nova conversa” com prévia/exportação e decisão de descarte. Isso muda o fluxo atual coberto por teste; não alterar comportamento/teste antigo disfarçando mudança de requisito como correção.

Respostas BNCC/SAEB/ENEM precisam de conferência docente e, quando disponível, fonte verificável. Os prompts incentivam citar códigos, mas não consultam um catálogo curricular. Não é possível garantir precisão pedagógica por leitura do código ou por teste de interface.

## Ordem recomendada e divisão entre executores

1. **Histórico/contexto e validação da API:** Antigravity ou implementação aqui mediante solicitação; revisão independente obrigatória por envolver persistência e fronteira com IA. Primeiro deixar AG-01..04 verdes sem editar os testes. Definir migração por conta antes de aplicá-la.
2. **Facilidade de reutilização:** DeepSeek/OpenCode pode adicionar copiar/exportar/ajuda em componentes, separado dos arquivos de logout e sem modificar o hook/API ainda em correção.
3. **Alinhamento BYOK/documentação e contexto pedagógico:** depois da decisão de política e da base estabilizada; validação visual 390/1440, teclado e testes de erro.

O custo total depende de revisão e retrabalho; não há medição que justifique prometer economia percentual ou superioridade entre modelos externos.

### Prompt pronto — Antigravity: correções funcionais

```text
No projeto /Users/kelsopalheta/Developer/RotinaDocente, leia AGENTS.md, specs/RULES.md, specs/PRD.md, specs/TESTS_SPEC.md e docs/analises/2026-11-01-agentes-pedagogicos.md.

Prepare e implemente, após autorização do usuário para este pacote, as correções AG-01..04. Escopo: hook useAgentChat, ChatWindow para sua integração e rota /api/agentes; specs exclusivas novas para evitar conflito com o logout. Não tocar Atividades/logout, auth-context, fila, Firebase, notas/fórmulas ou gateway central de outros módulos.

Antes de produção, registre contrato de histórico e versão de conversa, comportamento de cancelamento/retry e limites exatos da API. Corrija sobrescrita na troca de agente, resposta atrasada após limpar/trocar/desmontar e leitura de JSON inválido, preservando dados antigos recuperáveis. API aceita somente mensagens textuais user/assistant válidas e recusa papéis/objetos/tamanhos inválidos antes do provedor; manter BYOK e os prompts de servidor.

Preserve integralmente testes existentes, incluindo os dois arquivos locais de revisão AgentesHistoricoRevisao.test.jsx e agentes_api_revisao.test.js. Acrescente testes de respostas atrasadas, quota/JSON inválido, dois agentes, retry e limites sem chamadas pagas. Não forçar Maritalk nem alterar política RN-13/RN-27 nesta etapa. Não migrar histórico legado entre contas sem plano e revisão; não associar dados sem dono ao usuário atual.

Execute testes direcionados, suíte, lint e build. A árvore local também tem testes de logout pendentes: reporte falhas alheias com precisão, sem apagá-las/alterá-las para conseguir verde. Se preciso validar pacote isolado, use cópia limpa da base mais somente seu escopo; não restaurar/resetar trabalho alheio. Entregue para revisão, sem commit/push/deploy.
```

### Prompt pronto — DeepSeek: copiar/exportar/ajuda

```text
No projeto /Users/kelsopalheta/Developer/RotinaDocente, leia AGENTS.md e docs/analises/2026-11-01-agentes-pedagogicos.md.
Após autorização do usuário para o pacote visual, crie uma spec exclusiva em specs/AGENTES_REUTILIZACAO_SPEC.md e testes novos, antes de produção.

Adicione somente: botão acessível Copiar resposta nas mensagens do assistente; confirmação de cópia e erro visível quando clipboard falhar; Exportar conversa em TXT com nome do agente, usando apenas o histórico atual; ajuda curta explicando histórico local neste navegador, sem sincronização entre dispositivos e sem promessa de sobreviver ao logout.

Arquivos permitidos: frontend/src/components/agentes/ChatWindow.jsx, novos componentes auxiliares exclusivos, testes novos e docs/spec exclusiva. Se Antigravity estiver editando ChatWindow, aguarde ou entregue somente componentes auxiliares, sem sobrescrever esse arquivo. Não tocar hook, API, provedor/modelo, auth, dados do aluno, logout, specs compartilhadas ou persistência. Não adicionar biblioteca, chamada de IA, upload ou telemetria. Manter os controles atuais, incluindo Limpar histórico e sua semântica.

Não alterar/remover nenhum teste existente. Testar copiar somente resposta pretendida, erro/ausência de clipboard, exportação do agente atual, conteúdo vazio, teclado/nomes acessíveis e quebra de texto longo em 390/1440. Preservar mensagens/rascunho no resize. Antes de exportar, deixar claro que o arquivo contém a conversa. Execute testes do escopo e lint; registrar limitações da árvore com falhas de revisão alheias sem esconder/alterar testes. Entregar para revisão, sem commit/push/deploy.
```

## Pendências preservadas

Logout RN-83: correção REV3-R83-01 segue no Antigravity; nenhuma alteração nesta análise. Ao final das tarefas, concluir armazenamento das imagens de Atividades Adaptadas mantendo o plano Firebase atual, sem ativar Blaze.
