# Revisão independente — responsividade dos Agentes Pedagógicos IA

Data: 31/10/2026. Base: `7c623bc`. Escopo: quatro componentes/página de Agentes, especificação exclusiva, oito testes novos e evidências sintéticas. O logout de Atividades permanece separado e retido.

## Comportamento conferido

Abaixo de 900 px, selecionar um agente abre a conversa em uma coluna, com botão de retorno à seleção. A partir de 900 px, seleção de 300 px e conversa aparecem lado a lado. A alternância usa CSS sem desmontar a conversa; mensagens e texto digitado permanecem durante resize. Conteúdo longo quebra linha, campo de mensagem cresce até 120 px e controles recebem nomes acessíveis.

Diff examinado: sem mudanças de autenticação, API, hook de conversa, modelo/provedor ou persistência de histórico. O provedor existente continua Maritalk/sabiazinho-4; esta entrega não troca IA. Nenhum teste anterior foi editado ou removido.

## Evidência visual e limites

Inspecionadas as capturas entregues de conversa em 390×844 e 1440×900: conteúdo e área de envio visíveis, texto longo contido, painel lateral disponível no desktop. As medições e demais capturas estão em `docs/evidencias/2026-10-31-agentes-responsividade/`.

O executor produziu capturas com componentes reais e dados sintéticos em um harness local; autenticação, roteador e resposta de IA simulados, fontes de sistema. A revisão inspecionou os artefatos; não repetiu homologação com conta real, teclado móvel/IME ou leitor de tela. Testes jsdom não calculam media queries. Voltar à seleção desmonta a conversa e perde texto ainda não enviado; preservar rascunho nessa navegação permanece melhoria futura, fora do aceite de preservação durante resize.

## Validação da árvore publicável

A árvore publicável foi reproduzida em cópia temporária de `git archive 7c623bc`, recebendo somente os quatro arquivos de produção dos Agentes, a especificação exclusiva e o teste novo. Não recebeu alterações nem testes locais de logout.

- Suíte completa: **1.095 testes em 237 arquivos aprovados**, exit 0, incluindo oito cenários novos dos Agentes.
- Lint dos quatro arquivos: exit 0, sem erros/avisos.
- Build de produção com Next/Turbopack: exit 0.
- `git diff --check`: aprovado; nenhum teste rastreado alterado.

A primeira tentativa de isolamento usava dependências por symlink externo, recusado pelo Turbopack. O runtime foi copiado para a árvore temporária e as validações foram repetidas integralmente com sucesso, sem mudar código ou testes para contornar falhas. Logs finais locais ignorados: `tmp/agentes-isolado-{testes,lint,build}.log`.

Resultado: **aprovada a publicação do escopo responsivo dos Agentes**. A árvore local completa contém a reprodução reprovada do logout; não se afirma aprovação desse escopo.

## Próximos passos

Concluir a correção de logout descrita em `docs/analises/2026-10-31-segunda-revisao-logout-atividades.md`; depois retomar a análise completa do módulo Agentes. Ao final das tarefas, concluir armazenamento das imagens de Atividades Adaptadas, mantendo o plano Firebase atual e sem ativar Blaze.
