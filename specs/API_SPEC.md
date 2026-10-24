# 🌐 Especificação de APIs e Contratos (API_SPEC) — SimuladoApp.Edu

## 1. Integração com Maritaca AI / LLM

### 1.1 Endpoint de Correção de Redação
- **URL:** `https://chat.maritaca.ai/api/chat/inference`
- **Método:** `POST`
- **Headers:**
  ```http
  Authorization: Key <MARITALK_API_KEY>
  Content-Type: application/json
  ```
- **Payload Request:**
  ```json
  {
    "model": "sabiazinho-4",
    "messages": [
      { "role": "system", "content": "Prompt com os critérios INEP..." },
      { "role": "user", "content": "Texto da redação e tema..." }
    ],
    "temperature": 0.2,
    "max_tokens": 2048
  }
  ```
- **Formato da Resposta:**
  ```json
  {
    "scores": {
      "c1": 160,
      "c2": 160,
      "c3": 160,
      "c4": 200,
      "c5": 160,
      "total": 840
    },
    "feedback": "Análise detalhada por competência..."
  }
  ```

---

### 1.2 Endpoint de Extração de Planejamento Anual
- **Modelo:** `sabiazinho-4`
- **Objetivo:** Converter ementas, BNCC e textos brutos em lista estruturada de tópicos com duração estimada em aulas.

---

## 2. Contratos de BYOK (Bring Your Own Key) & Gateway Unificado

### 2.1 Headers Canônicos de IA do Professor
Todas as requisições enviadas pelo frontend aos endpoints de IA (`/api/maritaca`, `/api/agentes`, `/api/corrigir`, `/api/calendario/importar`) devem conter:
```http
x-user-ai-provider: gemini | openai | anthropic | maritaca | openrouter
x-user-ai-key: <CHAVE_PESSOAL_DO_PROFESSOR>
x-user-ai-model: <MODELO_OPCIONAL>
```

### 2.2 Resposta de Bloqueio por Ausência de Chave (RN-29)
Quando o professor tentar invocar qualquer funcionalidade de IA sem possuir uma chave configurada nos headers ou no perfil:
- **Status HTTP:** `400 Bad Request`
- **Payload:**
  ```json
  {
    "error": "AI_KEY_REQUIRED",
    "message": "Você precisa conectar sua chave de IA para utilizar este recurso."
  }
  ```

### 2.3 Endpoint de Teste de Conexão: `POST /api/ai/test`
Valida a chave do professor com uma requisição de baixo consumo (ping de validação).
- **Request Body:**
  ```json
  {
    "provider": "gemini",
    "apiKey": "AQ...",
    "model": "gemini-1.5-flash"
  }
  ```
- **Response Sucesso (200):**
  ```json
  {
    "ok": true,
    "provider": "gemini",
    "model": "gemini-1.5-flash",
    "latencyMs": 420,
    "message": "Conexão estabelecida com sucesso!"
  }
  ```
- **Response Erro (400 ou 401):**
  ```json
  {
    "ok": false,
    "error": "Chave de API inválida ou sem saldo disponível no provedor selecionado."
  }
  ```

---

### 2.4 Extração de Imagem: `POST /api/extrair`
- Requer headers BYOK canônicos. Recebe `imageBase64` (sem prefixo data URL), `mediaType` e `finalidade` opcional.
- `finalidade: "documento"`: transcreve livro, lista ou material didático, preservando nomes e números. Sem esse campo, mantém a transcrição de redação manuscrita existente.
- Sucesso: `{ "text": "texto transcrito" }`. Erros reais do provedor são propagados; falta de chave usa o contrato `AI_KEY_REQUIRED`.
- Os fluxos de documentos renderizam PDFs no navegador e enviam somente as páginas que necessitam visão, nunca o PDF binário dentro de uma mensagem textual. Limites do cliente: 15MB/documento, 7MB/imagem, 10 páginas com visão por envio.
- `POST /api/adaptacoes/extrair-documento` mantém Word/TXT; PDFs visuais são processados no navegador. A rota não interpreta bytes de PDF como texto UTF-8.

## 3. Contratos de Atividades Adaptadas & Educação Inclusiva

### 3.1 Endpoint de Geração de Atividade Adaptada: `POST /api/adaptacoes/gerar`
Transforma ou cria atividade escolar adaptada segundo os preceitos do DUA e necessidades selecionadas.
- **Headers:** Requer headers canônicos de BYOK (`x-user-ai-provider`, `x-user-ai-key`).
- **Request Body:**
  ```json
  {
    "origem": "atividade_existente | do_zero",
    "conteudoOriginal": "Texto da atividade ou tema da BNCC",
    "disciplina": "Ciências",
    "anoLetivo": "6º Ano",
    "habilidadeBNCC": "EF06CI02",
    "necessidades": ["tea", "di"],
    "nivelSuporte": 2,
    "hiperfoco": "Dinossauros",
    "observacoes": "Lê com apoio de imagens e frases curtas",
    "qtdQuestoes": 3,
    "tipoQuestoes": "mista | objetiva | discursiva"
  }
  ```
- **Response Sucesso (200):**
  ```json
  {
    "ok": true,
    "atividadeAdaptada": {
      "titulo": "Ciclo da Água — Atividade Adaptada",
      "habilidade": "EF06CI02",
      "instrucoesAluno": "Passo a passo visual e leitura facilitada...",
      "questoes": [
        {
          "numero": 1,
          "tipo": "objetiva",
          "enunciado": "Enunciado em ordem direta com negrito estratégico...",
          "apoioVisualDescricao": "Ilustração do sol aquecendo a água do rio.",
          "alternativas": [
            { "letra": "A", "texto": "A água sobe em vapor." },
            { "letra": "B", "texto": "A água vira pedra." },
            { "letra": "C", "texto": "A água desaparece para sempre." }
          ],
          "gabarito": "A",
          "dica": "Lembre-se da fumaça da panela quente."
        }
      ]
    },
    "guiaMediacao": {
      "objetivo": "Compreender as etapas do ciclo da água sem a barreira da leitura densa.",
      "materiaisConcretosSugeridos": ["Copo com água morna e plástico filme para simular chuva."],
      "tempoSugeridoMinutos": 35,
      "estrategiasBloqueio": "Se o aluno demonstrar sobrecarga, faça pausas sensoriais a cada 2 questões."
    }
  }
  ```

### 3.2 Endpoint de Perfis de Alunos (PEI Rápido): `/api/adaptacoes/alunos`
- **`GET /api/adaptacoes/alunos`**: Lista os alunos inclusivos cadastrados pelo professor autenticado.
- **`POST /api/adaptacoes/alunos`**: Cadastra ou atualiza o perfil do estudante (nome, turma, necessidades multi-select, nível de suporte, hiperfoco, notas).
- **`DELETE /api/adaptacoes/alunos?id={id}`**: Remove perfil de aluno.


## POST /api/calendario/importar

Headers BYOK do provedor central de IA. JSON: `{text, disciplina?, anoLetivo?}`. Retorno: `{topicos:[{ordem,titulo,descricao,duracaoEstimadaAulas}]}` com título não vazio e duração inteira válida. Chave ausente: 400; conteúdo de IA inválido: 422; falha de provedor: erro sem persistência. A rota somente extrai; salvar ocorre após revisão explícita no cliente.

Arquivos PDF/imagem/DOCX/TXT/MD são lidos pelo extrator compartilhado no cliente, inclusive OCR quando necessário, antes de enviar o texto para organizar os conteúdos.

### Publicação de notas — RN-67
`POST /api/publicar-notas` mantém o contrato de entrada/saída e inclui `recuperacao` no documento `notasAluno/{professor}_{turma}_{aluno}`: objeto individual `{rec1?, rec2?}`, nunca o mapa de recuperações dos demais alunos. `GET /api/aluno/boletim` retorna esse campo no objeto `notas` existente. Campo ausente em publicação legada equivale a nenhuma recuperação; republicar atualiza o snapshot.

### Publicação por recorte (RN-68)
`POST /api/publicar-notas` aceita opcionalmente `periodo: "ano" | 1 | 2 | 3 | 4` (também strings numéricas) e `alvos: [{turmaId, alunoId}]`. Ausência de período preserva compatibilidade anual. A resolução de homônimos usa a turma inteira antes de filtrar os alvos.

Em publicação bimestral, máscaras atômicas de campos atualizam somente `bimestres.<período>`, recuperação do semestre correspondente e metadados, preservando outros bimestres/recuperação. A resposta mantém contadores existentes e acrescenta `resultados: [{turmaId, alunoId, nome, status: "ok" | "semData" | "error", error?}]`. Resultado individual orienta repetição apenas das falhas.


## Atividades — RN-69
- `GET /api/aluno/atividade/:id?token=...`: exige acesso emitido e vínculo vigente; token novo com segredo aleatório ou legado com sessão/vínculo revalidado no banco. Resposta pública por lista de campos permitidos. Sem cache. Arquivada permite apenas devolutiva já existente.
- `POST /api/aluno/entregar`: recebe `activityId`, `token` e respostas. Identificadores opcionais enviados pelo cliente devem coincidir com o acesso. Validação de contexto, prazo e respostas dentro da transação. 401 sem credencial, 403 acesso/contexto inválido, 400 resposta/prazo inválido, 409 entrega existente. Nunca sobrescreve correção.
- `GET /api/aluno/boletim`: valida `loginKey` da sessão contra vínculo vigente exato professor/turma/aluno. Aplica a mesma projeção pública, encontra tokens novos/legados e conserva feedback de atividade arquivada com entrega.
