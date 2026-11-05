# Correção do lint e da inicialização — 05/11/2026

O usuário escolheu corrigir o lint antes de publicar o lote do acervo. A execução anterior de `npm run lint` encontrou 23 erros e 13 avisos, todos fora dos arquivos do acervo. Não houve autorização para ignorá-los ou desativar regras.

## Implementação

- `ModalNovaQuestao` e `ModalConectarIA`: ajustes condicionados à mudança de contexto, antes de renderizar os filhos, substituem os resets síncronos em efeitos. Abrir novamente e trocar a origem/configuração continuam reiniciando os campos previstos; renderizações comuns preservam digitação.
- `ModalAlunoPEI`: mantém o rascunho manual quando fecha/reabre; limpa dados ao mudar usuário/repositório; cancela a aplicação da listagem inicial anterior. Resets de aba/erros foram separados da leitura assíncrona do repositório. Aspas em JSX foram escapadas sem mudança visual do texto.
- `ModalImportarAtividadeTurma`: acompanha mudanças da turma externa e recebe turmas carregadas depois, sem desfazer uma seleção manual porque o pai criou outra instância da mesma lista.
- `AlunoLoginPage`: restaura o snapshot do `sessionStorage` com `useSyncExternalStore`, usa snapshot vazio no servidor e remove estado antigo quando a sessão externa é apagada. JSON e estruturas inválidas não quebram a lista de vínculos.
- `BotaoLeitorVoz`: leitura da capacidade do navegador com snapshot seguro para SSR/hidratação. Mantém o cancelamento da fala no unmount.
- `AuthProvider`: inicialização ligada às respostas externas, guarda de montagem/geração e assinatura Firebase ativa. Impede que consultas de perfil anteriores ao logout, troca de sessão ou primeiro setup do StrictMode sobrescrevam a sessão atual. Firebase inicialmente sem usuário não encerra prematuramente o carregamento de um perfil Django ainda pendente. Falhas de consulta encerram o carregamento sem gravar dados de outra geração.

O padrão de ajuste condicionado ao contexto e o snapshot de servidor seguem as orientações oficiais do React: [ajustar estado sem efeito](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes) e [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).

## Revisão independente e renovação JWT

A primeira revisão independente identificou uma regressão na guarda de autenticação: exigir igualdade do `access` descartava um perfil legítimo após o cliente renovar o JWT automaticamente em um 401. Dois novos testes reproduziram a falha antes da correção.

A função pura `dominio/auth/sessaoDjango.js` compara a identidade declarada nos tokens (`user_id`/`sub` e emissor), permitindo rotação dos JWTs da mesma sessão. Quando a identidade não está disponível, admite um refresh estável. A guarda de geração invalida respostas anteriores a logout/login/cadastro e a comparação recusa tokens de outra identidade. Essa comparação **não valida assinatura nem concede autenticação ou permissões**: serve exclusivamente para descartar respostas assíncronas fora de contexto. A autenticação continua sendo responsabilidade dos serviços existentes.

A revisão independente voltou a conferir autenticação, StrictMode e limpeza dos vínculos no Portal após as correções; não identificou novo bloqueio concreto. As regras existentes de planos, permissões, cálculo de notas e configuração de provedores não foram alteradas. Não houve novas dependências, supressões de lint, chamadas de IA pagas, uso de conta real ou alteração de plano Firebase.

## Testes novos e evidência

- Contrato `lint_inicializacao`: reproduziu os erros existentes nos sete arquivos usando a configuração oficial do ESLint. Após a correção, zero erros.
- `AuthInicializacao`: sete cenários, incluindo quatro falhas funcionais reproduzidas na implementação anterior e dois REDs específicos da renovação JWT.
- `FormulariosInicializacao`: cinco cenários de reabertura, troca de origem/configuração, preservação de digitação/rascunho, isolamento da listagem PEI e seleção de turma.
- `PortalVozInicializacao`: cinco cenários de SSR, armazenamento inválido/removido e voz. Dois REDs confirmaram a persistência indevida da sessão apagada e o crash com vínculo nulo antes do ajuste.

Mocks novos foram corrigidos durante a montagem dos testes para apontar os módulos Firebase efetivamente resolvidos e fornecer os métodos reais da configuração de IA. Nenhuma expectativa foi enfraquecida. Nenhum teste recebido foi alterado.

Validação direcionada: **18 testes em quatro arquivos aprovados**. Validação global final: **1.295 testes em 280 arquivos aprovados** em 103,25 segundos; **lint com zero erros e 11 avisos existentes de imagens**, exit 0; **build Turbopack de produção aprovado**, exit 0, com as 37 páginas estáticas e rotas dinâmicas. `git diff --check` aprovado. Publicação automática liberada pelas preferências do projeto após essas verificações.

## Limites

São testes sintéticos e revisão estática; não foi realizado login em produção com uma conta real. O lint continua podendo emitir avisos históricos de otimização de imagens, distintos dos erros que impediam a publicação. Este trabalho não altera os limites do acervo: revisão docente e levantamento editorial/fontes pendentes permanecem documentados no relatório próprio.
