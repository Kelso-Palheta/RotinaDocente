# Auditoria 1 — Diário Pedagógico

Data: 23/10/2026. Escopo: gestão de turmas, notas, frequência, ocorrências, publicação e relatórios iniciados pelo Diário. Este documento registra a auditoria original do código local. As melhorias foram posteriormente autorizadas e implementadas nesta sessão; veja o registro de implementação abaixo. Os achados e números iniciais permanecem como histórico da análise anterior às correções.

## Implementação das sugestões — concluída localmente

Validação final: **646 testes em 117 arquivos aprovados**, build de produção aprovado e lint sem erros. Testes existentes não foram alterados.

As sete correções prioritárias e os fluxos recomendados foram implementados: critérios preservados/validados, retirada da limpeza automática ao carregar, frequência com revisão/sugestões, fila de gravação com conflitos, restauração com cópia e prévia, ocorrências autorizadas na Ficha, navegação e ações claras. Também foram incluídos busca/filtros, colagem revisável, publicação por período com resultados/repetição, visão geral/fechamento, linha do tempo, histórico/desfazer e organização por ano/arquivo/cópia de alunos.

- [Guia do Diário](../guias/diario-pedagogico.md).
- [Plano executado](../plans/2026-10-23-diario-melhorias.md).
- [Evidências visuais com dados sintéticos](evidencias-diario/).
- O histórico conserva as últimas 20 alterações neste navegador; não é arquivo permanente entre dispositivos. Registros legados sem ano não são reatribuídos automaticamente. Documento canônico agregado mantido para preservar as integrações existentes.
- Restauração confirmada só muda os dados exibidos após transação bem-sucedida. Conflitos conservam rascunho para baixar/revisar. Nenhuma nota real foi alterada nem publicada durante os testes.

## Parecer

O Diário possui uma base útil e várias funções já organizadas. O principal problema é a distância entre editar, salvar na nuvem, publicar no Portal e exportar: essas ações têm alcances diferentes, mas a tela nem sempre os explica. Antes de acrescentar recursos, recomendo proteger configurações, frequência e persistência.

## Evidências e limites

- Leitura de PRD, regras e testes do Diário; componentes, hooks, cálculos, publicação, backup e consolidação da Ficha 360º.
- **130 testes aprovados em 18 arquivos**: cálculos, ausência de nota, cores, importação de simulado, sincronização por escopo, frequência, ocorrências, perfil, login, backup, Ficha 360º e componentes de notas/importação.
- Reproduções isoladas com o código efetivo e dados sintéticos: efeito de migração sobrescrevendo configuração personalizada; escala de lançamento zero gerando `NaN`; inicialização da chamada ignorando a quantidade de aulas já salva; limpeza de vínculos com lista vazia removendo um vínculo sintético.
- As reproduções de efeitos/rotinas usam funções de gravação simuladas. Não houve acesso destrutivo ao banco, alteração de notas reais, publicação nem teste de uma sessão autenticada em produção.
- Os testes existentes não cobrem todos esses fluxos da interface. Testes verdes não significam ausência dos problemas abaixo.

## O que está correto ou bem encaminhado

- Separação de turmas e quatro bimestres; abas de notas, frequência, ocorrências e mapa anual.
- Cálculo e arredondamento centralizados; diferenciação entre ausência de nota e nota zero nos caminhos testados.
- Cores compartilhadas de nota total: abaixo da média em vermelho; aprovação abaixo de 8 em azul; excelente a partir de 8 em verde, observando a média configurada.
- Importação de simulado com prévia, correspondência por nome e proteção de notas existentes, inclusive zero.
- Importação de alunos com revisão e ordenação; cadastro manual como alternativa.
- Publicação oferece turma atual ou todas as turmas e avisa quando faltam dados necessários ao login.
- Ficha 360º possui escolha de privacidade. A evolução local também inclui feedback das atividades nos relatórios.
- Menu lateral já recolhe no celular; não precisa reconstruir a navegação inteira.

## Correções prioritárias

### 1. Configurações personalizadas são redefinidas ao abrir o módulo — alta

**Reproduzido isoladamente:** uma configuração com lançamento 10, peso do simulado 7, atividades 3 e aprovação 6 é substituída pelos padrões 5/5/5 e aprovação 5. O efeito considera qualquer diferença como necessidade de migração e passa por todas as turmas/bimestres.

**Fonte:** `frontend/src/app/diario/page.js:360`.

**Impacto:** totais e situações podem mudar sem o professor pedir. O painel Critérios oferece personalização que não permanece confiável no próximo acesso.

**Proposta:** preencher somente campos ausentes; versionar migrações; preservar critérios existentes. Mostrar exemplo de cálculo e prévia antes de mudanças que afetem notas.

### 2. Falha de carregamento pode acionar limpeza indevida de acessos — alta

`finalLoadedTurmas` começa como lista vazia. No `finally`, essa lista continua sendo considerada verdadeira e é enviada à limpeza mesmo se o carregamento falhar sem fallback. A limpeza trata como órfão tudo que não estiver na lista recebida.

**Reproduzido isoladamente:** lista vazia removeu o vínculo sintético retornado pela consulta simulada. Não significa que a remoção ocorreu no ambiente real.

**Fontes:** `frontend/src/app/diario/page.js:125` e `frontend/src/lib/firebase-aluno.js`, função `limparTodosVinculosOrfaos`.

**Proposta:** executar limpeza apenas após carregamento completo comprovado; distinguir vazio confirmado de erro. Não executar exclusões como efeito lateral de abrir uma tela. Proteger vínculos legados sem identificação completa e oferecer auditoria/recuperação.

### 3. Reabrir a chamada pode alterar a quantidade de aulas — alta

O componente recupera as presenças do dia, mas inicia a quantidade de aulas com o literal 2. A quantidade salva só é consultada ao trocar a data.

**Reprodução isolada:** registro de hoje com quatro aulas e aluno ausente abriu com o aluno ausente, porém duas aulas. Salvar novamente pode substituir a quantidade anterior.

**Fonte:** `frontend/src/components/diario/TabelaFrequencia.jsx:11`.

**Proposta:** carregar quantidade e presenças juntas; sugerir tempos a partir do Calendário/Meu Horário; sinalizar chamada existente e pedir revisão antes de sobrescrevê-la. Evitar considerar todos presentes sem confirmação do professor.

### 4. Salvamento não confirma a persistência e pode sobrescrever alterações concorrentes — alta

O Diário grava o conjunto inteiro de turmas com atraso de 500 ms e usa horário local para decidir qual cópia prevalece. Falhas de gravação são registradas no console. O callback de edição não devolve uma confirmação da nuvem; assim, aguardar esse callback em frequência/ocorrências não comprova que os dados foram persistidos.

A proteção ao sair cancela o temporizador, mas só tenta gravar se a lista final tiver pelo menos uma turma. Apagar a última turma e sair imediatamente é um caso que precisa de regressão específica: a exclusão pode não chegar à nuvem.

**Fontes:** `frontend/src/app/diario/page.js:154` e `frontend/src/hooks/diario/useTurmas.js`.

**Proposta:** estados visíveis “Salvando”, “Salvo na nuvem”, “Pendente” e “Falha”; fila de repetição; proteção contra conflito entre abas/dispositivos e confirmação de operações sensíveis. Validar que lista vazia também persiste. Separar armazenamento por conta e ano.

### 5. Critérios aceitam valores inválidos e descrições não correspondem às cores atuais — média/alta

O formulário usa conversão numérica permissiva sem validar relações entre escala, pesos e limites. O cálculo divide pela escala de lançamento.

**Reproduzido:** `simuladoMaxLanca: 0` produz `NaN`. A grade precisa rejeitar escala zero/negativa e pesos/limites inconsistentes antes de salvar.

Além disso, o formulário diz “Média Aprovação (Verde)” e “Média Recup. (Amarelo)”, enquanto os totais usam azul para aprovação e verde para excelente. Os cartões “Acima da Média/Na Média” usam outra classificação, com limite padrão de recuperação 4,99; essa faixa quase não explica uma categoria útil.

**Fontes:** `frontend/src/components/diario/TabelaNotas.jsx:248`, `frontend/src/utils/diario/calculos.js` e `frontend/src/utils/diario/coresNota.js`.

**Proposta:** validar configuração completa, centralizar regras e exibir legenda com os limites efetivos. Diferenciar faixa de rendimento de situação final; revisar os nomes dos cartões. Explicar se atividades são somadas até um teto ou proporcionalizadas: hoje o cálculo soma e limita ao teto, enquanto parte da documentação fala em proporcionalidade.

### 6. Restaurar backup substitui tudo com validação insuficiente — média/alta

O importador da lateral verifica apenas a existência de campos. Por exemplo, `alunos` pode ser um objeto em vez de lista e ainda passar nessa verificação, embora a tela espere percorrer uma lista. A mensagem de sucesso aparece após atualizar o estado local, sem aguardar a nuvem.

Existe um validador de domínio, mas a lateral usa sua própria verificação. O próprio contrato de backup ainda precisa validar notas, configurações, IDs, duplicações e versões de formato.

**Fontes:** `frontend/src/components/diario/Sidebar.jsx:59` e `frontend/src/dominio/diario/backupTurmas.js`.

**Proposta:** chamar “Restaurar backup”; validar profundamente; mostrar turmas/alunos/notas afetados; oferecer mesclar ou substituir; criar cópia de segurança antes de aplicar e só confirmar sucesso após persistência.

### 7. Compartilhamento de ocorrências na Ficha 360º está incompleto — média

O Diário de Bordo oferece “Compartilhar na Ficha 360º / Reunião com Responsáveis”. O campo é salvo, mas não encontrei consumo das ocorrências nem de `visivelFamilia` na consolidação ou exportação da Ficha 360º. O professor pode acreditar que a anotação constará no documento.

**Fontes:** `frontend/src/components/diario/DiarioDeBordo.jsx:219`, `frontend/src/dominio/diario/fichaAluno.js` e `frontend/src/lib/diario/fichaAlunoExport.js`.

**Proposta:** incluir no relatório familiar somente registros autorizados, pertinentes ao aluno ou à turma toda; mostrar prévia antes de exportar. Deixar explícito que isso não envia mensagem à família nem publica automaticamente no Portal.

## Clareza e facilidade de uso

| Hoje | Melhoria sugerida |
|---|---|
| “Bimestre” é nome da aba de notas e também seletor de período | Renomear a aba para **Notas**; manter “3º bimestre” sempre visível. |
| Importar/Exportar na lateral e outras importações na turma | Separar **Importar alunos**, **Importar notas do simulado**, **Exportar relatório** e **Backup/restauração**. |
| Ações por aluno usam emojis pouco evidentes | Menu “Ações do aluno” com texto: editar cadastro, relatório, limpar notas e remover. |
| Critérios e ações de apagar ficam junto do lançamento diário | Área própria de critérios; exclusões em opções avançadas com alcance e prévia. |
| Publicar turma envia os quatro bimestres, sem alcance visível no botão | Prévia com turma, períodos, alunos aptos e pendências; opções explícitas por bimestre ou ano. |
| Salvamento, sincronização de atividades e publicação parecem equivalentes | Explicar: **salvar** guarda no Diário; **sincronizar** traz notas das atividades; **publicar** atualiza o Portal. |
| Tab na célula impede a navegação padrão | Lançamento como planilha: Tab/Enter avançam, Esc cancela; colar várias notas com prévia. |
| Número fora da escala é limitado silenciosamente; texto parcial pode virar número | Validar entrada completa e explicar o erro; não transformar uma nota maior em outra sem aviso. |
| Tabela ampla, sem busca rápida de aluno na tela de notas | Busca, filtros de pendências/abaixo da média, primeira coluna fixa e ações acessíveis no celular. |
| Ano letivo não tem separação explícita no fluxo principal | Selecionar ano; arquivar turma e promover/copiar alunos sem misturar notas dos anos. |
| Exportação anual permanece acessível em qualquer aba | Indicar “Caderneta anual” e permitir exportar apenas período/visão atual. |
| Apenas alertas temporários para publicação parcial | Resumo persistente de publicados, ignorados e falhas; tentar novamente somente as falhas. |

A mudança de turma/bimestre já remonta `TurmaView` com uma chave contextual, o que ajuda a não carregar o editor de uma turma para outra. A melhoria deve preservar essa proteção e tratar rascunhos antes da troca.

## Novas implementações recomendadas

1. **Visão geral da turma:** notas incompletas, chamadas não registradas, alunos sem dados de acesso e publicação desatualizada. Cada alerta abre a ação correspondente.
2. **Linha do tempo por aluno:** notas, feedback, frequência e ocorrências em um lugar, com filtros de privacidade. Reaproveitar os dados existentes, sem cadastros paralelos.
3. **Histórico e desfazer:** autor, horário, origem manual/IA/importação/sincronização e valores anterior/novo; restauração de limpezas e exclusões.
4. **Conferência do fechamento:** checar atividades acima do teto, notas ausentes, escala divergente e dados de login antes de publicar ou emitir relatórios.
5. **Integração de frequência com calendário:** sugerir datas/quantidade de aulas e avisar quando o professor tentar lançar chamada em feriado ou aula cancelada; permitir exceção justificada.
6. **Política clara de publicação:** rascunho por padrão; seleção de turma/bimestre; prévia do que o aluno verá e indicação da última publicação.

## Fluxo recomendado

**Escolher ano/turma/bimestre → conferir critérios → cadastrar/importar alunos → lançar/importar/sincronizar notas → conferir pendências → publicar → acompanhar frequência, feedback e ocorrências.**

Manter quatro áreas principais: **Notas**, **Frequência**, **Ocorrências** e **Resumo anual**. Cadastro e ficha do aluno ficam no mesmo perfil; critérios, relatórios e backup têm ações próprias com nomes claros.

## Ordem de melhoria

1. Proteger critérios personalizados, limpeza de vínculos e salvamento concorrente.
2. Corrigir chamada existente e validar números/configurações.
3. Conectar ocorrências à Ficha, fortalecer restauração e mostrar estado de publicação.
4. Simplificar nomes, menus e lançamento por teclado.
5. Acrescentar visão geral, histórico/desfazer e integração de frequência.

A auditoria original foi concluída antes da implementação descrita acima. Próximo módulo a analisar: **Gerador de Atividades**.
