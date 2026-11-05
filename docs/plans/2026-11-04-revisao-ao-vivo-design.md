# Revisão ao Vivo — desenho e divisão

## Requisitos confirmados

Arte/ENEM; regular, PPL e reaplicações no acervo inicial. Recorte proposto e mantido na divisão: 2009–2025. Aula com conteúdo, questão temporizada, nomes de respondentes, distribuição A–E, explicação de cada alternativa e gamificação. Login do aluno e professor. Buscar maior capacidade estável comprovada, sem contratar infraestrutura ou ativar cobrança automaticamente.

## Alternativas consideradas

1. **Módulo independente integrado ao Portal (recomendado):** separa ritmo da aula de atividades assíncronas e notas. Reutiliza identidade; exige orquestração própria de sala.
2. Estender Gerador de Atividades: reaproveita editor, mas mistura entrega assíncrona, recuperação e tempo real, aumentando risco de regressão.
3. Plataforma externa: reduz implementação própria, mas fragmenta login, conteúdo, relatórios e controle da experiência.

Adotar componentes independentes e conteúdo versionado, integrados por controlador do novo módulo. Nenhuma mudança nas regras de notas. Toda regra crítica é validada no servidor. Transporte definitivo depende de ensaio técnico no plano atual, sem prometer que Firestore gratuito suporta um aulão de tamanho arbitrário.

## Três execuções

| Execução | Dono dos arquivos | Entrega |
|---|---|---|
| ChatGPT | specs, domínio/aplicação/infra de revisão, rotas e integração | contrato, autorização, estado, respostas, transporte, revisão e publicação |
| DeepSeek | content/revisao-enem; relatório de acervo | inventário completo do recorte, questões verificáveis, imagens e explicações em rascunho |
| Antigravity | components/revisao; novos testes visuais; relatório de UI | professor, projeção e aluno como componentes controlados |

Não há envio automático a ferramentas externas. Usuário entrega os prompts nas respectivas ferramentas. Nenhum agente externo faz commit/push, altera arquivos compartilhados ou modifica testes existentes. Todos trabalham no checkout atual, com pastas exclusivas; não instalar dependências ou rodar builds concorrentes. Revisão final e integração pertencem ao ChatGPT.

## Entrega de hoje e completude

Objetivo: primeiro fluxo vertical completo com questões reais verificadas, seguido da expansão do acervo. Isso não reduz o acervo solicitado: qualquer ano/aplicação não concluído permanece visível como pendência. Se a conferência de todas as questões ou a capacidade não estiver concluída, relatar com precisão e não liberar conteúdo pendente. Não garantir prazo absoluto antes das entregas e validações.

Contrato técnico e critérios: `specs/REVISAO_AO_VIVO_SPEC.md`. Plano e prompts na mesma pasta deste arquivo. As telas e inventário são os primeiros pacotes liberados; transporte/ranking têm decisão específica anterior à implementação.

## Fontes técnicas consultadas em 04/11/2026

- INEP — provas/gabaritos: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
- INEP — PPL: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/enem-ppl
- Vercel — WebSockets: https://vercel.com/docs/functions/websockets — conexões podem chegar a instâncias diferentes e precisam de estado externo e reconexão. Next.js exige integração própria; suporte na plataforma não comprova capacidade do projeto.
- Firebase — quotas: https://firebase.google.com/docs/firestore/quotas — quota gratuita compartilhada com os módulos atuais; não tratá-la como recurso ilimitado.
