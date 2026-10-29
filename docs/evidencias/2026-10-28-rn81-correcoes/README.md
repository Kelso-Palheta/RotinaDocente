# Evidências — correções RN-81 (PDF e ações do topo)

Data: 28–29/10/2026. Dados exclusivamente sintéticos. Esta pasta registra a verificação local das cinco correções pedidas na homologação RN-81 e dos dois bloqueios apontados na revisão independente; não é uma nova homologação de produção.

## Método

- **PDFs:** `generateBoletimPDF` e `generateFichaAluno360PDF` reais, executados localmente com aluno, turma, notas, prazos e feedback sintéticos. Foram gerados três documentos, todos com 2 páginas: `boletim`, `ficha-sem-registros` e `ficha-zero-presenca`. Os arquivos foram renderizados com `pdfjs-dist` + `@napi-rs/canvas`; todas as páginas estão em PNG nesta pasta, com o texto extraído ao lado. Os `.pdf` ficam em `tmp/rn81-correcoes/`, ignorados pelo Git.
- **Feedback:** o payload contém uma atividade regular no 1º bimestre e uma atividade de recuperação semestral (`finalidade: recuperacao_semestral`, `semestre: 1`), com feedback integral e questões. O rótulo da recuperação é gerado pelo próprio exportador; o feedback regular não é chamado de recuperação.
- **Totais:** S1 32,00, S2 25,00, anual 57,00 e metas 25/25/50 preservados nos dois PDFs de ficha e no boletim.
- **Capturas web:** página real `frontend/src/app/atividades/page.js`, servida por um ensaio Vite local com os mesmos componentes e CSS da aplicação; apenas os hooks de dados/autenticação foram substituídos por dados sintéticos. Chrome headless via DevTools Protocol em viewport de 390×844 e 1440×1000, com captura do estado sem foco e após navegação real por `Tab` até **Recuperação semestral**. A barra não mudou nesta rodada; as capturas seguem valendo para o código atual.
- **Acessibilidade por teclado:** 5 passos de `Tab` em 390 px (menu → Hub → Versão Adaptada → Portal do Aluno → Recuperação semestral) e 4 passos em 1440 px (o botão de menu fica oculto por CSS a partir de `md`). O contorno de foco calculado foi `auto 1px` nas duas larguras.

## Resultados observados

| Evidência | Resultado |
|---|---|
| [boletim-pagina-1.png](boletim-pagina-1.png) | Emissão com 4 mm de folga acima da faixa rosa, sem colisão; tabela começa abaixo da faixa. 1º bim 4,00 vermelho/**Abaixo da média**; 2º bim 8,00 verde/**Excelente**; 3º e 4º bim 5,00 azul/**Na média**; S1 32,00, S2 25,00, anual 57,00; mínimos 25/25/50. Aluno e turma longos quebrados em linhas. O caso de ausência (**Em aberto**) é coberto pelo teste automatizado H81-01, não por este PDF. |
| [boletim-pagina-2.png](boletim-pagina-2.png) | Anexo de devolutivas: atividade regular “1º bimestre • Avaliação diagnóstica do 1º bimestre” e recuperação “1º semestre • Recuperação semestral — Produção textual”, ambas com feedback e questões integrais, sem truncamento. |
| [ficha-sem-registros-pagina-1.png](ficha-sem-registros-pagina-1.png) | Aluno, turma, disciplina e professor longos quebrados sem sobreposição, medidos com a fonte efetiva da impressão; seção seguinte deslocada. Frequência **indisponível: sem registros de aulas no período**, sem 100%/regularidade. 32/25/57 e situação preservados. |
| [ficha-sem-registros-pagina-2.png](ficha-sem-registros-pagina-2.png) | Anexo de devolutivas compartilhado pelos três PDFs; por usar os mesmos dados sintéticos, o PNG é idêntico nos três. O anexo não repete 32/25/57 — esses totais estão na página 1. |
| [ficha-zero-presenca-pagina-1.png](ficha-zero-presenca-pagina-1.png) | Presença real zero: 4 aulas, 0 presenças, **0% Presença** em vermelho e alerta do Art. 24; não confunde zero real com ausência de registros. |
| [ficha-zero-presenca-pagina-2.png](ficha-zero-presenca-pagina-2.png) | Mesmo anexo de devolutivas da ficha sem registros. |
| [atividades-topo-390.png](atividades-topo-390.png) | Barra em 390 px: todas as ações visíveis e dentro da folha (`scrollWidth` 390; grupo de 16 a 374 px); quebra em três linhas, sem rolagem horizontal. |
| [atividades-topo-390-foco.png](atividades-topo-390-foco.png) | Foco visível em **Recuperação semestral** após 5 `Tab`s. |
| [atividades-topo-1440.png](atividades-topo-1440.png) | Barra em 1440 px: todas as ações em uma linha (`scrollWidth` 1440; grupo termina em 1416 px). |
| [atividades-topo-1440-foco.png](atividades-topo-1440-foco.png) | Foco visível em **Recuperação semestral** após 4 `Tab`s. |
| [capturas-layout.json](capturas-layout.json) | Medidas de viewport, largura de rolagem, retângulos dos botões, passos de teclado e contorno de foco. |
| Textos extraídos | [boletim-texto.txt](boletim-texto.txt), [ficha-sem-registros-texto.txt](ficha-sem-registros-texto.txt) e [ficha-zero-presenca-texto.txt](ficha-zero-presenca-texto.txt): conferência de valores, rótulos, recuperação semestral e ausência de truncamento. |

## Correções da revisão independente (29/10/2026)

- **REV-H81-01:** a altura do cabeçalho do boletim passou a ser calculada a partir da última linha de aluno/turma mais a emissão, reservando 4 mm até a faixa rosa; a tabela de notas desloca junto. Cabeçalhos curto e longo cobertos por teste.
- **REV-H81-02:** cada bloco de identificação da ficha é medido com a mesma fonte, estilo e tamanho usados no desenho — estudante em bold 9,5; turma, disciplina, matrícula e professor em normal 8,5. O cabeçalho da ficha mede o professor em normal 8,5, e o boletim mede aluno/turma em normal 10. Nenhuma linha ultrapassa 196,6 mm.
- **Testes:** as duas reproduções da revisão (`relatorios_pdf_revisao.test.js`) passaram sem edição; foram acrescentados 4 testes de cabeçalho curto/longo e fonte efetiva (`relatorios_pdf_cabecalho.test.js`). Suíte completa: **1.087 testes/236 arquivos aprovados**.

## Limites

- Ensaio local isolado: sem Firestore real, sem conta de produção, sem deploy e sem dados de estudantes reais.
- Os PDFs são sintéticos e servem para verificar layout/semântica; não substituem a exportação feita pelo usuário em produção.
- A leitura por leitor de tela e a auditoria completa de acessibilidade não foram executadas; o teste de teclado cobre a ordem de foco e o contorno visível na barra do topo.
- O anexo de devolutivas é compartilhado pelos três PDFs e, com os mesmos dados sintéticos, resulta em imagens idênticas na página 2; isso é esperado, não duplicação de arquivo.
- O logout da barra lateral de Atividades permanece fora desta entrega, conforme delimitado na homologação.
- As notas, fórmulas, pesos, critérios, autorização, persistência, destinatários e sincronização não foram alterados por estas correções.

## Revisão independente final

Em 29/10, os três PDFs foram regenerados novamente pelos exportadores reais e renderizados com Poppler, sem alterar o código/testes recebidos. 1.087 testes/236 arquivos, lint e build aprovados. Resultado e limites: [validação final](../../analises/2026-10-29-validacao-final-correcoes-recuperacao.md). As imagens acima registram o ensaio original; a nova renderização está nos arquivos temporários indicados pelo relatório.
