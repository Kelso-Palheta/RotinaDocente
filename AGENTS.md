# AI Engineering & Spec-Driven Development (SDD) Guidelines

## 1. Regras Operacionais Inegociáveis (Guardrails)
- **Zero Vibe Coding:** NUNCA escreva código em `src/` sem antes validar as especificações em `specs/` e os testes em `tests/`.
- **Blindagem de Testes:** É ESTRITAMENTE PROIBIDO alterar ou deletar arquivos dentro de `tests/` para fazer uma funcionalidade passar. Se um teste falhar, corrija apenas a implementação em `src/`.
- **TDD (Red-Green-Refactor):** 
  1. Criar o teste baseado em `specs/TESTS_SPEC.md` que falhe (Red).
  2. Escrever o código mínimo para passar (Green).
  3. Refatorar mantendo a arquitetura limpa (Refactor).
- **Clean Architecture:** Mantenha separação rígida:
  - `src/dominio/`: Entidades puras e interfaces (sem dependências externas/banco).
  - `src/aplicacao/`: Casos de uso, DTOs e orquestração.
  - `src/infraestrutura/`: Conexões, ORM, APIs externas e banco de dados.
  - `src/apresentacao/`: Rotas, controllers e CLI.

---

## 2. Árvore Estrutural Obrigatória

meu-projeto/
├── .devcontainer/
│   └── devcontainer.json                     # Jaula de isolamento Docker + Firewall
├── .specify/                                 # (Se Speckit) constitution.md
├── _bmad/                                    # (Se BMAD) agentes e personas
├── specs/                                    # Fonte Única da Verdade (SDD)
│   ├── README.md                             # Visão geral do projeto
│   ├── PRD.md                                # Requisitos e critérios de aceite
│   ├── ARCHITECTURE.md                       # Topologia e padrões técnicos
│   ├── TECH_STACK.md                         # Versões e dependências travadas
│   ├── API_SPEC.md                           # Contratos técnicos de rotas
│   ├── DATABASE_SCHEMA.md                    # Modelagem e relações de dados
│   ├── RULES.md                              # Regras invariantes de negócio
│   ├── TESTS_SPEC.md                         # Mapeamento de testes por regra
│   ├── AGENTS.md                             # Personas e restrições da IA
│   ├── GLOSSARY.md                           # Linguagem ubíqua e conceitos
│   ├── TASKS.md                              # Backlog e esteira operacional
│   ├── skills/                               # Agent Skills modulares
│   │   └── minha-skill/
│   │       └── SKILL.md
│   └── loops/                                # Registro do ciclo Perceber-Decidir-Agir-Verificar
│       └── <nome>-loop.md
├── src/                                      # Código-fonte em camadas
│   ├── apresentacao/
│   ├── aplicacao/
│   ├── dominio/
│   └── infraestrutura/
└── tests/                                    # Suíte de validação automatizada
    ├── unit/
    ├── integration/
    ├── contract/
    ├── e2e/
    └── regression/

---

## 3. Fluxo de Execução por Tarefa
1. Consultar `specs/RULES.md` e `specs/PRD.md`.
2. Mapear os casos de teste em `specs/TESTS_SPEC.md`.
3. Escrever os testes automatizados na pasta `tests/` apropriada.
4. Implementar a solução respeitando as camadas de `src/`.
5. Executar os testes e confirmar aprovação de 100% da suíte antes de finalizar a tarefa.

## Preferência de publicação
- Após concluir as alterações autorizadas e aprovar as validações necessárias, fazer commit e push automaticamente, sem pedir nova confirmação.
- Não publicar código com falhas conhecidas nas verificações. Preservar alterações alheias e informar o resultado do commit/push.

## Divisão de tarefas com DeepSeek no OpenCode
- O usuário utiliza DeepSeek gratuitamente pelo OpenCode. Priorizar essa opção para reduzir o consumo do ChatGPT quando a tarefa for adequada.
- Ao iniciar novas tarefas, indicar quais partes podem ser executadas pelo DeepSeek: documentação, textos, ajustes visuais, funções isoladas e implementações delimitadas com especificação/testes de aceite claros.
- Para as partes indicadas ao DeepSeek, fornecer prompt pronto para copiar no OpenCode, com escopo, arquivos, critérios de aceite, testes e restrições. Não executar essas partes aqui por padrão; aguardar o resultado para revisão, salvo pedido explícito para implementá-las aqui.
- Reservar este chat prioritariamente para análise, especificação, decisões de arquitetura e revisão dos diffs. Mudanças críticas de autenticação, isolamento de contas, persistência, migração e regras de notas exigem atenção e revisão independente; não presumir correção apenas por testes aprovados.
- Avaliar economia pelo esforço total de implementação, revisão e retrabalho. Não prometer percentuais de economia sem medição nem enviar mensagens/iniciar tarefas externas automaticamente.
