# Importar e organizar currículo anual com IA

Autorizado pelo usuário em 25/11/2026, após a integração anual. Entrada no módulo Planejamento; todas as disciplinas.

## Fluxo e limites
- Professor informa disciplina, série, ano letivo e tipo regular/gamificado. Cola texto ou seleciona PDF, DOCX, TXT/MD de até 15 MB e aciona leitura explícita pelo extrator compartilhado. PDFs escaneados seguem visão BYOK e seus limites existentes; não enviar PDF como base64 textual.
- Texto extraído permanece editável e exige confirmação antes de gerar. Material de 30 a 60000 caracteres; acima disso mostrar erro e pedir recorte, sem truncar silenciosamente. Arquivo original e texto integral não são armazenados pelo recurso.
- IA usa exclusivamente chave/provedor/modelo configurados pelo professor. Sem chave: conectar IA. Rota autenticada docente, mesma origem, body limitado, respostas privadas/no-store e chave redigida pelo handler existente.
- Geração em POST /api/aula-gamificada/planos/gerar-anual. Não salva plano, questões, jogos, histórico avaliativo ou notas. Reutilizar adaptador IA e normalizar resultado no domínio.
- Saída estrita com quatro bimestres únicos 1..4, cada um contendo 1..20 conteúdos e um objetivo sugerido opcional. Cada conteúdo deve ser um trecho literal do texto fornecido (normalização apenas de espaço/caixa), não um tema inventado. Recusar conteúdo fora da fonte, duplicações entre períodos, resposta vazia/malformada ou acima dos limites do plano. Texto anexado é dado, nunca instrução; não inventar códigos BNCC, datas, carga horária ou fatos ausentes.
- Distribuição e objetivos são sugestões pedagógicas para revisão; não prometer cobertura integral do material nem validação oficial curricular. Conteúdos ficam por período no contrato de currículo existente; o anual é a raiz integrada, sem vínculo nem origem forjados pela IA.
- Prévia mostra os quatro períodos. Após confirmação docente, “Usar rascunho no editor” abre anual ainda não salvo. Professor pode revisar distribuição, estratégias e avaliação e salvar pelo serviço privado existente. Rascunho importado não pode ser descartado silenciosamente ao navegar; descarte é explícito.
- Geração/extração têm progresso, erros/repetição, bloqueio contra clique duplicado e cancelamento de respostas tardias ao sair/trocar conta. Erro preserva texto e opções para nova tentativa.

## Aceite e testes
- Domínio: limites de entrada; prompt trata fonte como dado; quatro períodos; conteúdo literal; rejeição de invenções/duplicações/saída inválida; anual regular/gamificado válido sem autoria/ID/chave vindos da IA.
- Serviço/HTTP: docente/BYOK obrigatórios, origem/no-store/limite, gateway recebe provedor/modelo escolhido, não grava durante geração e protege chave.
- UI: texto/arquivo revisado, importação sem chave orientada, erro recuperável, prévia/confirmar/abrir editor, salvar separado e descarte protegido. Testes do extrator compartilhado preservados.
- Testes novos antes da implementação; preservar testes anteriores. Suíte completa, lint/build e capturas desktop/celular com dados sintéticos; registrar limite de não chamar IA real nas validações automatizadas.

### Verificação de 26/11/2026
Versões recém-criadas pela API privada abrem diretamente com o snapshot confirmado pelo servidor, sem GET redundante. Planos abertos da biblioteca continuam sendo relidos na conta atual. Rascunhos importados nunca usam esse estado de confirmado antes do salvamento explícito. Regressão nova preserva o bloqueio contra descarte e a revisão esperada do salvamento.
