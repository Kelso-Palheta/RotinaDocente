# 🏗️ Arquitetura – Módulo Horário Escolar

```mermaid
graph TD
    UI["UI React (Next.js) - Página /meuhorario"] -->|chama| UC["Use Cases (CriarAula, RemoverAula, ...)" ]
    UC -->|usa| REPO["Repository (FirestoreAdapter / LocalStorageAdapter)" ]
    REPO -->|persiste em| FS["Firestore (coleção `horario_escolar`)" ]
    REPO -->|fallback| LS["LocalStorage" ]
    UI -->|exibe| I18N["i18n (pt-BR, es-ES)" ]
    UI -->|estiliza| CSS["style.css (as‑is)" ]
    subgraph Domain
        ENT["Entidade Aula"]
        VAL["Value Object Turno"]
    end
    UC -->|opera sobre| ENT
    UC -->|usa| VAL
    REPO -->|mapeia| ENT
```

## Camadas
- **Apresentação** – componentes React em `src/apresentacao/*` e página Next.js.
- **Aplicação** – casos de uso em `src/aplicacao/use-cases/*`.
- **Domínio** – entidades e objetos de valor em `src/dominio/*`.
- **Infraestrutura** – adaptadores de persistência em `src/infraestrutura/storage/*`.

## Dependências externas
- `firebase` (Firestore)
- `uuid` (geração de IDs)
- `date-fns` (manipulação de horário)
- `i18next` / `react-i18next`

---
