# Revisão temática — contrato de extensão v2

Data: 05/11/2026. Status: implementação integrada; material pedagógico em rascunho para conferência docente. Complementa `REVISAO_AO_VIVO_SPEC.md`; não altera os contratos legados sem `schemaVersion: 2`.

## 1. Organização e cobertura

- RT-01: separar trilhas amplas de aulas/conteúdos específicos. O aluno revisa o conteúdo escolhido pelo professor.
- RT-02: vínculo aula/questão explícito e justificado por objetivos de aprendizagem, usando IDs estáveis. Não filtrar por substring de título como autoridade pedagógica.
- RT-03: todo ID atual de questão aparece exatamente uma vez no mapa, com vínculo(s) ou pendência/exclusão justificada. O mesmo ID pode estar associado a várias aulas somente quando cada vínculo realmente cobre os conhecimentos necessários; seleção múltipla deduplica por ID.
- RT-04: somente questões vinculadas a pelo menos uma aula selecionada e com cobertura comprovada podem aparecer no catálogo contextual e ser selecionadas. Relação transversal vaga não basta. Nenhum conteúdo selecionado significa nenhuma questão disponível.
- RT-05: a lista contextual pode mostrar rascunhos compatíveis para inspeção, claramente bloqueados para seleção; contador separa compatíveis e aptas. Não apresentar questão de outro conteúdo nem como substituição quando faltarem aptas.
- RT-06: trocar aula(s) retira questões incompatíveis da seleção, informa o resultado e revalida quantidade. Filtros secundários preservam seleções compatíveis. Não alterar a propriedade legada de filtros dos componentes atuais.

## 2. Contrato privado de dados — DeepSeek

Novos caminhos:

- `content/revisao-enem/aulas/catalogo.json`
- `content/revisao-enem/aulas/vinculos.json`
- `content/revisao-enem/aulas/conteudos/<conteudoId>.json`
- `content/revisao-enem/aulas/imagens/<nome-seguro>.(png|jpg|webp)`

`catalogo.json`:

```json
{"schemaVersion":1,"trilhas":[{"id":"historia-arte","titulo":"História da Arte"}],"conteudos":[{"id":"surrealismo","trilhaId":"historia-arte","titulo":"Surrealismo","resumo":"Descrição objetiva do que será ensinado.","objetivos":[{"id":"sonho-inconsciente","descricao":"Explicar o papel do sonho e do inconsciente nas propostas surrealistas."}]}]}
```

`vinculos.json`:

```json
{"schemaVersion":1,"questoes":[{"questaoId":"ID_EXISTENTE","situacao":"vinculada","vinculos":[{"conteudoId":"surrealismo","objetivoIds":["sonho-inconsciente"],"justificativa":"Explicação específica da cobertura da questão pela aula."}],"observacao":""}]}
```

Situações: `vinculada`, `pendente`, `fora_escopo`. As duas últimas exigem observação específica e `vinculos: []`. Nenhum ID inventado. Identificadores e referências devem resolver nos arquivos reais. Objetivos vinculados devem constar da aula e ser ensinados nos blocos, não apenas mencionados na lista.

Arquivo de aula:

```json
{"schemaVersion":1,"id":"surrealismo","titulo":"Surrealismo","duracaoEstimadaMinutos":15,"objetivos":[{"id":"sonho-inconsciente","descricao":"Explicar sonho e inconsciente no Surrealismo."}],"blocos":[{"id":"contexto","titulo":"Contexto histórico","tipo":"texto","texto":"Texto original desenvolvido.","objetivoIds":["sonho-inconsciente"]},{"id":"comparacao","titulo":"Aprender a observar","tipo":"imagem","imagemId":"exemplo-contextual","texto":"Leitura guiada original da imagem.","objetivoIds":["sonho-inconsciente"]}],"imagens":[{"id":"exemplo-contextual","arquivo":"aulas/imagens/exemplo.png","alt":"Descrição significativa.","legenda":"Autor, título e data conferidos.","fonteUrl":"https://FONTE_PRIMARIA/obra","licenca":"Condição de uso verificada."}],"fontes":[{"titulo":"Título real","url":"https://FONTE_PRIMARIA/pagina","consultadoEm":"2026-11-05"}],"status":"rascunho"}
```

O exemplo define formato, não conteúdo pronto nem fonte válida. `tipo` admite `texto` e `imagem`; imagem deve existir e ter referência completa. Aula sem imagens somente quando pedagogicamente suficiente, documentando a escolha. Fontes reais e prioritariamente primárias (museus, instituições culturais/educacionais e documentos oficiais); não inventar links, atribuições, datas, licença ou fatos. Não copiar capítulos, provas ou comentários como texto autoral. Não mudar imagens/JSON das questões existentes.

## 3. Qualidade pedagógica

- RT-07: introdução desenvolvida: objetivos, contexto, conceitos, exemplos comentados, comparações pertinentes, equívocos comuns, estratégias de leitura e síntese. Linguagem Ensino Médio; sem estereótipos e sem tratar culturas indígenas/afro-brasileiras como homogêneas.
- RT-08: normalmente 6–12 blocos e 10–20 minutos estimados por aula específica; qualidade e cobertura prevalecem sobre contagem/tamanho. Cada bloco deve caber em uma tela ou ser dividido sem reduzir legibilidade.
- RT-09: introdução não contém gabarito, letra correta, resolução disfarçada nem cópia da justificativa da questão. Ensino de conceitos necessários é desejado; antecipação literal da resposta não.
- RT-10: imagens contribuem para a explicação; não são decoração nem recortes de questões reutilizados indiscriminadamente. Usar exemplos diferentes das perguntas sempre que possível; mostrar imagens da pergunta somente na fase própria. Crédito, legibilidade projetada e alternativa textual obrigatórios.
- RT-11: revisão técnica do agente não equivale à conferência docente. Aula e questões continuam em rascunho até a aprovação real do professor no sistema.

## 4. Preparação controlada — Antigravity

Novo `PrepararAulaoTematico` recebe `{trilhas,conteudos,questoes,selecao,ocupado,erro,onAlterar,onCriar,onAbrirConteudo,onAbrirRevisao}`.

Metadados de conteúdo: `{id,trilhaId,titulo,resumo,duracaoEstimadaMinutos,hashFonte,apta}`. Metadados de questão existentes mais `conteudoIds: string[]`; sem corpo/gabarito. O backend entrega somente IDs de aulas com vínculo válido. `selecao` mantém campos legados e acrescenta:

```json
{"conteudoIds":[],"quantidadeQuestoes":5,"duracaoPorQuestao":{}}
```

Quantidade inteira 1–20; duração padrão inteira 10–600s; exceções por ID também inteiras 10–600s, somente IDs selecionados. A seleção deve ter exatamente a quantidade definida para criar. Mostrar contadores, opção de completar seleção com questões aptas do contexto, seleção manual e reordenação. Sugestão não altera dados persistidos nem escolhe itens fora do contexto; não prometer sorteio criptográfico ou dificuldade calibrada. Se faltarem questões, explicar sem truncar a quantidade silenciosamente.

Novo `ConferirConteudoTematico` recebe `{conteudo,confirmacoes,ocupado,erro,onConfirmacoesChange,onAprovar,onVoltar}`. Confirmações: `conteudo`, `imagens`, `cobertura`, todas explicitamente `true`; mostrar texto, objetivos, recursos e fontes reais. Componente controlado, sem fetch/gravação/IA. Integração posterior envia hash ao servidor. Alteração autoral de aulas pelo usuário não entra neste pacote inicial; conferência libera ou recusa a versão existente.

## 5. Aula ao vivo e DTO

Novos estados opcionais, apenas para sala v2:

```json
{"aula":{"conteudoId":"surrealismo","tituloConteudo":"Surrealismo","indiceBloco":0,"totalBlocos":8,"ultimoBloco":false,"bloco":{"id":"contexto","titulo":"Contexto histórico","tipo":"texto","texto":"Texto atual autorizado.","imagens":[]}}}
```

Índice e total referem-se à sequência global de blocos de todas as aulas escolhidas. `conteudoId` e título identificam a aula do bloco atual. Em `conteudo`, `rodada.questao` é `null`, `feedback` é `null`, sem lista de blocos futuros ou perguntas futuras. A API resolve a imagem atual para URL privada autorizada; não expor caminhos locais.

Comandos existentes continuam; acrescentar `avancar_conteudo`, `voltar_conteudo`, com a mesma revisão/rodada esperadas. `mostrar_conteudo` inicia a introdução; `abrir_pergunta` só é válido no último bloco. O professor escolhe quando avançar, sem cronômetro obrigatório para aula. Controles informam progresso e impedem pular toda a introdução por engano.

Após a primeira pergunta, `proxima_rodada` em sala v2 abre diretamente a próxima pergunta e inicia seu prazo individual. Rótulo deve indicar essa consequência. Não reapresentar aula por pergunta. Salas legadas preservam ranking → conteúdo → pergunta. Feedback A–E, distribuição, respondentes, pontuação e empates ficam intactos.

Novo `BlocoAulaTematica` renderiza texto/imagem de forma acessível e contextual. Painel docente apresenta navegação de blocos; projeção e aluno acompanham o mesmo bloco, sem botões de controle docente para aluno. Reutilizar componentes atuais fora da introdução, mantendo fallback legado. Tipografia legível, visual vibrante aprovado, movimento reduzido, sem classes das antigas marcas proibidas pelo contrato global.

## 6. Servidor/persistência — ChatGPT

- Ler acervo temático exclusivamente no servidor, validar schema/paths/MIME e hash incluindo imagens e o subconjunto de vínculos/objetivos daquela aula; mudar sua cobertura também invalida a conferência anterior. Catálogo autenticado, corpos/recursos autorizados e `private, no-store`.
- Aprovação docente em `revisaoDocentes/{uid}/aulas/{conteudoId}` vinculada a UID/hash e três confirmações estritas. Conferência de questões existente não é enfraquecida.
- Novos endpoints privados `/conteudos/{id}`, `/conteudos/{id}/aprovar`, `/conteudos/{id}/imagens/{imagemId}`; catálogo existente acrescenta `trilhas`/`conteudos` e contexto de questões. Imagens de aula em sala exigem proprietário/matrícula/roster atuais, fase/bloco atual e fonte congelada correspondente. Não criar proxy remoto arbitrário.
- Criação v2 valida conteúdos aprovados, mapa vigente/hash, IDs existentes, compatibilidade de TODAS as questões, quantidade exata, duração individual e limites. Rejeitar payload adulterado mesmo que o navegador o aceite.
- Congelar aulas, vínculos/versões relevantes, sequência e tempos; respeitar limite de documento/transação Firestore e rejeitar pacote excessivo antes de gravar. Não mutar salas antigas nem confiar em classificação enviada pelo cliente.
- CAS e estado público bloqueiam callback/comando antigo; troca de bloco não muda matrícula ou recibos. Prazo de resposta passa a usar a duração congelada da rodada v2.
- Nenhuma IA, serviço novo, mudança de plano, notas ou permissão durante execução. Preservar `NODE_OPTIONS` Vercel já ajustado, autenticação e limites do piloto.

## 7. Aceite

RT-T01 cobertura explícita e integridade de todos os IDs; RT-T02 aula completa e fontes/recursos; RT-T03 contexto de tema filtra rigorosamente; RT-T04 troca de contexto remove incompatíveis com aviso; RT-T05 quantidade exata e insuficiência; RT-T06 duração individual/prazo; RT-T07 servidor rejeita adulteração e hash desatualizado; RT-T08 introdução completa antes das perguntas sem vazamento; RT-T09 sincronização/retomada de bloco e CAS; RT-T10 sala legada, Portal/Diário/notas e testes anteriores preservados; RT-T11 pacotes privados e imagens confinadas; RT-T12 conferência humana/rascunho e aprovação por conta/versão.

## 8. Comentário para a próxima versão — RV-FUT-01

A pedido do usuário em 05/11/2026, pontuação por tempo de resposta fica adiada. Não faz parte desta implementação. Avaliar futuramente bônus por velocidade com tempo do servidor e idempotência, priorizando quantidade de acertos e usando velocidade como desempate; fórmula e critérios finais ainda precisam de validação. Registro em `TASKS.md`, seção “Revisão ao Vivo: bônus por tempo adiado”. Até lá, continuam 1.000 pontos por acerto e nenhum bônus por tempo.

## 9. Integração e revisão — 05/11/2026

Implementação v2 acrescenta pódio acumulado das posições 1–3 depois do feedback, mantendo empates e ranking completo. Novas salas exigem modo temático no servidor; metadados adulterados não autorizam perguntas externas. A conferência mostra assuntos vinculados, sem dispensar revisão de cada pergunta. Dois vínculos recebidos foram colocados em pendência por cobertura insuficiente; relatório: `docs/analises/2026-11-05-revisao-integracao-tematica.md`. O restante permanece proposta editorial em rascunho, não homologação humana.
