# Antigravity — concluir evolução imersiva dos jogos

Repositório: `/Users/kelsopalheta/Developer/RotinaDocente`. Base esperada: `5faf18a` (confira HEAD; não reverta entregas posteriores).

Implemente o pedido do usuário integralmente segundo `specs/REVISAO_AUTONOMA_IMERSIVA_V2_SPEC.md`. Reaproveite a versão atual, sem recomeçar o módulo. Usuário prioriza economizar tokens neste chat; faça a execução e as verificações no Antigravity.

## Ordem e arquivos
1. Leia AGENTS.md, as regras pertinentes de specs/RULES.md, a spec V2 e a spec original `REVISAO_AUTONOMA_PLATAFORMA_SPEC.md`. Escreva plano/contratos e mapeie testes em TESTS_SPEC antes de código.
2. Domínio/serviço: `frontend/src/dominio/revisao-autonoma/plataforma.js`, `frontend/src/aplicacao/revisao-autonoma/RevisaoAutonomaService.js`; HTTP `frontend/src/infraestrutura/revisao-autonoma/httpServidor.js` e rota API correspondente. Acrescentar módulos separados quando necessário. Modelar eventos por fase e versões V1/V2, perguntas nas estrelas e portal, pontuação autoritativa e retomada. Não manter a equivalência atual “uma pergunta = uma fase”.
3. Interface: `frontend/src/components/revisao-autonoma/{RevisaoAutonoma,Plataforma2D}.jsx`, `api.js`; criar shell imersivo e controles compartilhados se necessário. Chave do Canvas deve mudar por fase física, não por pergunta. Não reiniciar personagem/câmera entre estrelas da mesma fase.
4. Áudio/animações: reutilizar `frontend/src/components/aula-gamificada/audiovisual/{motorAudioJogo,ProvedorAudiovisualSala,PalcoCenaJogo,catalogoCenas}` e integrar feedback compartilhado nos jogos. Auditar efetivamente as nove modalidades, professor/telão/aluno e autônomo. Som deve desbloquear por gesto e respeitar mute. Sem loops de fogos/som a cada polling. Não criar um novo AudioContext/tocador para cada estrela ou componente.
5. Testar jornada real com estrelas interativas, fase mais extensa, controles separados e multitoque, fullscreen/orientation com fallback e feedback emocional. Produzir capturas desktop/celular landscape e pequeno vídeo curto se possível; testes automatizados continuam indispensáveis.

## Escopo, segurança e preservação
- Não alterar notas, regras de avaliação, acesso de outras contas, catálogo privado ou gerar custos/usar IA do aluno. Conteúdo continua explicitamente liberado pelo professor para turmas.
- Não alterar/apagar testes existentes para aprovar. Preservar regressões da entrega e criar novas. Se um teste antigo expressar regra incompatível com V2, mantenha cobertura V1 e acrescente V2; se precisar mesmo mudar uma expectativa, pare nessa alteração e peça autorização específica, enquanto avança no restante independente.
- Não transformar nove modalidades em dez ao adicionar a evolução do modo autônomo.
- Preservar fora do commit as alterações paralelas já existentes em `frontend/src/components/revisao/{PainelAluno,PainelProfessor,PodioRevisao,TelaProjecao}.jsx` e `frontend/src/lib/auth-context.js`, além de arquivos não rastreados alheios. Não usar git add . / reset / clean / stash indiscriminados.
- A referência a “todos os jogos” cobre as nove modalidades de Aula Gamificada e a plataforma autônoma. Se a auditoria identificar ajustes necessários no Aulão/Revisão ENEM, registre separadamente e não publique alterações paralelas desses arquivos sem isolar o novo diff e validar o escopo.
- Persistência nova exige testes de idempotência/concorrência/isolamento e revisão crítica; compatibilidade de sessões anteriores é obrigatória.

## Verificação e entrega
Executar testes RED→GREEN por incremento, depois direcionados e suíte integral em cópia publicável isolada que exclua arquivos alheios. Basename da cópia deve ser RotinaDocente. Cwd frontend: `npm test -- --maxWorkers=6`, `npm run lint`, `NODE_USE_SYSTEM_CA=1 npm run build`.

Criar relatório `docs/analises/2026-11-19-plataforma-imersiva-v2-entrega.md`, com arquivos, decisões, compatibilidade V1, cenários testados, resultados reais, capturas e limitações de navegador/aparelho. Não alegar ensaio físico se foi emulação. Não mostrar dados reais de alunos ou segredos.

Usuário autorizou implementações e commit/push após validação. Publique somente quando verificações necessárias estiverem aprovadas e sem falhas conhecidas; confira deployment e URL. Caso haja bloqueio, documente precisamente e não declare a entrega completa. Entregar resumo curto e hash para revisão deste chat.
