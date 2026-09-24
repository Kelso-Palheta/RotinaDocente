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
    "apiKey": "AIzaSy...",
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

