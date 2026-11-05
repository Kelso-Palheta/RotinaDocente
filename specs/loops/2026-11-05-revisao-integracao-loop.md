# Integração da Revisão ao Vivo — 05/11/2026

## Perceber e decidir

O acervo e os componentes controlados estavam publicados, mas não havia entrada funcional, persistência de salas, autenticação do transporte ou conexão ao Portal. A entrega conecta esses elementos usando Firebase/Firestore existentes, sem novo serviço, plano ou dependência do projeto. Arquitetura, contratos e plano foram registrados antes da implementação.

## Agir

- Entradas no Hub e Portal; preparação, edição/conferência docente, retomada de salas, controle, projeção e participação.
- Domínio puro e serviço com persistência transacional; identidade atual, roster congelado, vínculo revalidado, CAS, prazo servidor, recibo imutável/idempotente e pontos sem duplicação.
- API Node com proteção de origem, autenticação docente revogável, sessão Portal assinada, imagens privadas e SSE cancelável/renovável. Alunos recebem publicação comum e apenas seu recibo; distribuição completa vai ao professor/projetor.
- Aprovação isolada por docente e impressão JSON+pixels. Texto congelado por rodada; imagem de fonte divergente bloqueada. Acervo não é aprovado automaticamente.
- Rastreio explícito do acervo no servidor. O primeiro build detectou rastreamento indevido da raiz, inclusive credencial local; não foi publicado. Após correção, o manifesto contém os 324 arquivos privados necessários e nenhum `.env`, chave local, AGENTS ou config indevido. Script repetível: `node scripts/verificar-bundle-revisao.mjs`.
- Revisão independente identificou dois problemas nas imagens (fase final e fonte congelada). Ambos receberam regressões RED→GREEN e correção; revisão final sem P1/P2 identificado no escopo.

## Verificar

Verificações finais separaram a suíte comum dos cenários que dependem do emulador:

1. `env -u FIRESTORE_EMULATOR_HOST npm test -- --maxWorkers=2`: **1.396 aprovados**, nove cenários condicionais ignorados, 300 arquivos descobertos.
2. Com Firestore Emulator local: adaptador + capacidade + progressivo, `--maxWorkers=1`: **10 aprovados**, incluindo os oito cenários condicionais desses arquivos (dois testes comuns do adaptador também repetidos).
3. Transporte de cem alunos com emulador, isolado: **1 aprovado**, abrangendo o nono cenário condicional. Portanto **1.405 cenários distintos validados**, sem reduzir as verificações existentes.
4. `npm run lint`: exit 0, zero erros e onze avisos preexistentes sobre `<img>`.
5. `npm run build`: exit 0, sem aviso de tracing; rotas reais da revisão presentes.
6. Verificador do pacote: 197 questões, 324 arquivos privados no servidor, zero credenciais locais e zero IDs do acervo nos chunks cliente.
7. Smoke HTTP do build: preparação, entrada do aluno, controle e projeção retornam 200; catálogo sem sessão retorna 401 com `private, no-store`. Navegador confirmou a exigência de login docente/Portal nas entradas.

Uma execução geral com emulador e múltiplos workers encontrou `INVALID_ARGUMENT: Transaction is invalid or closed` no teste concorrente do adaptador. A execução isolada/serial do mesmo teste passou intacta, junto aos cenários de concorrência do serviço. Uma execução anterior sob build/lint concorrentes excedeu 5 s numa leitura de acervo; a suíte final com dois workers passou. Nenhum teste existente foi alterado para ocultar esses resultados; os cenários de emulador devem ser executados serialmente.

## Limites e evidência de capacidade

Ensaio dedicado com duas instâncias lógicas/clients Admin, cem streams SSE e cem POSTs pela WebAPI: cem recibos e confirmações, zero perda/duplicação, p95 POST 281 ms e SSE 380 ms na repetição final. Não equivale a dois processos HTTP, Wi-Fi escolar, carga Vercel ou aula prolongada. Estresse de duzentos envios duplicados preservou integridade, mas p95 excedeu 2 s; manter essa ressalva.

O teto de cem alunos é piloto condicionado. Acervo parcial de 197 questões/124 imagens permanece sujeito à conferência docente; nenhuma revisão humana foi simulada. Guia: `docs/guias/revisao-ao-vivo.md`. Relatório de capacidade: `docs/analises/2026-11-05-revisao-capacidade.md`.
