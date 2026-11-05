# Revisão independente — acervo e interfaces do aulão

Data: 04/11/2026. Base: ca5ad8d. Revisão feita no checkout atual, antes de integrar salas reais.

## Resultado

As duas entregas fornecem uma base aproveitável, mas não concluíram o módulo. Problemas confirmados de apresentação e inventário foram corrigidos neste chat. Nenhuma rota de sala, autenticação nova, transporte ou publicação de questões foi implementada nesta revisão. O build continua com as 37 rotas preexistentes; nenhum botão de aulão funcional foi anunciado aos usuários.

Acervo: 16 questões únicas, 13 imagens, 51 entradas de ano/aplicação. Todas as questões continuam em rascunho, com explicações pendentes de revisão; zero elegíveis para uso em sala. Completude de 2009–2025 ainda não atendida. Interface: três componentes controlados, ainda sem backend. Não há evidência de capacidade simultânea, conexão escolar ou recuperação de sessão real.

## Achados e correções

| Achado | Causa comprovada | Correção |
|---|---|---|
| Figuras por `arquivo` desapareciam | Renderer só entrava no ramo de imagem com `tipo` ou `url` | Aceitar registro do contrato, preservar alt e limitar largura |
| Figura do conteúdo com `imagemId` não resolvida | Renderer buscava URL no bloco, sem consultar imagens da questão | Resolver referência explicitamente; imagem ausente gera aviso |
| Timer prolongava prazo com callbacks atrasados | Subtraía um segundo por callback, sem medir tempo decorrido | Hook compartilhado com relógio monotônico, ancorado no servidor |
| Nova sincronização após zero não retomava contagem | Intervalo era cancelado no zero e não recriado ao mudar apenas hora do servidor | Store de relógio substituído por sincronização/contexto; cleanup em StrictMode |
| Conexão ausente autorizava ações | Fallback era `conectado` | Fallback `conectando`, com ações bloqueadas |
| Feedback inventava bônus | String fixa `+1000 pts` na interface | Mostrar acerto sem inventar pontuação |
| Leitor de tela não recebia encerramento | Único texto de expiração estava em `aria-hidden` | Aviso estático `role=status`, sem anunciar cada segundo |
| Reaplicação/PPL excluída do filtro de reaplicação | Ausência de caderno próprio tratada como modalidade não aplicável | Referência compartilhada e dois rótulos, mantendo IDs únicos |
| Inventário histórico de Arte apontava dia incorreto | Primeiro dia usado genericamente para anos anteriores a 2017 | Referências de Linguagens do segundo dia, a partir de links oficiais |
| Teste impedia numeração antiga acima de 90 | Limite fixo incompatível com numeração impressa | Usuário autorizou exclusivamente `90 → 180`; demais verificações intactas |

Todos os testes externos foram preservados byte a byte, exceto a substituição literal autorizada acima. A comparação reversa desse único literal recupera o SHA-256 original do teste. Nenhuma expectativa de UI foi removida ou enfraquecida.

## Evidência de testes

- Entregas originais: execução própria de 30/30 nos quatro arquivos novos.
- Regressões próprias iniciais: 13 falhas e 1 aprovação antes das correções, cobrindo imagens, relógio, conexão, bônus e fontes.
- Regressão de acessibilidade adicional: RED com 1 falha e 12 aprovações no arquivo de UI; implementação ajustada e GREEN posterior.
- Suíte final após a exceção autorizada: **1.221 testes, 265 arquivos, todos aprovados**, exit 0. Inclui os 1.176 testes anteriores, 30 recebidos e 15 complementares.
- ESLint dos componentes: exit 0, sem erros/avisos.
- Build de produção: exit 0; nenhuma rota nova. A exceção de numeração alterou somente um teste após o build, sem código de produção posterior.
- `git diff --check`: aprovado antes de publicar.

Logs resumidos em `docs/evidencias/2026-11-04-revisao-entregas/`. Testes de contrato conferem estrutura/coerência, não validam automaticamente a interpretação pedagógica nem o conteúdo de documentos remotos.

## Conferência visual independente

Renderizei os componentes reais com React/Vite/Tailwind em harness temporário fora do repositório, sem criar página pública. Navegador controlado pelo CUA, dados sintéticos e uma figura do acervo:

- Celular: iframe com viewport efetivo de 360px, documento de 360px, imagem carregada e alternativas com quebra de linha.
- Professor: viewport de 1440px, documento de 1440px, 550 respondentes sintéticos, contagens e lista com espaço limitado.
- Projeção: viewport de 1920px, documento de 1920px, imagem e contagens carregadas. Conteúdo extenso pode exigir rolagem vertical; não foi demonstrada apresentação de toda questão longa em uma única tela sem rolagem. Esse refinamento permanece para a integração/apresentação.

As capturas recebidas do Antigravity são evidência histórica da entrega dele; a captura mobile recebida estava cortada horizontalmente e não bastava para aprovar responsividade. As capturas próprias posteriores estão na pasta de evidências. O harness com 550 nomes NÃO é teste de 550 conexões simultâneas.

## Fontes conferidas

Foram consultadas páginas oficiais INEP de 2009–2024 e verificados os links publicados para corrigir o inventário. Não foi alegada releitura independente integral de todas as provas/imagens/80 explicações. Referências:

- https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2024 — seção Reaplicação/PPL identifica a fonte compartilhada.
- https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2009 — cadernos e gabaritos por dia.
- https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2016 — cadernos do segundo dia e aplicações adicionais.

## Próximas execuções

1. ChatGPT: ensaio técnico de infraestrutura/limites, domínio e autorização; integrar respostas persistidas e reconexão somente após decisão do transporte, sem ativar cobrança automaticamente.
2. DeepSeek: continuar o acervo, preencher lacunas e revisar fontes; manter revisão docente pendente e não marcar conclusão por quantidade de arquivos.
3. Antigravity: formulário controlado de preparação do aulão e conferência docente de questões, conforme prompt de continuação. Não criar rotas nem trocar contrato de outros agentes.

Os novos prompts estão em `docs/plans/2026-11-04-prompt-deepseek-revisao-continuacao.md` e `2026-11-04-prompt-antigravity-revisao-preparacao.md`. A publicação desta base não declara o módulo operacional, o acervo completo ou uma lotação máxima homologada.
