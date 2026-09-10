# ⚙️ Tech Stack & Dependências Travadas — Gestão Docente

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
- **Extração de Texto:** `pdfjs-dist` (PDF), `mammoth` (DOCX), Tesseract.js (OCR de imagens).
- **Geração de Relatórios:** `jspdf` + `jspdf-autotable`.
- **Datas & Calendário:** `date-fns` com `pt-BR`.
