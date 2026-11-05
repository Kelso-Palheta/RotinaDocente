# ⚙️ Tech Stack & Dependências Travadas — Rotina Docente

## 1. Runtime & Frameworks
- **Runtime:** Node.js `>= 18.x`
- **Framework Web:** Next.js `14.x` (App Router)
- **Biblioteca de UI:** React `18.x`
- **Estilização:** TailwindCSS `3.x` + CSS Variables (Design Tokens `simuladoapp.com.br`)
- **Ícones:** Lucide React
- **Animações:** Framer Motion

---

## 2. Backend, Autenticação e Banco de Dados
- **BaaS (Backend as a Service):** Firebase
- **Autenticação:** Firebase Auth (Google OAuth + Email/Password)
- **Banco de Dados:** Cloud Firestore (NoSQL em tempo real)

---

## 3. Inteligência Artificial & LLMs
- **Provedor Principal:** Maritaca AI / Gemini API
- **Modelo Oficial Obrigatório:** `sabiazinho-4`
- **Protocolo:** Integração via `fetch` nativo com streaming e structured output (JSON).

---

## 4. Manipulação de Arquivos e Documentos
- **Extração de Texto:** `pdfjs-dist` (PDF), `mammoth` (DOCX), Tesseract.js (OCR de imagem com **texto impresso**), modelo de visão via rota `POST /api/extrair` (**redação manuscrita**: imagem e PDF escaneado — RN-47).
- **Geração de Relatórios:** `jspdf` + `jspdf-autotable`.
- **Datas & Calendário:** `date-fns` com `pt-BR`.

## Runtime Vercel e Firebase Admin Auth (05/11/2026)

O projeto usa Node 24.x na Vercel. Firebase Admin 14.4.0 depende de jwks-rsa 4.1.0/jose 6.2.10; o carregamento CommonJS do SDK exige `require(esm)`. A Vercel desabilita esse suporte por padrão, inclusive em Node 24. Configurar `NODE_OPTIONS=--experimental-require-module` em Production e Preview, conforme a documentação oficial, e criar novo deploy. Preservar opções existentes se essa variável já estiver configurada. Não substituir verificação/revogação do SDK, não fazer downgrade de segurança e não tornar a API pública para esconder falha de inicialização.

Fonte: https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#experimental-nodejs-require-of-es-module . Problema upstream: https://github.com/firebase/firebase-admin-node/issues/3181 . Regressão real de carregamento: `tests/contract/revisao_runtime_sdk.test.js`.
