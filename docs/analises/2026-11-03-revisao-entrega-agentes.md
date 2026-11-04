# Revisão independente — entrega dos Agentes Pedagógicos

> Validação posterior de 03/11/2026: a correção de desmontagem foi aprovada em revisão própria e árvore isolada. Consulte `docs/analises/2026-11-03-validacao-final-agentes.md`; os resultados abaixo registram suas rodadas históricas.

Data: 03/11/2026. Base: `a5705fb` + entrega local não commitada. Escopo desta rodada: revisar, testar e decidir publicação das correções AG-01..04. Não implementar o pacote DeepSeek.

## Veredito

**Publicação retida.** Os quatro cenários nomeados (troca de agente, limpeza durante resposta, histórico inválido e validação da API) passam. Porém, a revisão independente encontrou uma falha de resposta atrasada após **desmontagem/saída**: a resposta pendente recria a chave de histórico que acabou de ser apagada.

O prompt de correção do Antigravity inclui explicitamente “resposta atrasada após limpar/trocar/desmontar” e “invalidar resultados antigos em limpar/trocar/sair”. A entrega não cumpre esse ponto. Como o logout limpa o armazenamento, uma resposta que chega depois pode repovoar o histórico do professor anterior e expor a conversa ao próximo usuário. Não houve commit, push ou deploy.

## Evidências

| Verificação | Resultado |
|---|---|
| Testes direcionados da entrega + revisão | **20 aprovados / 1 falha** (`REV-AG-01`) |
| Conjunto de agentes/configuração antes da revisão | **33/33** |
| Suíte completa com a revisão | **1.133 aprovados / 2 falhas / 1.135 testes** |
| Falha alheia | `LogoutAtividadesRascunhoAlteradoRevisao.test.jsx` (REV3-R83-01), isolada, fora do escopo |
| Lint dos arquivos alterados | exit 0 |
| Build de produção | exit 0; `BUILD_ID` gerado; 37 rotas |
| Chamadas pagas | nenhuma |

Comandos principais:

```bash
cd frontend
npx vitest run --dir ../tests \
  tests/unit/components/agentes/AgentesHistoricoRobustez.test.jsx \
  tests/unit/components/agentes/AgentesHistoricoAviso.test.jsx \
  tests/unit/components/agentes/AgentesHistoricoRevisao.test.jsx \
  tests/unit/components/agentes/AgentesHistoricoRevisaoIndependente.test.jsx \
  tests/integration/agentes_api_validacao.test.js \
  tests/integration/agentes_api_revisao.test.js

npm test
npm run build
npx eslint src/hooks/agentes/useAgentChat.js src/app/api/agentes/route.js \
  src/components/agentes/ChatWindow.jsx src/dominio/agentes/ConversaAgente.js
```

## Aceite dos quatro cenários

| ID | Resultado |
|---|---|
| AG-01 — troca de agente preserva o histórico do destino | Aprovado |
| AG-02 — resposta antiga não reaparece depois de limpar; novo envio também a descarta | Aprovado |
| AG-03 — JSON inválido/papéis inválidos não quebram a tela; backup/aviso/quota cobertos | Aprovado |
| AG-04 — API recusa `system`/`developer`, conteúdo inválido, campos extras, limites e corpo excessivo antes do provedor | Aprovado |

## Falha bloqueadora — REV-AG-01

Arquivo novo de revisão: `tests/unit/components/agentes/AgentesHistoricoRevisaoIndependente.test.jsx`.

Reprodução:

1. iniciar um envio e deixar a promessa pendente;
2. desmontar o hook (simulando saída/navegação);
3. remover a chave `agente_history_ensino-medio` (simulando logout/limpeza);
4. resolver a resposta antiga;
5. observar que a chave é recriada com a pergunta e a resposta.

Resultado atual:

```json
[
  { "role": "user", "content": "Pergunta antiga" },
  { "role": "assistant", "content": "Resposta antiga" }
]
```

Esperado: `null` (a chave apagada permanece apagada).

Causa: `versionRef` é incrementado em `clearHistory` e na troca de agente, mas não na desmontagem. `persistirHistorico` é chamado pela promessa pendente depois do unmount e grava no `localStorage` mesmo que `setState` já não tenha efeito.

## Correção necessária (Antigravity)

- Invalidar o envio na desmontagem: efeito de limpeza que incrementa a versão e/ou marca a sessão como inativa; reativar no setup para conviver com StrictMode.
- Impedir `persistirHistorico` de gravar quando a conversa/sessão não estiver ativa; opcionalmente usar `AbortController` para cancelar a espera local, sem prometer desfazer custo no provedor.
- Manter a regressão `REV-AG-01` no arquivo novo de revisão e reexecutar os quatro testes de aceite, a suíte e o build.
- Não publicar enquanto `REV-AG-01` falhar.

## Publicação

Não publicada. A árvore local continua com a entrega, o teste de revisão que falha e as alterações alheias de Atividades/logout. Nenhum desses arquivos foi commitado ou enviado ao remoto. A entrega deve voltar ao Antigravity para a correção acima; depois, esta revisão pode ser repetida e, se aprovada, publicada.
