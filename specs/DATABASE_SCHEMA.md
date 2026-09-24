# 🗄️ Esquema de Dados (DATABASE_SCHEMA) — Cloud Firestore

## 1. Coleções Principais

### `professores/{userId}`
Documento do professor com perfil e permissões.
- `nome`: string
- `email`: string
- `modulos_permitidos`: array de IDs de módulos (`['diario', 'redacao-corretor', 'calendario-pedagogico', 'gerador-atividades']`)
- `ai_config`: Objeto com a configuração de BYOK de IA do professor:
  - `provider`: string (`'gemini' | 'openai' | 'anthropic' | 'maritaca' | 'openrouter'`)
  - `apiKey`: string (chave de API do provedor)
  - `model`: string (modelo padrão ou customizado selecionado)
  - `updatedAt`: timestamp
- `updatedAt`: timestamp

---

### `professores/{userId}/turmas/data`
Documento único contendo a lista completa de turmas do professor para sincronização atômica.
- `turmas`: Array de objetos de turma:
  - `id`: string
  - `nome`: string (ex: "3º Ano A")
  - `alunos`: Array de alunos (`id`, `nome`, `dataNascimento`, `loginKey`)
  - `bimestres`: Mapa de bimestres (`"1"`, `"2"`, `"3"`, `"4"`):
    - `atividades`: Array de atividades (`id`, `nome`, `max`)
    - `notas`: Mapa `{ [alunoId]: { simulado: number, [atvId]: number } }`
    - `config`: Objeto com pesos e critérios de aprovação.

---

### `professores/{userId}/correcoes/{corrId}`
Histórico de redações corrigidas.
- `alunoNome`: string
- `turma`: string
- `tema`: string
- `result`: string (markdown de feedback)
- `scoreData`: array com notas das 5 competências
- `totalScore`: number
- `createdAt`: timestamp

---

### `professores/{userId}/alunos_adaptados/{alunoId}`
Perfis de estudantes com necessidades específicas para adaptação curricular (PEI Rápido).
- `id`: string (UUID)
- `nome`: string (ex: "Lucas Silva")
- `turmaId`: string (referência à turma do professor)
- `turmaNome`: string (ex: "3º Ano B")
- `necessidades`: array de strings (`['tea', 'di', 'tdah', 'baixa_visao', 'cegueira', 'surdez', 'motora', 'dislexia', 'discalculia', 'ah_sd']`)
- `nivelSuporte`: number (`1` - Leve, `2` - Moderado, `3` - Alto)
- `hiperfoco`: string opcional (ex: "Dinossauros, Transporte Ferroviário")
- `observacoes`: string opcional (ex: "Compreende melhor com frases curtas e apoio visual")
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

### `professores/{userId}/atividades_adaptadas/{adaptacaoId}`
Registro de atividades adaptadas geradas pelo módulo.
- `id`: string (UUID)
- `titulo`: string (ex: "Ciclo da Água - Ciências 6º Ano")
- `disciplina`: string
- `anoLetivo`: string
- `habilidadeBNCC`: string opcional (ex: "EF06CI02")
- `origem`: string (`'do_zero' | 'atividade_existente'`)
- `conteudoOriginal`: string (texto ou enunciado original fornecido)
- `alunoId`: string opcional (referência a `alunos_adaptados`)
- `alunoNome`: string opcional
- `necessidades`: array de strings
- `nivelSuporte`: number
- `atividadeAdaptada`: string (texto estruturado da atividade com formatação acessível)
- `guiaMediacao`: string (texto de orientações para o professor regente e mediador do AEE)
- `gabarito`: string opcional
- `configImpressao`: objeto com opções de fonte (`14pt` | `18pt` | `24pt`) e contraste
- `createdAt`: timestamp
- `updatedAt`: timestamp
