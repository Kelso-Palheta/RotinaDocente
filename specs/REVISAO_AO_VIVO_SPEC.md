# Revisão ao Vivo — contrato v1

Data: 04/11/2026. Escopo solicitado: aulão gamificado de Arte para ENEM, com login, conteúdo antes das perguntas, projeção, participação em tempo real e explicação de todas as alternativas. Acervo inicial: regular, PPL e reaplicações, 2009–2025. A completude do acervo e a capacidade simultânea precisam de evidência, não são resultados já obtidos.

## 1. Produto e limites

- Módulo independente; reutiliza as identidades existentes do professor e aluno. Não altera notas, recuperação, Diário ou atividades existentes.
- Professor seleciona questões revisadas, organiza conteúdo e abre sala para uma ou mais de suas turmas. Aluno entra com sessão do Portal e código da sala; código sozinho não autoriza acesso.
- Fluxo: espera → conteúdo → pergunta com tempo → encerramento → feedback → ranking → próximo conteúdo/pergunta ou encerramento da sala.
- Professor controla o avanço. Pode encerrar a pergunta antes do prazo. No prazo, servidor deixa de aceitar respostas, mesmo se a projeção desconectar.
- Projeção mostra quem respondeu, total de respostas e distribuição A–E durante a pergunta. Não associa nome à alternativa nem revela acerto antes do feedback.
- Feedback mostra gabarito e explica A, B, C, D e E, com imagens e contexto. Preparação e revisão ocorrem antes do aulão; nenhuma chamada de IA durante a rodada.
- Primeira regra de pontuação proposta: 1.000 pontos por acerto, zero por erro/ausência, sem bônus por velocidade. Empates compartilham posição. Revisar explicitamente esta proposta antes da implementação do ranking.
- Aluno pode enviar uma resposta por rodada. Recebimento confirmado é diferente de resposta pendente no aparelho. Falha permite repetir o mesmo envio, sem duplicar pontuação.
- Não prometer operação offline plena: resposta que só chega após o prazo não é aceita retroativamente.

## 2. Arquitetura e responsabilidade

Usar camadas novas em `frontend/src/dominio/revisao/`, `aplicacao/revisao/`, `infraestrutura/revisao/` e componentes em `components/revisao/`. Adaptadores de rota ficarão em `app/api/revisao/` e páginas em `app/revisao/`, sem refatorar módulos existentes.

Professor: validar Firebase ID token no servidor. Aluno: reutilizar `lib/aluno/session.js` e revalidar vínculo vigente no servidor; o cookie discente não é uma identidade Firebase Auth. Projeção exige autorização docente; evitar página pública que exponha nomes.

Estado durável fica fora da memória da função. Não usar variável global, localStorage ou um único processo como autoridade de sala. Separar:
1. Estado da sessão e rodadas, com revisão monotônica.
2. Resposta imutável por participante/rodada, com confirmação persistida.
3. Distribuição e lista de respondentes para professor/projeção.
4. Entrega aos alunos somente de estado comum e confirmação individual.

O transporte é um adaptador. A seleção de WebSocket/broker e armazenamento operacional é responsabilidade do ChatGPT após ensaio de viabilidade no deploy atual. Não instalar dependência, contratar serviço, ativar Blaze nem anunciar escala antes desse ensaio. HTTP com polling pode servir ao protótipo, mas não comprova capacidade do transporte final. A integração fica bloqueada se não houver opção operacional validada no plano autorizado; telas e acervo continuam independentes.

## 3. Acervo — DeepSeek

Pastas exclusivas: `content/revisao-enem/` e `docs/analises/2026-11-04-acervo-arte-enem.md`. Conteúdo não fica em `public/`, nem é importado por componente cliente: inclui gabaritos.

### Registro de questão (`questoes/<id>.json`)

```json
{
  "schemaVersion": 1,
  "id": "enem-2024-regular-arte-exemplo",
  "ano": 2024,
  "aplicacoes": ["regular"],
  "tema": "Exemplo de tema; não é uma questão real",
  "habilidades": [],
  "enunciado": "Somente transcrição conferida na prova oficial.",
  "imagens": [],
  "alternativas": [
    { "id": "A", "texto": "Alternativa A" },
    { "id": "B", "texto": "Alternativa B" },
    { "id": "C", "texto": "Alternativa C" },
    { "id": "D", "texto": "Alternativa D" },
    { "id": "E", "texto": "Alternativa E" }
  ],
  "gabarito": "A",
  "explicacoes": { "A": "", "B": "", "C": "", "D": "", "E": "" },
  "conteudoRevisao": [],
  "fontes": [],
  "status": "rascunho",
  "revisao": { "transcricao": false, "gabarito": false, "imagens": false, "explicacoes": false }
}
```

Este exemplo NÃO entra no acervo real. Valores de aplicação: `regular`, `ppl`, `reaplicacao`. Uma questão compartilhada entre aplicações aparece uma vez com múltiplas referências. IDs independem da cor do caderno e não mudam após catalogação.

Cada fonte tem `aplicacao`, `caderno`, `numeroQuestao`, `pagina`, `provaUrl`, `gabaritoUrl` e `consultadoEm` (YYYY-MM-DD). URLs devem apontar a documentos oficiais, não resultados de busca. Registrar número impresso e página do PDF separadamente.

Cada imagem tem `id`, `arquivo`, `alt`, `fonteUrl`, `pagina`, `revisada`; caminho relativo ao acervo, sem traversal. Preservar obra original e legenda; não recriar com IA. Obra ilegível ou faltante impede revisão final. Blocos de conteúdo: `{tipo: 'texto', texto}` ou `{tipo: 'imagem', imagemId, legenda}`.

`fontes.json` cobre cada ano/aplicação: `ano`, `aplicacao`, `status` (`pendente`, `localizada`, `catalogada`, `conferida`, `nao_localizada`, `nao_aplicavel`), URLs, IDs de questões e observações. Não preencher lacunas com provas inventadas. `nao_aplicavel` exige justificativa documental.

Somente status `revisada` e quatro verificações verdadeiras permitem uso em sala; isso não dispensa conferência independente da entrega. Explicações produzidas por IA são rascunhos. Não alegar que INEP forneceu explicações autorais. Não inferir gabarito pelo modelo.

## 4. Contrato visual — Antigravity

Criar somente componentes controlados, sem fetch, autenticação, armazenamento, WebSocket ou acesso ao acervo privado. React/JSX com imports por `@/`. Não criar páginas navegáveis ou incluir o módulo no Hub nesta entrega.

Exports nomeados, arquivos em `frontend/src/components/revisao/`:
- `PainelProfessor.jsx`: `PainelProfessor({estado, ocupado, erro, onAcao})`.
- `TelaProjecao.jsx`: `TelaProjecao({estado})`.
- `PainelAluno.jsx`: `PainelAluno({estado, envio, ocupado, erro, onResponder, onTentarNovamente})`.

`estado` é uma projeção autorizada, não o documento persistido:
```json
{
  "sala": { "id": "sala-demo", "titulo": "Revisão de Arte", "codigo": "ARTE42", "revisao": 1 },
  "fase": "pergunta",
  "conexao": "conectado",
  "agoraServidorMs": 1793808000000,
  "rodada": {
    "id": "r1", "numero": 1, "total": 10,
    "encerraEmMs": 1793808060000,
    "questao": {
      "id": "q-demo", "ano": 2024, "aplicacoes": ["regular"],
      "tema": "Exemplo sintético", "enunciado": "Pergunta sintética",
      "imagens": [],
      "alternativas": [
        {"id":"A","texto":"A"}, {"id":"B","texto":"B"},
        {"id":"C","texto":"C"}, {"id":"D","texto":"D"}, {"id":"E","texto":"E"}
      ]
    },
    "conteudo": []
  },
  "participacao": {
    "total": 30, "respondidos": 2,
    "respondentes": [{"id":"p1","nomeExibicao":"Ana"}, {"id":"p2","nomeExibicao":"Bruno"}],
    "distribuicao": {"A":1,"B":0,"C":1,"D":0,"E":0}
  },
  "feedback": null,
  "ranking": []
}
```

Fases: `espera`, `conteudo`, `pergunta`, `encerrada`, `feedback`, `ranking`, `finalizada`. Conexão: `conectando`, `conectado`, `reconectando`, `desconectado`.

Em `feedback`, feedback tem `{gabarito, explicacoes: {A,B,C,D,E}}`. Em `ranking`/`finalizada`, ranking contém `{participanteId, nomeExibicao, pontos, posicao}`. Nenhum gabarito/explicação/ranking antecipado é enviado aos alunos. `participacao` pode ser `null` no estado discente. Componentes devem suportar campos opcionais sem fabricar resultados.

`envio`: `{status: 'nao_enviado'|'enviando'|'confirmado'|'falha', alternativa: null|'A'|'B'|'C'|'D'|'E'}`. `onResponder('A')` solicita envio, não confirma recebimento. Desabilitar nova resposta em `enviando` ou `confirmado`, fora da fase pergunta, após prazo ou sem conexão. Retry explicitamente preserva alternativa original; nunca afirmar sucesso sem `confirmado` recebido do controlador.

`onAcao` recebe um de `mostrar_conteudo`, `abrir_pergunta`, `encerrar_pergunta`, `mostrar_feedback`, `mostrar_ranking`, `proxima_rodada`, `finalizar`. Renderizar somente ações válidas por fase e bloquear quando ocupado/desconectado. Controlador e servidor continuam obrigados a validar, independentemente dos botões.

Cronômetro visual usa diferença de `encerraEmMs` e relógio monotônico local ancorado em `agoraServidorMs`, resincronizado na chegada de estado. Chegar a zero desabilita envio e mostra encerramento; não chama uma ação docente automaticamente nem decide aceitação. Intervalos limpos no unmount, incluindo StrictMode.

Paleta petróleo/sálvia existente; estados não dependem apenas de cor. Celular 360px, professor 1440px e projeção 1920px. Teclado, foco visível, alternativa com rótulo completo, erro `role=alert`, confirmação `role=status`. Nomes longos não expandem a tela. Listas extensas têm espaço limitado e rolagem própria; gráficos exibem valores numericamente.

## 5. Regras críticas — ChatGPT

### Preparação e conferência docente (segunda execução visual)

Componentes controlados adicionais: `PrepararAulao` e `RevisarQuestao`, com contrato detalhado no prompt `docs/plans/2026-11-04-prompt-antigravity-revisao-preparacao.md`. Preparação mantém seleção ordenada de questões aptas, turmas, título e duração inteira 10–600s; filtros não perdem seleção. Conferência mostra material e fontes completos, exige quatro confirmações explícitas antes do callback de aprovação e não grava status sozinha. Nunca importar acervo privado por componente cliente; material docente só chega após autorização no servidor. IDs inexistentes/inaptos, referências de imagem ausentes ou estrutura incompleta impedem os respectivos callbacks de criar/aprovar. Controlador e servidor revalidam tudo. Duração/título são limites iniciais de contrato, sem alteração de notas.

- Validar ID, turma, sala e propriedade a cada operação; revogação do vínculo impede responder. Separar conta docente, identidade discente e participante da sala.
- Payload de aluno não escolhe professor/aluno para autorizar a si mesmo. Sessão e vínculos definem identidade. Proteção de origem nas mutações com cookie; código de sala não substitui autenticação.
- Rodada tem ID único, prazo no servidor e revisão. Comando antigo não avança outra rodada; resposta de contexto anterior não afeta a atual. Trocar sala/unmount invalida assinaturas e requisições pendentes.
- Resposta transacional/idempotente por sala+rodada+participante. Repetição idêntica retorna o mesmo recibo; tentativa de trocar alternativa após confirmação é recusada. Contagem e pontos não duplicam.
- Revalidar prazo na operação persistente. Horário do dispositivo e clique antes do prazo não garantem aceitação se o servidor recebeu depois.
- Preservar respostas aceitas em reconexão e reinício de função. Falha nunca é anunciada como sincronização concluída.
- Gabarito e conteúdo de rodadas futuras ficam no servidor. Cache de resposta autenticada é privado/no-store; bundle não inclui acervo privado.
- Evitar documento compartilhado atualizado por todos os alunos a cada clique. Medir contenção, distribuição e custo; não aceitar um desenho que produza fanout quadrático.
- Login/IDs/data de nascimento/tokens não aparecem no projetor ou logs. Projeção mostra apenas nome de exibição e participação solicitados.

## 6. Testes de aceite (RV)

| ID | Evidência necessária | Dono |
|---|---|---|
| RV-01 | Regular/PPL/reaplicação identificadas por fonte; duplicatas e lacunas explícitas | DeepSeek |
| RV-02 | Enunciado, A–E, gabarito e imagens conferíveis; rascunho não é elegível | DeepSeek + revisão ChatGPT |
| RV-03 | Conteúdo → pergunta → encerramento → feedback A–E → ranking | Antigravity + integração ChatGPT |
| RV-04 | Projeção mostra respondentes e contagens; nomes não vinculados à alternativa | Antigravity |
| RV-05 | Enviando ≠ confirmado; retry, desconexão, prazo e teclado | Antigravity |
| RV-06 | Sem sessão/vínculo/propriedade: negar; não vazar questão futura ou gabarito | ChatGPT |
| RV-07 | Resposta simultânea/repetida pontua uma vez; prazo do servidor prevalece | ChatGPT |
| RV-08 | Reconexão/reinício retoma sala e recibo; estado antigo/unmount descartados | ChatGPT |
| RV-09 | Capacidade medida progressivamente; sem perda/duplicação; latência e custo reportados | ChatGPT |
| RV-10 | Telas 360/1440/1920px legíveis, sem transbordamento nem perda de controles | Antigravity + revisão ChatGPT |
| RV-11 | Diário, notas, recuperação, login e nove módulos preservados; suíte completa aprovada | ChatGPT |

Capacidade: cenários progressivos 50, 100, 200, 500 e superiores somente enquanto critérios passam. Incluir rajada de respostas no fim, reconexão em massa, pelo menos duas instâncias e duração de aula. Metas propostas: p95 de confirmação ≤2s, projeção atualizada ≤2s, zero perda de resposta confirmada e zero duplicação; publicar número seguro com margem, ambiente, duração e limitações. Teste local não equivale a homologação em produção ou Wi-Fi escolar. Nenhuma carga de produção nesta fase.

## 7. Portões de entrega

Complemento RV-REV-02: preparação rejeita IDs de turma inexistentes, duplicatas de turma/questão, `apta` diferente de booleano true e duração fracionária sem arredondar silenciosamente. Conferência exige ID/enunciado preenchidos, fontes HTTPS oficiais sem credenciais/porta alternativa e ambas as referências prova/gabarito; confirmação deve ser booleano true. Bloco de imagem exige referência resolvível. Links inválidos não são apresentados como oficiais. Aplicação regional D3 de 2025 em Belém/Ananindeua/Marituba pertence a regular com edição regional identificada; não é reaplicação D5. IDs existentes são opacos e permanecem estáveis apesar da correção de metadados.

Complemento de revisão (RV-REV-01): imagens podem chegar como registro `{id, arquivo, alt}` e blocos de conteúdo como `{tipo:'imagem', imagemId, legenda}`; resolver a referência pela coleção de imagens da questão sem inventar URL. Cronômetro usa tempo monotônico decorrido, não número de callbacks, e nova sincronização reinicia a medição mesmo após zero. Estado de conexão ausente bloqueia ações. Interface não inventa bônus/pontos no feedback. Aplicações que compartilham uma prova aparecem em ambos os filtros sem duplicar questão; ausência de caderno separado não significa modalidade não aplicável. Provas de Linguagens anteriores a 2017 são do segundo dia; inventário de Arte não deve apresentar o primeiro dia como fonte suficiente.

1. Interface controlada e inventário podem avançar paralelamente com este contrato; mudanças no contrato retornam à coordenação.
2. Transporte, pontuação e integração passam por decisão registrada antes do respectivo código.
3. Testes novos RED → GREEN; não editar/apagar testes existentes para passar. Agentes entregam sem commit/push/deploy, deixando diff e relatório para revisão.
4. Integração só publica após revisão própria, suíte, lint das alterações, build e ensaio ponta a ponta. Não declarar acervo completo nem capacidade sem relatório correspondente.

## 8. Integração autorizada — 05/11/2026

Executar `docs/plans/2026-11-05-revisao-integracao-design.md` e plano correspondente. SSE autenticado sobre Firestore Admin é a escolha para o deploy atual, com conexões renováveis de 240s e `maxDuration=300`. Respostas não escrevem estado comum e não geram fanout para todos os alunos. Revisões docentes isoladas por UID e hash da fonte em coleção nova exclusiva do servidor. Comandos incluem revisão/rodada esperadas; transações revalidam vínculo/prazo e tornam recibo/pontos idempotentes. Acerto vale 1.000 pontos, sem bônus de velocidade, empates com mesma posição. Teto inicial proposto: 100 alunos elegíveis, sujeito ao ensaio isolado e relatório, sem alegação de homologação em produção/rede escolar. Ranking discente limitado a top 10 e sua posição.

Entradas reais: `/revisao`, `/revisao/sala/[codigo]`, `/revisao/projecao/[codigo]` e `/aluno/revisao`, com atalhos no Hub e Portal. Os nove módulos/entitlements prévios permanecem intactos; novo módulo exige identidade docente válida. Sem Firebase Blaze, serviço adicional ou dependência npm nova. Edição docente limitada a texto, alternativas, explicações e conteúdo; preservar identidade/fontes/imagens oficiais e não simular revisão humana.

A impressão de revisão inclui os bytes do JSON e de todas as imagens declaradas. Sala antiga não pode servir imagem de fonte divergente; falhar de forma segura e orientar nova conferência/sala. Imagens anunciadas no DTO permanecem autorizáveis após a finalização. O empacotamento deve incluir somente o acervo privado necessário, excluir credenciais/arquivos locais e não inserir questões completas no JavaScript do navegador. Guia operacional: `docs/guias/revisao-ao-vivo.md`.
