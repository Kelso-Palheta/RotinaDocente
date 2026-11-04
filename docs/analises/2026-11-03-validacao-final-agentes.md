# Validação independente final — histórico/API dos Agentes Pedagógicos

Data: 03/11/2026. Base: `a5705fb`. Escopo: correções AG-01..04, resposta atrasada na desmontagem REV-AG-01 e repetição após falha. Nenhuma alteração de produção ou de testes recebidos nesta revisão.

## Veredito

**Aprovado para publicação somente o pacote dos Agentes.** Logout continua retido, sem mistura dos arquivos não aprovados.

O relatório `2026-11-03-revisao-entrega-agentes.md` registra corretamente a falha da versão anterior. Na versão local examinada nesta rodada, a correção já está implementada: setup reativa montagem; cleanup desativa, incrementa versão e aborta a espera. `persistirHistorico` verifica montagem, versão e chave; os retornos assíncronos verificam o mesmo contexto antes de atualizar estado e armazenamento. Não foi necessário aplicar aqui a exceção de implementação sugerida na mensagem do DeepSeek.

## Evidências próprias

- Execução direcionada incluindo Agentes e logout: **56 aprovados e uma falha em 57 testes/15 arquivos**.
- Os **38 testes dos Agentes em nove arquivos passaram**, inclusive AG-01..05, REV-AG-01, StrictMode com abort local, retry sem duplicação, recuperação de JSON inválido, quota, validação de papéis e limites da API.
- A única falha direcionada é REV3-R83-01, em `LogoutAtividadesRascunhoAlteradoRevisao.test.jsx`, já conhecida e externa a este escopo. Código/testes/specs locais do logout não entram na publicação dos Agentes.
- A reprodução REV-AG-01 entregue pelo DeepSeek foi executada sem edição, assim como os demais testes recebidos. Nenhum teste rastreado foi alterado/removido.

## Árvore publicável isolada

Cópia temporária de `git archive a5705fb`, recebendo somente os quatro arquivos de produção e os sete testes novos dos Agentes, além da spec exclusiva. Os testes e o código de logout pendentes não foram copiados. Dependências copiadas localmente, sem instalação/alteração do projeto original.

- `npm test`: **1.119 testes em 244 arquivos aprovados**, exit 0.
- Lint dos quatro arquivos de produção: exit 0, sem erros/avisos.
- `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0, 37 rotas.
- Conteúdo dos arquivos de produção/testes comparado por SHA-256 com a cópia validada antes do commit.
- `git diff --check`: aprovado; nenhum teste rastreado modificado/removido.

Logs finais locais ignorados: `tmp/agentes-final-isolado-{testes,lint,build}.log`. A documentação compartilhada de testes é indexada somente na seção de Agentes; a seção local de logout permanece fora do commit.

## Código examinado

- `useAgentChat`: conversa carregada por chave; persistência explícita, sem efeito que sobrescreva o destino; validação local e backup antes de limpar conteúdo inválido; aviso em quota; tokens de versão e abort na troca/limpeza/desmontagem; tentativa novamente sem duplicar a pergunta.
- `ConversaAgente`: domínio sem dependências externas, papéis textuais `user`/`assistant`, 50 mensagens, 32.000 caracteres por mensagem e 256 KiB por corpo.
- `/api/agentes`: rejeição de JSON/formato/papéis/conteúdo/limites antes de chamar provedor; prompt de servidor preservado e BYOK mantido. O limite de bytes é conferido após ler o corpo, não representa limite de memória de transporte.
- `ChatWindow`: aviso de armazenamento recuperável e erro acessível com botão de repetição; componentes anteriores e comportamento responsivo preservados.

## Limites e pendências

A validação usa dados sintéticos e rede simulada. Não houve chamada paga, nova sessão com Firebase/conta real, leitor de tela ou homologação visual nova dos avisos. As capturas responsivas anteriores permanecem evidência de seu próprio escopo, não prova destes novos fluxos.

A chave global por agente continua sem UID, conforme exclusão explícita da spec. Migração/isolamento por conta exige contrato e revisão próprios, sem atribuir automaticamente histórico legado sem dono. O backup inválido fica no navegador e ainda não há restauração pela interface. Abort cancela a espera local; não desfaz eventual custo já incorrido no provedor.

O histórico local completo é preservado, mas somente as últimas 50 mensagens são enviadas à IA; limites adicionais podem gerar erro legível. O selo fixo Maritalk e a divergência RN-13/RN-27 seguem pendentes, sem troca de provedor nesta entrega.

## Próximo pacote DeepSeek

Depois desta aprovação, o pacote delimitado é **copiar respostas, exportar conversa e ajuda de histórico**, conforme o prompt original em `docs/analises/2026-11-01-agentes-pedagogicos.md`. Evitar o prompt ampliado da entrega que inclui rascunhos persistidos e permissão de editar o hook: isso ampliaria persistência enquanto a regra por conta ainda está pendente. Rascunhos persistentes ficam separados para definição de propriedade/ciclo de vida. Não iniciar tarefa externa automaticamente.

Logout REV3-R83-01 continua pendente no Antigravity; relatório/prompt em `docs/analises/2026-11-01-terceira-revisao-logout-atividades.md`. Ao final das tarefas, concluir armazenamento das imagens de Atividades Adaptadas mantendo o plano Firebase atual, sem ativar Blaze.
