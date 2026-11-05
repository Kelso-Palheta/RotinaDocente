# Revisão ao Vivo — integração aprovada para execução

O pedido “conclua” autoriza conectar o desenho já definido ao Hub e Portal. A skill brainstorming foi aplicada ao contrato existente, sem repetir aprovação de funcionalidades já autorizadas. Alternativas avaliadas: polling (leituras contínuas por aluno e latência), broker/WebSocket externo (novo serviço/plano) e SSE + Firestore existente. Escolha: SSE autenticado com Firestore Admin, sem nova dependência de aplicação nem mudança de cobrança.

## Transporte e viabilidade

A Vercel suporta streaming Node e duração de até 300s no plano Hobby. Usar conexões de até 240s, heartbeat e reconexão automática. Validar suporte das credenciais existentes e listener Firestore antes da implementação do transporte. Estado e respostas são persistidos, separados da conexão. Nenhuma variável global é autoridade de sala.

Referências: https://vercel.com/docs/functions/limitations e https://firebase.google.com/docs/firestore/pricing . Listeners implicam leituras; não prometer simultaneidade ilimitada nem custo zero universal. Provar comportamento com ensaio local isolado e duas instâncias; não realizar carga de produção. Começar com teto operacional de 100 alunos elegíveis por sala, condicionado ao ensaio, e registrar limitações do plano/rede. Não alterar plano Firebase.

## Dados e segurança

- `revisaoDocentes/{uid}/questoes/{id}`: revisão individual vinculada ao hash da fonte e ajustes docentes. Coleção nova negada aos SDKs clientes pela regra padrão; somente BFF Admin.
- `revisaoSalas/{codigo}`: proprietário, turmaIds, roster congelado de IDs opacos, fase, rodada atual, prazo e revisão monotônica.
- Subcoleções `conteudo/{rodadaId}` (questões congeladas privadas), `publicacao/estado` (apenas estado da rodada atual), `participantes/{id}` e `respostas/{rodadaId}__{id}`.
- Nenhuma resposta atualiza o documento comum da sala. Ela cria recibo imutável e atualiza somente a pontuação do próprio participante, atomicamente. Distribuição/respondentes são consultados por professor/projetor; alunos ouvem somente a publicação de fase e seu próprio recibo na reconexão. Sem transmitir cada resposta para todos os alunos.
- Professor/projetor: Firebase ID token verificado/revogado no servidor. Aluno: cookie assinado do Portal + vínculo atual + cadastro atual da turma + roster da sala. Body não escolhe sua identidade. Revalidar vínculo dentro da transação de resposta e periodicamente no stream.
- Mutações com cookie exigem Origin correspondente. Sem tokens em URL, logs ou projetor. `private, no-store` em todas as respostas autenticadas. Imagens somente da questão autorizada, sem traversal; conteúdo futuro/gabaritos antes do feedback nunca enviados ao aluno.

## Regras e interface

Fluxo e componentes controlados existentes preservados. Ranking: 1.000 pontos por acerto, zero erro/ausência, sem velocidade; posições empatadas iguais. Aluno recebe top 10 e sua própria posição; projeção recebe ranking da sala. Prazo do servidor prevalece; repetição igual recupera recibo, repetição diferente não muda resposta. Professor avança com revisão e rodada esperadas.

Hub: acesso destacado “Revisão ao Vivo” mantendo os nove módulos anteriores e sua ordem. Professor prepara/revisa/cria/reabre salas em `/revisao`; painel `/revisao/sala/[codigo]`, projeção `/revisao/projecao/[codigo]`; aluno `/aluno/revisao` com atalho no boletim. Revisão docente nunca é simulada: professor confere quatro itens e pode corrigir texto/comentários antes de aprovar. Nenhum rascunho vira elegível automaticamente. Módulo disponível a professores autenticados, sem alterar entitlements dos módulos existentes.

## Portões

Testes RED→GREEN de autorização, projeções sem vazamentos, transições, idempotência, concorrência, expiração, reconexão e UI real. Ensaio de carga exclusivamente isolado, números/ambiente publicados sem equivaler à homologação de Wi-Fi escolar. Revisão independente das regras críticas, suíte completa, lint, build, publicação e conferência do deployment exato. Acervo segue parcial; não tratar 197 registros como cobertura completa.
