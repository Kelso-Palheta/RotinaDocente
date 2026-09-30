# Spec: Perfil Inclusivo no Cadastro do Diário Pedagógico + Ponte para Atividades Adaptadas

**Versão:** 1.0
**Status:** Em Revisão
**Autor:** Professor (decisões) / Agente IA (redação)
**Data:** 2026-09-30
**Reviewers:** N/A

---

## 1. Resumo

Ampliar o cadastro do aluno no Diário Pedagógico com os campos de perfil inclusivo que hoje só existem no módulo de Atividades Adaptadas (nível de suporte, âncora de engajamento/hiperfoco e observação pedagógica) e criar uma ponte de leitura: o form de adaptações passa a ter o botão "Carregar do Diário", que seleciona um aluno de uma turma e preenche automaticamente o perfil inclusivo usado na geração de atividades.

---

## 2. Contexto e Motivação

**Problema:**
O form "2. Perfil Inclusivo & Necessidades Específicas" das Atividades Adaptadas exige informação que o professor só consegue preencher digitando na mão ou importando planilha/Banco PEI. Já no Diário Pedagógico ele cadastra os alunos (com necessidades DUA desde a RN-43), mas **não** consegue registrar nível de suporte, hiperfoco nem observação pedagógica — dados que mudam o resultado da geração adaptada (o `AdaptacaoPromptBuilder` já consome exatamente esses campos).

**Evidências:**
- RN-43 (aprovada e implementada) já gravou `necessidades` no aluno do Diário, mas não os demais campos.
- `AlunoInclusivo` (Banco PEI) já modela `nivelSuporte`, `hiperfoco`, `observacoes` — o modelo existe, falta a origem no Diário.
- O form de adaptações tem dois caminhos de origem (Importar Lista, Banco PEI) e nenhum que reaproveite os alunos já cadastrados no Diário.

**Por que agora:**
Com RN-43 pronta, o aluno do Diário já é o cadastro central do professor. Completar o perfil inclusivo lá e ligá-lo às adaptações elimina dupla digitação e garante que as dificuldades registradas sejam usadas de fato na geração.

---

## 3. Goals (Objetivos)

- [ ] G-01: O professor consegue cadastrar/editar nível de suporte (1/2/3), âncora de engajamento/hiperfoco e observação pedagógica do aluno dentro do Diário Pedagógico (cadastro manual e edição na tabela).
- [ ] G-02: No form de Atividades Adaptadas existe o botão "Carregar do Diário" que, ao selecionar turma + aluno, preenche automaticamente identificação, necessidades, nível de suporte, hiperfoco e observações.
- [ ] G-03: Dados legados (alunos sem os campos novos) continuam funcionando sem migração, com defaults equivalentes aos atuais.

**Métricas de sucesso:**
| Métrica | Baseline atual | Target | Prazo |
|---------|---------------|--------|-------|
| Campos de perfil inclusivo disponíveis no Diário (cadastro + edição) | 0 de 3 (0%) | 3 de 3 (100%) | pós-deploy |
| Origens de perfil no form de adaptações | 2 (Importar, Banco PEI) | 3 (Importar, Banco PEI, Diário) | pós-deploy |
| Regressões na suíte de testes | 0 falhas (195/195) | 0 falhas (195 + novos testes do RN-46) | pós-implementação |
| Falhas de leitura do seletor tratadas com feedback | 0 (recurso não existe) | 100% dos erros exibem mensagem + retry | pós-deploy |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: Campo separado de "Nome de exibição / Iniciais LGPD" — o Diário já usa nome completo (necessário ao login) e a identificação curta continua sendo responsabilidade do form de adaptações.
- NG-02: Sincronização automática ou bidirecional entre Diário e Banco PEI — a ponte é leitura única no momento de "Carregar do Diário"; alterações posteriores em uma fonte não propagam para a outra.
- NG-03: Importação em lote (Excel/CSV) do Diário com os campos novos — a importação atual de turmas continua aceitando apenas nome, data de nascimento e necessidades.
- NG-04: Qualquer mudança no Portal do Aluno, no login ou em fluxos de notas.
- NG-05: Alterar a validação do Banco PEI (`AlunoInclusivo` continua exigindo ≥1 necessidade; o Diário continua opcional).

---

## 5. Usuários e Personas

**Usuário primário:** Professor da rede, logado, que já cadastra turmas e alunos no Diário Pedagógico e produz atividades adaptadas.

**Jornada atual (sem a feature):**
1. Cadastra o aluno no Diário com nome, nascimento e necessidades.
2. Vai para Atividades Adaptadas e re digita tudo à mão (ou abre Banco PEI/importa planilha) para ter nível de suporte e hiperfoco.

**Jornada futura (com a feature):**
1. Cadastra o aluno no Diário com nome, nascimento, necessidades **e perfil inclusivo**.
2. Em Atividades Adaptadas, clica em "Carregar do Diário", escolhe turma e aluno → perfil inteiro já preenchido.
3. Gera a atividade adaptada com o perfil correto sem redigitação.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | A função `criarAlunoDiario` do domínio deve aceitar e normalizar `nivelSuporte`, `hiperfoco` e `observacoes`: nível aceita apenas 1, 2 ou 3 (ausente/inválido → campo omitido); textos são trimados e omitidos quando vazios. Campos ausentes nunca são persistidos. | Must | Teste unitário: criar aluno com valores válidos persiste os 3; com inválidos/vazios o objeto serializado não contém os campos. |
| RF-02 | A função `atualizarAlunoDiario` do domínio deve aplicar a mesma normalização aos 3 campos quando presentes no merge; valor vazio/inválido no update **remove** o campo do aluno (mesmo comportamento já usado para `necessidades`). | Must | Teste unitário: update com `hiperfoco: '   '` remove o campo; update com `nivelSuporte: 5` remove o campo. |
| RF-03 | O formulário de cadastro manual do aluno no Diário (TurmaView) deve exibir: Nível de Suporte (1 Leve / 2 Moderado / 3 Intenso, default 1), Âncora de Engajamento/Hiperfoco (texto) e Observação Pedagógica (texto); o professor deve conseguir enviar esses valores ao `addAlunoManual`. | Must | Ao cadastrar preenchendo os campos, o aluno persistido na turma contém os valores normalizados (RF-01). |
| RF-04 | O editor de aluno da tabela de notas (junto ao editor existente de necessidades) deve permitir ao professor alterar os 3 campos, persistindo via `updateAluno` (RF-02). | Must | Alterar nível 1→3 na tabela reflete no aluno persistido e nos badges. |
| RF-05 | O form de Atividades Adaptadas deve exibir, no card "2. Perfil Inclusivo", o botão "Carregar do Diário" ao lado de "Importar Lista" e "Carregar do Banco PEI". | Must | O botão existe, é clicável e abre o seletor de turma/aluno. |
| RF-06 | O seletor de "Carregar do Diário" deve listar as turmas do professor autenticado (mesma fonte do Diário: `professores/{uid}/turmas/data`) e seus alunos; ao escolher um aluno, o form deve ser preenchido com: identificação (nome), necessidades (sanitizadas), nível de suporte, hiperfoco e observações. | Must | Selecionar um aluno com perfil completo preenche os 5 campos do form; aluno sem campos novos preenche com defaults (nível 1, textos vazios). |
| RF-07 | Após o preenchimento, o form deve exibir o vínculo ativo (badge "Diário: {nome}") com a ação "Desvincular"; ao desvincular, o sistema deve limpar o vínculo e restaurar o estado vazio default do form. | Should | Desvincular zera nome, necessidades, nível (1), hiperfoco e observações. |
| RF-08 | O domínio deve expor a função pura `paraPerfilInclusivo(alunoDiario)` que reutiliza `sanitizarNecessidades` e aplica default de nível 1, retornando o perfil pronto para o form. | Must | Teste unitário cobre: aluno completo, aluno legado sem campos, necessidades inválidas descartadas. |
| RF-09 | O sistema deve manter os campos novos como dados sensíveis (LGPD/LBI): exibidos apenas nas telas do professor autenticado (Diário e Adaptações), nunca enviados ao Portal do Aluno nem a logs de cliente. | Must | Nenhum endpoint do Portal do Aluno lê os campos; código do Portal não os referencia. |

### 6.2 Fluxo Principal (Happy Path)

1. Professor abre a turma no Diário → "Cadastrar Aluno".
2. Preenche nome, nascimento, chips de necessidades, **Nível 2 — Moderado**, hiperfoco "Dinossauros", observação "Sensível a ruídos".
3. Sistema grava o aluno com os 3 campos normalizados na turma.
4. Professor abre Atividades Adaptadas → card 2 → "Carregar do Diário".
5. Seleciona a turma e o aluno → form preenchido (nome, necessidades, nível 2, hiperfoco, observação) + badge "Diário: {nome}".
6. Gera a atividade: o `AdaptacaoPromptBuilder` usa o perfil completo. Resultado: atividade adaptada coerente com o perfil registrado.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A — Aluno legado (sem campos novos):**
1. Professor carrega do Diário um aluno cadastrado antes desta feature.
2. Form preenche nível 1, hiperfoco e observações vazios, necessidades conforme RN-43 (ou vazias).
3. Nenhum erro; geração funciona como hoje.

**Fluxo Alternativo B — Edição posterior na tabela:**
1. Professor edita o nível do aluno na tabela de notas (ícone ao lado das necessidades).
2. `atualizarAlunoDiario` normaliza e persiste; badges/atualização refletem na hora.
3. Próximo "Carregar do Diário" desse aluno traz o valor novo.

**Fluxo Alternativo C — Desvincular e montar manualmente:**
1. Professor carrega do Diário e depois clica em "Desvincular".
2. Form volta ao estado vazio (comportamento idêntico ao "Desvincular" do Banco PEI).
3. Ele monta o perfil manualmente e gera.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Compatibilidade retroativa | 0 migrações | Campos opcionais; docs legados continuam válidos lendo defaults |
| RNF-02 | Segurança/LGPD | Somente professor autenticado | Mesma restrição da RN-43; dados vão a IA apenas na geração iniciada pelo professor (BYOK) |
| RNF-03 | Performance | Sem novas queries por aluno | O seletor lê o doc de turmas já existente (1 read); sem escanear coleções |
| RNF-04 | Acessibilidade | Rótulos visíveis + campos com label | Campos seguem o padrão dos formulários existentes (label + placeholder + estados de foco) |

---

## 8. Design e Interface

**Componentes afetados:**
- `src/components/diario/TurmaView.jsx` — form "Cadastrar Aluno" ganha os 3 campos.
- `src/components/diario/TabelaNotas.jsx` — editor de perfil do aluno (junto ao existente de necessidades).
- `src/app/adaptacoes/page.js` — botão "Carregar do Diário" + seletor (turma → aluno) + preenchimento do form.
- `src/dominio/diario/AlunoDiario.js` — normalização (RF-01/RF-02) + `paraPerfilInclusivo` (RF-08).
- `src/hooks/diario/useTurmas.js` — encaminha os campos novos em `addAlunoManual`/`updateAluno`.

**Comportamento esperado:**
- Nível de Suporte: 3 opções (cards/segmented como no form de adaptações), default Nível 1.
- Hiperfoco e Observação: inputs de texto simples com placeholder explicativo (padrão dos exemplos do form de adaptações).
- "Carregar do Diário": terceiro botão no header do card 2, mesmo estilo visual dos dois existentes; abre modal/seletor com lista de turmas (dropdown) → alunos da turma escolhida.

**Estados da UI:**
- Estado vazio: seletor sem turmas → "Nenhuma turma cadastrada no Diário"; turma sem alunos → "Nenhum aluno nesta turma".
- Estado de carregamento: leitura única do doc de turmas com indicador discreto no seletor.
- Estado de erro: falha de leitura → mensagem "Não foi possível carregar as turmas do Diário" + tentar novamente; o form permanece editável manualmente.
- Estado de sucesso: badge "Diário: {nome}" + campos preenchidos e editáveis.

---

## 9. Modelo de Dados

**Entidade modificada:** aluno embutido em `professores/{userId}/turmas/data` → `turmas[].alunos[]`

```
aluno {
  id: string
  nome: string
  dataNascimento?: string        // ddMM (existente)
  necessidades?: string[]        // IDs DUA sanitizados (RN-43, existente)
  nivelSuporte?: 1 | 2 | 3       // NOVO — omitido quando ausente/inválido; leitura default = 1
  hiperfoco?: string             // NOVO — trim; omitido quando vazio
  observacoes?: string           // NOVO — trim; omitido quando vazio
}
```

**Migrações necessárias:** Não — campos opcionais; alunos legados permanecem intactos e são lidos com defaults (RF-01/RNF-01).

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| Doc `professores/{uid}/turmas/data` (Firestore) | Obrigatória | Seletor exibe erro + retry; form segue manual |
| `CATEGORIAS_MAP` (catálogo DUA) | Obrigatória | Já é dependência da RN-43; sanitização idêntica |
| Banco PEI / Importador Excel | Opcional | Fluxos existentes inalterados |
| API de geração de adaptadas | Obrigatória (fluxo posterior) | Fora desta spec; usa perfil já preenchido |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Aluno legado sem campos novos | Documento de antes da feature | Leitura com defaults: nível 1, hiperfoco '' e observações ''; nenhum erro |
| EC-02: Valor inválido de nível | `nivelSuporte: 4`, `'abc'`, `null` na gravação | Campo omitido no doc; leitura retorna default 1 |
| EC-03: Texto só de espaços | `hiperfoco: '   '` no update | Campo removido do aluno (RF-02) |
| EC-04: Aluno sem necessidades | Selecionar aluno que nunca marcou chips | Perfil carrega com chips vazios (permitido — diferente do Banco PEI) |
| EC-05: Turma/aluno sem dados de perfil | Ponte em aluno parcial | Campos preenchidos com defaults; geração segue com perfil parcial |
| EC-06: Professor sem turmas | Abrir "Carregar do Diário" sem nenhuma turma | Mensagem de estado vazio no seletor; sem crash |
| EC-07: Desvincular | Clicar em "Desvincular" | Todos os campos do perfil voltam aos defaults (estado inicial) |
| EC-08: Atualização concorrente | Editar nível na tabela enquanto abre o seletor | O seletor lê o estado atual do doc no momento da abertura (sem cache local entre telas) |
| EC-09: Timeout/falha na leitura do Firestore | Doc de turmas não responde ou rede offline | O seletor exibe "Não foi possível carregar as turmas do Diário" com botão "Tentar novamente" (nova tentativa apenas sob ação do usuário, sem loop automático) e o form permanece utilizável manualmente |
| EC-10: Dados parciais no doc de turmas | Doc corrompido ou alunos com shape inesperado | O seletor ignora entradas sem `nome` e segue com os válidos; nunca propaga erro bruto de JS ao usuário |

---

## 12. Segurança e Privacidade

- **Autenticação:** professor logado (mesmo `userId` dono do doc de turmas).
- **Autorização:** leitura/escrita restritas ao documento `professores/{uid}/turmas/data` do próprio usuário (regra já existente).
- **Dados sensíveis:** `necessidades`, `nivelSuporte`, `hiperfoco` e `observacoes` são dados de saúde/condição — tratamento LGPD/LBI igual ao da RN-43: exibidos só nas telas do Diário/Adaptações do professor; **nunca** ao Portal do Aluno; enviados a modelo de IA apenas dentro da geração adaptada iniciada explicitamente pelo professor (chave BYOK dele), nunca em logs de cliente nem telemetria.
- **Auditoria:** não aplicável (mesmo modelo do Diário — sem log de alterações hoje).

---

## 13. Plano de Rollout

- **Estratégia:** Big bang (campos opcionais; sem feature flag e sem migração de dados).
- **Como reverter:** `git revert` do commit de deploy — docs com campos extras são ignorados pelos leitores antigos (campos desconhecidos são inofensivos no Firestore).
- **Monitoramento pós-deploy:** erros de console nas telas de Diário/Adaptações; conferir 1 cadastro manual + 1 ponte com aluno real.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| — | Nenhuma — todas as decisões foram fechadas na entrevista (ver §15). | — | — | — |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| Escopo = cadastrar no Diário **E** ponte "Carregar do Diário" nas adaptações | Só cadastrar no Diário; só ponte sem campos novos | Sem a ponte o cadastro não é aproveitado; sem os campos novos a ponte não teria o que carregar |
| 3 campos novos (nível, hiperfoco, observações); sem "Iniciais LGPD" | 4 campos com nome de exibição | O Diário já opera com nome completo (login/boletim); inicial separada só agregaria divergência |
| Edição em cadastro **e** tabela de notas | Só no cadastro | Mesmo padrão da RN-43 (necessidades já são editáveis nos dois pontos) |
| Campos opcionais com default (nível 1), omitidos quando vazios | Obrigatórios / always-persist | Compatibilidade total com dados legados e estilo da RN-43 (não persistir vazio) |
| Ponte = leitura única no momento do carregar (sem sync automática) | Sincronização bidirecional Diário↔Banco PEI | Evita conflito de fonte de verdade e escopo de migração; NG-02 |

---

## Apêndice

### Referências
- `specs/RULES.md` — RN-43 (base), RN-31/32/33 (Banco PEI)
- `specs/TESTS_SPEC.md` — testes de RN-43 (sanitização) como padrão dos novos testes
- `frontend/src/dominio/diario/AlunoDiario.js` — entidade a estender
- `frontend/src/dominio/adaptacoes/AlunoInclusivo.js` — modelo de referência dos campos

### Histórico de Revisões
| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-09-30 | Agente IA | Criação inicial (entrevista com PO concluída) |

---

## Relatório de Avaliação (spec_scorer.py)

```
SCORE TOTAL: 88.0/100 — ✅ Boa — Pronta com ajustes menores

Completude    100% (peso 30%) → 30.0
Testabilidade 100% (peso 25%) → 25.0
Clareza        40% (peso 20%) →  8.0
Escopo        100% (peso 15%) → 15.0
Edge Cases    100% (peso 10%) → 10.0

⚠️ Melhoria restante (menor): alguns textos ainda sem sujeito explícito
   (não bloqueia — RFs principais têm sujeito e critério de aceite testável).
✅ Pontos fortes: todas as seções preenchidas; testabilidade e edge cases 100%.

Histórico: 79.0 → 88.0 após métricas numéricas, sujeitos explícitos nos RFs
e EC-09/EC-10 (timeout do Firestore e dados parciais).
```
