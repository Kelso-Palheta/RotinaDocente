# Homologação real — recuperação semestral (RN-81)

Data: 28/10/2026. Ambiente: https://rotinadocente.vercel.app. Base revisada: `75f5dd6`; HEAD documental ao iniciar: `fde4812`.

## Resultado

Fluxo real de montagem, entrega, correção manual, lançamento, publicação e feedback aprovado no cenário descrito. Homologação visual/PDF **parcial**, com cinco ajustes comprovados abaixo. Não considerar todos os aceites concluídos.

O status agregado do GitHub registrou sucesso do Vercel para a implementação: [deploy 75f5dd6](https://vercel.com/kelso-palhetas-projects/rotinadocente/7XtRV5b853ExE6knmhK6jEaK2sxf). Também houve sucesso para [fde4812](https://vercel.com/kelso-palhetas-projects/rotinadocente/D8YL3wqwcyTk61fUcTB7gXMEcMw7). Além do status, os fluxos foram exercitados no aplicativo publicado, com gravações reais no Firestore e leitura pelo Portal.

## Método e isolamento

Conta temporária sem privilégios administrativos, turma fictícia com dois alunos, segunda turma de controle e dados exclusivamente sintéticos. Criação/configuração e comparação das próprias gravações usaram Admin SDK local; montagem, entrega, correção, lançamento, publicação e exportação usaram a interface publicada. Não foram usadas turmas ou notas de usuários reais.

Após o ensaio, foram removidos: duas atividades e suas subcoleções, duas entregas, dois boletins publicados, dois logins sintéticos, perfil e subcoleções da conta temporária, usuário Auth. Consulta final confirmou ausência de atividades/entregas da conta. Sessões encerradas e abas de teste fechadas. Credenciais e scripts temporários não integram o Git.

## Evidências funcionais

| Etapa | Resultado observado |
|---|---|
| Montagem em 4/10 | Primeira atividade persistida em rascunho; ausente no Portal |
| Completar 4+6 | Duas atividades liberadas ao fechar 10; semestre identificado |
| Entregar | Aluno A enviou ambas pelo Portal; conjunto congelado; B permaneceu pendente |
| Correção manual | 3/4 e 5/6, com feedback individual e geral salvo |
| Conferência | A: recuperação 8, semestre 20 → 32; B indisponível para lançamento, sem zero automático |
| Lançamento | Somente rec1 do aluno A recebeu 8; rec2=0 e notas dos demais preservados |
| Antes de republicar | Feedback disponível; boletim publicado ainda mostrava anual 45 |
| Publicação parcial | Somente 1º bimestre da turma selecionada, duas publicações sem falhas; recuperação correspondente atualizada |
| Portal após publicação | S1=32, S2=25, anual=57; bimestres originais 4/4/5/5 preservados; feedback de ambas as atividades identificado como 1º semestre |
| Repetir lançamento | Snapshot canônico exatamente igual; revisão 4 → 4; sem nota/histórico duplicados |
| PDFs exportados | Boletim e Ficha 360, duas páginas cada, mantêm 32/25/57 e devolutivas completas; defeitos visuais/semânticos abaixo |

A fórmula existente substituiu a menor nota bimestral no cálculo semestral; não somou diretamente oito pontos ao semestre. Aluno B permaneceu com anual 45, sem rec1 inventada.

**Precisão da comparação:** a primeira abertura/publicação inicializou critérios padrão ausentes no seed das turmas (`simuladoMaxLanca=5`, `simuladoMaxFinal=5`, `atividadesMaxFinal=5`, `mediaAprovacao=5`, `mediaRecuperacao=4.99`, `versaoCriterios=1`). Comparando o seed com esses mesmos padrões explícitos, bimestres e turma de controle permaneceram iguais. Não se afirma igualdade byte a byte com o seed incompleto. A repetição posterior teve comparação integral e idêntica.

## Achados para correção

1. **Boletim PDF diverge das cores do Portal.** `frontend/src/lib/aluno/boletim-pdf.js:92` usa corte fixo 6 e duas faixas. O Portal mostra 5,00 azul; PDF mostra vermelho e “Atenção”. Reutilizar `faixaNotaBimestral` de `frontend/src/utils/diario/coresNota.js`, considerando critérios do bimestre, excelente a partir de 8 e ausência distinta de zero. Não alterar 25/25/50.
2. **Ficha PDF sobrepõe turma longa e disciplina.** Identificação em `frontend/src/lib/diario/fichaAlunoExport.js:106` usa posições fixas incompatíveis com o nome da turma fictícia. Ajustar quebra/altura, preservando todo o texto e a paginação subsequente.
3. **Ficha declara 100% sem aulas registradas.** `frontend/src/dominio/diario/fichaAluno.js:130` inicializa percentual 100 e situação regular sem registros. PDF mostra zero aulas, zero presenças, zero faltas e 100%, com afirmação de regularidade. Usar estado sem registros/indisponível quando não houver base; não emitir conclusão de frequência nesse estado. Preservar cálculos com dados reais.
4. **Prazo de recuperação aparece ausente no professor.** `frontend/src/components/atividades/RecuperacaoSemestral.jsx:541` só interpreta objeto com `toDate`; dados serializados são ISO. Portal mostra prazo correto, cartão do professor mostra “data não informada”. Suportar formatos existentes sem inventar data.
5. **Barra de ações do professor corta controles em 390 px.** Conferido na página `frontend/src/app/atividades/page.js`. Reorganizar ações com quebra/rolagem acessível; ausência de overflow no documento não prova visibilidade dos botões.

Achado adicional, independente da recuperação: **“Sair” da barra lateral de Atividades apenas navega ao Hub**, mantendo sessão. `frontend/src/app/atividades/page.js:143` usa `router.push('/')` no `onLogout`. Logout real foi efetuado depois no Hub. Corrigir em etapa delimitada, com teste da chamada de logout e preservação dos dados; não tratar como regressão nova comprovada.

## Correções locais pós-homologação

Em 28/10/2026, os cinco achados numerados foram corrigidos e verificados localmente com dados sintéticos, sem alterar notas, fórmulas, pesos, critérios salvos, autorização, persistência, destinatários ou sincronização:

1. O boletim passou a usar `faixaNotaBimestral` com a configuração de cada bimestre e os rótulos do Portal; ausência continua distinta de zero.
2. Aluno, turma, disciplina e professor longos quebram em linhas na ficha, com altura dinâmica e paginação posterior preservada.
3. A ficha sem aulas/chamadas exibe frequência indisponível e não afirma 100% ou regularidade; zero real de presença continua crítico.
4. O prazo usa `formatarDataEntrega` no cartão do professor e no Portal, aceitando ISO, Timestamp e Date; ausente/inválido não inventa data.
5. A barra do topo quebra linhas em 390 e 1440 px, mantém todas as ações dentro da folha e preserva nomes acessíveis e foco por teclado.

Foram executados 1.081 testes em 234 arquivos, lint dos arquivos alterados e build de produção. As evidências sintéticas, incluindo PDFs renderizados e capturas em 390/1440 com foco por `Tab`, estão em [docs/evidencias/2026-10-28-rn81-correcoes/README.md](../evidencias/2026-10-28-rn81-correcoes/README.md). Esta verificação local não substitui nova homologação em produção nem teste com leitor de tela. O logout da barra lateral permanece pendente como tarefa independente.

## Revisão independente e correção dos dois bloqueios (29/10/2026)

A revisão independente aprovou o escopo geral, mas reteve a publicação por dois bloqueios reproduzidos em `tests/integration/relatorios_pdf_revisao.test.js`:

1. **REV-H81-01:** a emissão do boletim era desenhada exatamente no início da faixa rosa. O cabeçalho agora calcula a altura a partir da última linha de aluno/turma e da emissão, reservando 4 mm até a faixa; a tabela de notas desloca conforme a altura. Cabeçalhos curto e longo têm teste.
2. **REV-H81-02:** a identificação da ficha era medida com a fonte herdada (normal 8,5), mas o estudante era impresso em bold 9,5, estourando a margem. Cada bloco passou a ser medido com a mesma fonte, estilo e tamanho usados no desenho; professor e cabeçalho do boletim também usam o estilo efetivo.

As duas reproduções passaram sem edição. Foram acrescentados 4 testes de cabeçalho curto/longo e fonte efetiva (`tests/integration/relatorios_pdf_cabecalho.test.js`). Suíte completa: **1.087 testes em 236 arquivos**; lint dos arquivos alterados exit 0 e build de produção exit 0 em 29/10/2026.

As evidências foram refeitas com três PDFs sintéticos, todas as páginas renderizadas: boletim, ficha sem registros e ficha com zero real de presença. O payload usa uma atividade regular no 1º bimestre e uma recuperação semestral (`finalidade: recuperacao_semestral`, `semestre: 1`); S1 32, S2 25, anual 57 e metas 25/25/50 foram preservados. Ver [legenda atualizada](../evidencias/2026-10-28-rn81-correcoes/README.md).

Evidências visuais: [pasta e legenda](../evidencias/2026-10-28-recuperacao/README.md). Os PDFs originais auditados ficam em `tmp/homologacao-rn81/boletim-teste.pdf` e `ficha-teste.pdf`, ignorados pelo Git; as imagens renderizadas demonstram os problemas, não são modelos aprovados de exportação.

## Limites

- Portal conferido em 390×844 e 1440×1000; navegação por Tab alcançou botão com foco visível. Não houve ensaio com leitor de tela nem auditoria completa de acessibilidade.
- Correção manual exercitada. Não houve chamada real de IA/Gemini, nem teste real do gerador adaptado nesta rodada.
- Escritas transacionais reais e repetição idempotente verificadas. Não houve estresse simultâneo de concorrência no Firestore real.
- Analytics e todas as combinações de recuperação/legado não foram homologados manualmente nesta sessão.
- Esta rodada não alterou código/testes nem repetiu a suíte: os 1.018 testes, lint e build são da revisão técnica anterior, não uma nova execução.

## Prompt para DeepSeek/OpenCode

Copie o bloco abaixo. Implementação delimitada; revisão independente posterior continua necessária.

```text
Projeto: /Users/kelsopalheta/Developer/RotinaDocente
Leia AGENTS.md, specs/RULES.md, PRD.md e TESTS_SPEC.md; leia docs/analises/2026-10-28-homologacao-real-recuperacao-semestral.md e as seis evidências de imagem vinculadas.

Corrigir somente os cinco achados numerados da homologação. Não incluir o logout nesta entrega: registrar como próxima tarefa independente.

Arquivos de entrada:
- frontend/src/lib/aluno/boletim-pdf.js
- frontend/src/utils/diario/coresNota.js (classificador compartilhado a reutilizar)
- frontend/src/dominio/diario/fichaAluno.js
- frontend/src/lib/diario/fichaAlunoExport.js
- frontend/src/components/atividades/RecuperacaoSemestral.jsx
- frontend/src/app/atividades/page.js
Inspecione consumidores dos contratos alterados, principalmente percentual/status de frequência, para não introduzir regressões.

Antes de alterar produção, atualizar specs com critérios e adicionar novos testes de reprodução que falhem. Nunca alterar/remover testes preexistentes. Não mudar notas, fórmulas, pesos, critérios salvos, autorização, persistência, destinatários ou sincronização. Não habilitar Blaze, mudar armazenamento ou acessar dados reais.

Aceites:
1. Boletim usa faixaNotaBimestral e config do bimestre: abaixo do mínimo vermelho; mínimo até <8 azul; >=8 verde. Ausência segue distinta de zero; testar mínimo customizado, limites e nota ausente. Rótulos coerentes com Portal. Sem corte fixo 6.
2. Nome longo de aluno/turma/professor e disciplina quebram sem sobreposição/truncamento. Ajustar posição do conteúdo seguinte e paginação; verificar renderização de todas as páginas.
3. Sem aulas/base válida, frequência aparece sem registros/indisponível, sem 100% ou afirmação de regularidade. Com registros, cálculo/status existentes preservados. Cobrir domínio e exportação, incluindo ausência e zero real de presença.
4. Prazo interpreta ISO, Timestamp e Date conforme contratos atuais; inválido/ausente não inventa data. Professor e Portal exibem o mesmo prazo.
5. Em 390 e 1440 px, todas as ações do topo acessíveis/legíveis, sem corte, sobreposição ou mudança de funcionalidade; teclado/foco preservados. Verificação visual em navegador e capturas obrigatórias.

Criar testes novos para cada reprodução, confirmar RED e corrigir implementação; suíte completa, lint e build devem passar. Não substituir testes comportamentais por buscas de strings. Exportar boletim e ficha com dados sintéticos: S1=32, S2=25, anual=57; feedback 1º semestre completo, sem alteração de notas. Renderizar/inspecionar PDFs; registrar evidências e limites, sem declarar leitor de tela/IA real testados se não executados.

Entregar diff pequeno, testes e comandos/resultados, screenshots e relatório. Não fazer deploy/push antes da revisão independente neste chat.
```
