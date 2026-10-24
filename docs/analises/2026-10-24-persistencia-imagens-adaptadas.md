# RN-72 — Revisão da persistência visual

## Entrega

- PNG/JPG/WebP e desenhos SVG exatos gerados pelo domínio são externalizados antes do Firestore. O SVG deve ser idêntico ao desenho do plano; arquivos SVG arbitrários são recusados.
- Upload autenticado na conta do professor; caminhos isolados por UID e SHA-256 dos bytes, deduplicados também em questões concorrentes. URLs HTTPS existentes são preservadas; recursos temporários e protocolos ativos são recusados.
- Original, resultado, oito versões de histórico e metadados permanecem juntos. Limites: 7 MB por imagem e 900 KiB por documento após a externalização.
- A aprovação é reemitida após mudar o endereço somente se a assinatura anterior era válida. Alterações pedagógicas anteriores continuam invalidando a aprovação.
- Falhas de upload/Firestore em documentos v2 geram erro explícito e preservam rascunho por conta. A leitura de nuvem vazia não apaga pendências. Quota local insuficiente informa que o rascunho não pôde ser preservado e pede manter a tela aberta; não impede um upload bem-sucedido que reduza os pixels a URLs.
- Cache permanece pendente até a confirmação da gravação remota; o fluxo legado mantém compatibilidade.

## Evidência e revisão

11 testes novos e 41 testes preexistentes dos bancos/atividades aprovados (52 em três arquivos). Lint dos quatro arquivos de persistência aprovado. Teste inicial falhou por módulo inexistente. Durante a revisão do teste novo de SVG, a fixture continha também original PNG; a expectativa foi corrigida para dois recursos únicos, mantendo as verificações de rejeição de SVG arbitrário. Nenhum teste preexistente alterado.

Revisão de qualidade: deduplicação guarda a promessa imediatamente para impedir uploads concorrentes repetidos; o rascunho não é marcado como confirmado antes do término da requisição; hash é calculado dos bytes, nunca aceito da entrada. O armazenamento não certifica conteúdo pedagógico: validação de decodificação, resolução e aprovação docente pertencem aos fluxos de imagem/revisão.

## Homologação necessária

Bucket Firebase Storage habilitado e regras `frontend/storage.rules` implantadas antes de usar novos uploads. Nenhum deploy executado nesta tarefa. Regras permitem listar/ler pela sessão somente ao proprietário; URLs com token de download funcionam como capacidade compartilhada com o aluno, sem abrir a listagem pública. A disponibilização dessas URLs deve ocorrer pelo fluxo de publicação existente. Validar sessão real, CORS do bucket e leitura no Portal em homologação. Dados de alunos não foram usados nos testes.
