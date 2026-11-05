# Pacote Antigravity — interface da revisão temática

Execute em `/Users/kelsopalheta/Developer/RotinaDocente`. Leia `AGENTS.md`, `frontend/AGENTS.md`, `specs/REVISAO_AO_VIVO_SPEC.md`, `specs/REVISAO_TEMATICA_SPEC.md`, `specs/TESTS_SPEC.md` e `docs/plans/2026-11-05-revisao-tematica-design.md`. Design já aprovado; implementar somente este pacote. Consulte guias locais Next quando aplicáveis.

## Objetivo

Preparação por tema específico, aula introdutória completa projetável antes das questões e seleção estritamente contextual. Usuário escolhe quantidade e tempo; após a aula, desafio ao vivo existente continua com feedback/ranking. Visual vibrante aprovado, legível no projetor e no celular.

## Seus arquivos exclusivos

Criar em `frontend/src/components/revisao/`:
- `PrepararAulaoTematico.jsx`
- `ConferirConteudoTematico.jsx`
- `BlocoAulaTematica.jsx`

Pode adaptar SOMENTE `PainelProfessor.jsx`, `TelaProjecao.jsx`, `PainelAluno.jsx` para o campo opcional `estado.aula`, mantendo o fallback legado. Criar testes novos `tests/unit/components/revisao/Tematico*.test.jsx` e relatório `docs/analises/2026-11-05-revisao-tematica-interface.md`.

Não alterar controladores `Integracao*`, transporte/hook, domínio, aplicação, infraestrutura, API, specs, catálogo real, dependências, planos, configuração ou testes existentes. DeepSeek cria conteúdo e mapeamento em paralelo; use fixtures sintéticas conforme contrato para não depender dele. Não importar acervo privado no cliente, fazer fetch/gravação/IA, commit, push ou deploy.

## Contratos e comportamento

Use EXATAMENTE as props/DTOs da seção 4 e `estado.aula` da seção 5 de `REVISAO_TEMATICA_SPEC.md`. Componente controlado: callbacks solicitam mudança, não anunciam persistência. Objetivos e texto do material de conferência chegam pelo controlador, não por import de JSON privado.

1. Trilhas organizam aulas específicas. Sem `conteudoIds`, nenhuma questão disponível. Selecionar Surrealismo disponibiliza somente os IDs vinculados; busca por palavras-chave não é a regra de vínculo. Seleção de múltiplas aulas deduplica questões. Não usar proximidade de título para sugerir questão externa.
2. Mostrar compatíveis e aptas separadamente. Rascunho compatível pode ser inspecionado, mas não selecionado. Ao trocar aulas, remover IDs incompatíveis da seleção e durações desses IDs, avisando quantos foram retirados; seleção invisível antiga não pode criar sala.
3. Quantidade inteira 1–20, seleção manual/reordenação e opção de completar com aptas do contexto. Criar exige quantidade EXATA e aulas/questões aptas. Se faltar quantidade, explicar; não repetir, inserir outro tema ou reduzir a meta silenciosamente. Ao mudar quantidade, informar o estado e pedir ajuste da seleção quando necessário.
4. Tempo padrão 10–600s inteiro; permitir exceção por questão selecionada, também inteira 10–600s. Não truncar frações. Fora dos limites bloqueia o callback; backend revalidará depois. Filtros secundários de ano/modalidade preservam questões selecionadas que continuam no contexto.
5. Conferência mostra aula inteira, objetivos, blocos, fontes e recursos; requer explicitamente `conteudo`, `imagens`, `cobertura` iguais a `true`. Sem confirmação inventada, status humano automático, edição autoral ou chamada IA neste pacote.
6. Em estado v2 `conteudo`, professor/projeção/aluno mostram o mesmo bloco atual de `estado.aula`. Navegação docente envia `voltar_conteudo`/`avancar_conteudo`; `abrir_pergunta` só no último bloco. Aluno não recebe controles docentes. Não exigir `rodada.questao` na introdução nem inventar outra questão.
7. Após introdução, componentes existentes continuam desafio/feedback/ranking. Em sala v2, rótulo da próxima rodada deve indicar que inicia a próxima pergunta/cronômetro; salas legadas preservam o fluxo anterior. Não repetir a aula entre perguntas.
8. Sem gabarito, letra correta, explicações de alternativas ou blocos futuros fabricados na introdução. Não mostrar relógio de pergunta durante aula. Estado desconectado/ocupado bloqueia comandos.
9. Usar visual vibrante atual (roxo/ciano/amarelo etc. por HEX/tema existente). Contrato global proíbe classes Tailwind violet/indigo/purple/fuchsia/pink; não ressuscitar classes proibidas. Preservar contraste, teclado/foco, estados legíveis, texto completo e movimento reduzido. Conteúdo extenso precisa de paginação/blocos, não fonte minúscula.

## TDD e validação

Testes NOVOS primeiro, RED→GREEN; testes existentes intocados. Cobrir troca de contexto, deduplicação, rascunho, insuficiência, contagem exata, tempos, bloqueios, acessibilidade, avanço/retorno, último bloco e fallback legado. Fixtures sem dados reais.

A partir de `frontend/`:

```sh
npx vitest run ../tests/unit/components/revisao/TematicoPreparacao.test.jsx ../tests/unit/components/revisao/TematicoConferencia.test.jsx ../tests/unit/components/revisao/TematicoApresentacao.test.jsx --maxWorkers=2
npx vitest run ../tests/unit/components/revisao ../tests/unit/paleta_petroleo_salvia.test.js --maxWorkers=2
npx eslint src/components/revisao/PrepararAulaoTematico.jsx src/components/revisao/ConferirConteudoTematico.jsx src/components/revisao/BlocoAulaTematica.jsx src/components/revisao/PainelProfessor.jsx src/components/revisao/TelaProjecao.jsx src/components/revisao/PainelAluno.jsx
```

Verificar telas 360/1440/1920px com título/texto longo, imagem, alternativa e nomes. Não criar rota pública com fixtures nem adicionar bypass de autenticação para preview. Se navegador autenticado não estiver disponível, declarar limite e fornecer testes de componentes; não alegar teste visual que não fez.

Entregar componentes, testes novos e relatório (arquivos, RED/GREEN, verificações, limites), sem commit/push. Não devolver ao usuário outra decisão de arquitetura já definida; problemas de contrato vão para a coordenação antes de alterar campos.
