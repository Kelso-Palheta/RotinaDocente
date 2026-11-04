# Spec — Histórico local e contrato da API dos Agentes Pedagógicos

Data: 01/11/2026. Escopo: AG-01..AG-04 da análise `docs/analises/2026-11-01-agentes-pedagogicos.md`.
Regras relacionadas: RN-13, RN-14, RN-15, RN-16 e RN-27.

## 1. Objetivo

Eliminar quatro falhas funcionais antes de adicionar rascunhos, cópia de resposta, exportação ou ajuda de uso:

1. troca de agente não pode sobrescrever o histórico do destino;
2. resposta pendente não pode reaparecer depois de limpar a conversa nem contaminar outro agente;
3. histórico local inválido não pode quebrar a interface, deve ser preservado em backup recuperável e informado ao professor;
4. a API deve recusar mensagens fora do contrato — em especial `system`/`developer` — antes de chamar qualquer provedor de IA.

Fora de escopo: migração de históricos por conta, alteração dos system prompts, novo selo de provedor, rascunhos, copiar/exportar e ajuda de uso. O selo continua pendente de decisão entre RN-13 e RN-27.

## 2. Histórico local (RN-15)

### 2.1 Chaves

- Histórico: `agente_history_{agentId}`.
- Backup de conteúdo inválido: `agente_history_backup_{agentId}`.
- Nesta etapa não há migração por conta; a chave atual é mantida.

### 2.2 Formato aceito

O valor persistido deve ser um array JSON. Cada item deve ser um objeto com:

- `role`: apenas `user` ou `assistant`;
- `content`: string com ao menos um caractere não branco.

Campos extras em itens antigos são tolerados na leitura e removidos na normalização. A conversa exposta à interface contém somente `{ role, content }`.

### 2.3 Carga e troca de agente

- A conversa carregada pertence a uma chave. Enquanto a chave carregada não corresponder ao `agentId` atual, a interface recebe lista vazia; mensagens do agente anterior nunca são gravadas na chave do destino.
- Trocar de agente carrega a chave do destino sem alterar a chave de origem.
- Trocar de agente invalida respostas pendentes do agente anterior e libera o estado de carregamento da nova conversa.

### 2.4 Respostas pendentes, limpeza, desmontagem e repetição após falha

- Cada envio recebe um token de versão da conversa e um `AbortController` local.
- Limpar o histórico, trocar de agente, desmontar o hook ou iniciar outro envio invalida tokens anteriores e aborta a espera local (sem prometer cancelar custo já incorrido no provedor).
- O controle de montagem é reativado no setup do efeito para conviver com o ciclo duplo do React `StrictMode` e desativado no cleanup de desmontagem.
- Resposta, erro, alteração de carregamento e escrita no `localStorage` (`persistirHistorico`) de um token inválido ou de uma instância desmontada são integralmente descartados, impedindo que uma resposta atrasada recrie histórico apagado após saída/logout (`REV-AG-01`).
- Limpar remove a chave atual, zera a conversa e libera o envio; a resposta antiga não pode repovoar a lista nem a chave.
- A resposta pendente continua sendo descartada mesmo que o usuário envie outra mensagem logo após limpar.
- Quando um envio falha, o histórico anterior e a pergunta enviada permanecem preservados; repetir o envio (`retryLastMessage` ou reenvio da mesma pergunta pendente após erro) reutiliza a conversa sem duplicar a pergunta do professor.

### 2.5 Conteúdo inválido ou indisponível

- JSON malformado, valor que não seja array, item que não seja objeto ou papel/conteúdo inválido tornam todo o histórico inválido.
- O conteúdo bruto é copiado para a chave de backup antes de a chave principal ser limpa.
- A conversa reinicia vazia e a interface mostra um aviso neutro, sem apagar o conteúdo sem informar.
- Se o backup falhar, a chave principal não é sobrescrita e o aviso informa que o conteúdo original foi preservado.
- Falha de quota ao salvar mantém as mensagens em memória e mostra aviso de armazenamento; uma gravação posterior bem-sucedida pode retirar o aviso.

## 3. API `POST /api/agentes`

### 3.1 Corpo

```json
{
  "agentId": "ensino-medio",
  "messages": [
    { "role": "user", "content": "Texto" },
    { "role": "assistant", "content": "Resposta anterior" }
  ]
}
```

### 3.2 Limites

- `agentId`: obrigatório e restrito aos segmentos do MVP (`ensino-medio`, `fundamental-2`).
- `messages`: array com 1 a 50 itens.
- Cada item: exatamente os campos `role` e `content`; nenhum campo extra.
- `role`: somente `user` ou `assistant`.
- `content`: string não vazia após remoção de espaços nas pontas, com no máximo 32.000 caracteres.
- Corpo da requisição: no máximo 256 KiB (262.144 bytes).
- O cliente envia no máximo as 50 mensagens mais recentes da conversa.

`system` e `developer` enviados pelo cliente são sempre recusados. O system prompt pedagógico continua exclusivamente no servidor (RN-14).

### 3.3 Respostas de erro

| Situação | Status | Código |
|---|---|---|
| Corpo maior que 256 KiB | 413 | `PAYLOAD_TOO_LARGE` |
| JSON malformado | 400 | `INVALID_JSON` |
| Corpo sem objeto | 400 | `INVALID_BODY` |
| `agentId` inválido | 400 | `INVALID_AGENT` |
| `messages` ausente, vazio, fora dos limites ou com item inválido | 400 | `INVALID_MESSAGES` |
| Chave de IA ausente | 400 | `AI_KEY_REQUIRED` |

Toda recusa deve ocorrer antes de `callAI`/`fetch` ao provedor e trazer `message` legível em português. O caso válido preserva o formato de sucesso atual (`choices[0].message.content`).

## 4. Aceite

- Testes de revisão `AgentesHistoricoRevisao.test.jsx`, `AgentesHistoricoRevisaoIndependente.test.jsx` (`REV-AG-01`) e `agentes_api_revisao.test.js` passam sem edição.
- Novos testes cobrem: troca com resposta pendente, resposta antiga após limpar e após novo envio, resposta atrasada após desmontagem/saída sem recriar chave apagada, repetição após falha sem duplicar pergunta nem perder histórico anterior, JSON malformado, papéis inválidos, backup, quota, isolamento entre agentes, `system`/`developer`, conteúdo vazio/não string, campos extras, limites e corpo excessivo.
- Nenhum teste existente é alterado para acomodar a implementação.
- Nenhuma chamada paga, commit, push ou deploy nesta correção.
