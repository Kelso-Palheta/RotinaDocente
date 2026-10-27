# Revisão das implementações recentes

Data: 27/10/2026. Revisão solicitada pelo usuário após concluir Dashboard Analytics. Escopo: commits `0d65d4a` (Portal/RN-75), `49f04d7` (Meu Horário/RN-76), `9dd3a27` (correção com imagens/RN-77) e `5088f26` (similaridade/RN-78). Não houve alteração funcional nesta revisão.

## Resultado

Não aprovar como totalmente correto. A suíte existente passa, mas quatro cenários adicionais reproduzem falhas. Três são lacunas nas mudanças recentes; a sobrescrita do rascunho por dados da nuvem já existia e permanece sem proteção. Reproduções usam apenas dados fictícios, componentes/repositório reais e dependências externas simuladas.

## Achados por prioridade

### 1. P1 — Nova tentativa pode gravar grade de outra conta

Local: `frontend/src/apresentacao/horario/HorarioApp.jsx`, salvamento em linhas 175–197 e troca de conta no efeito de carregamento.

Cenário reproduzido: A edita e inicia salvamento; antes de concluir, muda para B, cuja grade carrega normalmente; a gravação de A termina como pendente e atualiza o estado da tela de B; “Tentar sincronizar novamente” envia `ultimoSalvamento.current` de A usando o UID atual de B. A proteção durante o carregamento não cobre a conclusão tardia de salvamentos, e a referência não é vinculada à conta.

Impacto: mistura de dados e possível sobrescrita da grade de B. Correção recomendada: guardar UID/contexto junto ao payload, limpar referências/modais na troca, ignorar conclusões de operações de contas anteriores e recusar repetição quando UID original divergir do atual. Testar com promises controladas, incluindo troca durante gravação e nova tentativa.

### 2. P1 — Nova tentativa apaga seções anteriormente carregadas

Local: `frontend/src/app/aluno/notas/page.js`, atualização de estado nas linhas 125–147.

Cenário reproduzido: primeira leitura traz nota 6, mas falha nas entregas; nova tentativa traz `falhas.notas=true` e notas vazias, com sucesso nas outras seções; a tela substitui as notas válidas pelo objeto vazio. O teste existente verifica apenas que o nome continua visível durante a requisição, não que dados permaneçam após uma resposta parcial.

Impacto: desaparecimento temporário de notas/devolutivas da tela e possível exportação incompleta, contrariando RN-75. Não apaga notas no banco. Correção recomendada: atualizar cada seção somente quando sua leitura tiver sucesso; manter última versão visível com aviso de indisponibilidade/desatualização e tratar vazio confirmado separadamente. Aplicar a notas, atividades, entregas, tokens e redações. A API sinaliza `falhas.tokens`, mas a página também precisa apresentar esse aviso e permitir nova tentativa; hoje não há mensagem específica.

### 3. P1 — Rascunho pendente é perdido ao carregar a nuvem

Local: `frontend/src/infraestrutura/horario/HorarioRepository.js`, linhas 161–167.

Cenário reproduzido: gravação local funciona, gravação na nuvem falha e retorna pendente; carregar novamente encontra documento antigo na nuvem, prefere esse documento e sobrescreve a edição local. O estado pendente não é persistido para reconciliação. O comportamento de priorizar a nuvem já existia antes do commit; a nova indicação de pendência não resolve sua preservação.

Impacto: perda de alterações ainda não enviadas. Correção recomendada: persistir revisão/pendência por conta, conservar rascunho até confirmação, detectar conflito e apresentar escolha explícita. Evitar decidir apenas por relógio do dispositivo. Calendário/Diário com `somenteReal` devem continuar recebendo exclusivamente dados efetivamente confirmados na nuvem.

### 4. P2 — Legado é substituído antes de ser oferecido para importação

Local: `frontend/src/infraestrutura/horario/HorarioRepository.js`, `gravarIndiceConta` e chamada no carregamento (linhas 164–165).

Cenário reproduzido: chave base contém grade legada; conta autenticada possui documento de nuvem vazio; `carregarGrade` grava índice nessa mesma chave base; quando a interface chama `detectarCacheLegado`, o rascunho já foi substituído. A confirmação explícita só funciona quando o carregamento não passa por essa gravação de índice.

Impacto: perda do único rascunho legado sem decisão do professor. Correção recomendada: separar índice de descoberta e backup legado; preservar conteúdo até importação/descarte explícito confirmado. Mostrar erro se a migração falhar, em vez de remover a oferta silenciosamente.

## Melhorias verificadas e limites

- Portal: interpretação de datas serializadas, indicação de critério sem lançamento e reconhecimento visual de múltipla escolha foram acrescentados com testes específicos. Não houve alteração nas regras de autorização no diff revisado.
- Horário: cache por UID e estados de gravação são avanços, mas faltam os cenários acima de concorrência e recuperação.
- Correção com imagens: orçamento maior e validação por campo removem o teto antigo incompatível com imagens; há seleção/redução de cópias e avisos persistidos nas entregas. Não houve chamada real a Gemini nem avaliação visual da legibilidade de imagens reduzidas, portanto não se certifica a qualidade de uma correção real. O caminho legado devolve `avisoCorrecao`, enquanto o painel consome `resultado.avisos`; revisar também exibição de avisos desse caminho.
- Similaridade: comparação por sequências de palavras, pares e abertura da correção têm testes e não atribuem penalidade automática. A mudança de métrica não comprova identificação de plágio; alerta continua sujeito à leitura do professor. Revisão visual/acessibilidade em navegador real não executada.

## Evidências e validação

- Suíte oficial: **875 testes aprovados, 180 arquivos**, sem modificar testes existentes.
- Quatro reproduções adicionais: **4 aprovadas em 3 arquivos** em `evidencias-revisao-implementacoes/`. Aprovação significa que a falha foi reproduzida, não corrigida.
- `npm run build` falhou no download externo das fontes Inter e Manrope pelo `next/font`. Isso impede confirmar build nesta revisão; não demonstra regressão causada pelos commits.
- Não houve acesso a contas reais, escrita em produção, alteração de plano Firebase ou nova implementação.

Recomendação: corrigir primeiro isolamento de salvamentos entre contas, depois retenção/reconciliação de dados e legado; validar com novos testes de comportamento correto, mantendo intacta a suíte existente.
