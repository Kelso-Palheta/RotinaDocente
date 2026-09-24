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
