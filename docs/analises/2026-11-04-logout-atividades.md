# Revisão final — saída segura de Atividades

04/11/2026. Base publicada `87f637f`. Retomada da implementação RN-83 recebida anteriormente e mantida fora das publicações por falha REV3-R83-01.

## Causa e correção

O marcador `data-diario-rascunho` pertence ao formulário; a assinatura anterior lia somente `form.value`, inexistente. Alterar um textarea filho durante `aguardarSalvamento()` deixava a assinatura igual: a confirmação anterior era reutilizada e o logout descartava a nova edição.

A assinatura agora serializa marcadores e controles descendentes: valor atual, checked, opções selecionadas, conteúdo do editor rico e metadados de arquivos. Após a espera, qualquer diferença observada passa novamente pelo guard real. Recusar mantém edição, sessão e página; aceitar permite a saída. Uma versão inalterada mantém a confirmação anterior, sem pergunta duplicada. A captura fica apenas em memória e não é enviada, registrada em logs ou gravada em storage.

Concluída também a publicação do fluxo RN-83 já recebido: usar o logout centralizado, aguardar a fila, impedir chamadas repetidas, distinguir falha de salvamento de falha ao encerrar, oferecer nova tentativa e navegar somente após conclusão. Novos estados de erro/carregamento receberam a paleta petróleo e sálvia vigente.

## Revisão do código recebido

- Página não limpa tokens/storage nem chama Firebase Auth diretamente; a limpeza continua exclusiva do contexto existente. O contexto já limpa o usuário antes de resolver `signOut`, condição simulada nos testes de falha/retry.
- Falha da fila ocorre antes do logout, preservando a sessão e o conteúdo. Recusa de descarte não chama logout nem navegação. Duplo clique compartilha a operação em curso.
- Fórmulas, dados de alunos, autorização por módulo, provedores de IA, hook de persistência e sincronização não foram modificados.
- Os seis arquivos de testes recebidos foram comparados por SHA-256 antes/depois e permanecem idênticos. Nenhuma asserção anterior foi alterada para obter aprovação.

## Evidência própria

- REV3-R83-01 reproduzido antes da correção: 1 falha/1 teste, com logout indevido após editar o título durante a espera.
- Novo `LogoutAtividadesControles.test.jsx`: três falhas antes da correção (checkbox, seleção múltipla e editor rico), mais controle já aprovado para rascunho inalterado. Após a correção, 4/4 aprovados.
- Sete arquivos de logout: **23/23 testes aprovados**, incluindo falha/retry, recusa, conclusão da fila e chamadas duplicadas.
- Suíte completa: **1.170 testes / 258 arquivos aprovados**. Lint da página: exit 0, sem erros ou avisos. Build de produção: exit 0.
- A primeira compilação falhou por disco cheio. Removidos somente builds gerados e consolidada a instalação duplicada de dependências do checkout auxiliar, com lockfiles idênticos; nova compilação aprovada. Código e dados preservados.

Limites: testes de interface executados com React/DOM e serviços simulados; sem logout em conta real, leitor de tela ou nova escrita no banco. Esta correção não certifica toda a autenticação nem resolve propriedade do histórico dos Agentes por conta. Caderneta com nomes longos e configuração das imagens adaptadas continuam tarefas separadas; plano Firebase permanece atual.
