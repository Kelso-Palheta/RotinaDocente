# Gerador de Atividades — ciclo RN-69

Data: 24/10/2026.

## Perceber

Auditoria anterior reproduziu fechamento prematuro, prazo deslocado, gabarito vazio, acesso não emitido, entrega sem autorização e penalização automática. Leitura complementar encontrou persistência antiga, dados de colegas nas respostas, colisão de IDs, edição destrutiva e regras permissivas entre professores.

## Decidir

Corrigir os defeitos sem introduzir banco de questões, duplicação, nova exportação ou remodelação completa do produto. Preservar dados e testes anteriores. Projetar acesso mínimo, validar vínculos, usar transação/lote, reutilizar proteção do Diário e separar correção/sincronização/publicação no fluxo atual.

## Agir

- Novos testes de acesso, Portal, sessão, editor, IA, carregamento, histórico, colisões, ciclo e penalidade legada, com falhas observadas antes das implementações correspondentes.
- API autoriza acesso emitido/ativo, sessão de links antigos e vínculo vigente; projeta campos públicos; entrega transacional conserva registros anteriores.
- Firestore restringe atividade/acessos e entregas aos professores autorizados; lote publica atividade e tokens juntos. Históricos usam consulta autorizada por atividade/aluno.
- Persistência da página compartilha fila/revisão/rascunho do Diário. Filtros de ano/arquivo, callbacks aguardados, erros e resultados visíveis.
- Editor preserva conteúdo e ID em falhas, prazo exato, escala/gabarito e materiais pendentes; leitura pode ser repetida sem novo upload; rubrica conserva soma e imagens chegam à correção.
- Similaridade não grava punição. Nova correção remove sinalização automática antiga; notas históricas não são restauradas sem revisão humana.
- Arquivamento conserva notas/entregas/feedback; mudanças estruturais com entregas/notas são recusadas. Links distinguem turma/aluno.

## Verificar

**Resultado final:** 690 testes em 131 arquivos aprovados na suíte completa; cinco testes adicionais de regras aprovados no emulador Firestore. Build de produção aprovado. Lint dos arquivos alterados sem erros, com dois avisos preexistentes de imagens. Nenhum teste anterior foi alterado ou removido. As APIs e componentes usam dados sintéticos; teste de regras usa emulador real, projeto demo e host local obrigatório. Nenhum registro real foi lido ou modificado.

## Limites e publicação

- Testes de APIs usam banco simulado; emulador verifica regras, consultas, bloqueio entre contas, autoria e lote de acessos.
- Não houve sessão autenticada de aluno real no navegador nem chamada real Gemini. O contrato Gemini permanece coberto na suíte.
- Publicar aplicativo e regras Firestore juntos é etapa de produção; não foi executada. Push/deploy do aplicativo não substitui publicação das regras.
- Segredo de sessão deixa de ser público: usa configuração existente ou deriva da credencial administrativa privada. Sessões antigas podem exigir novo login.
- Publicação com mais de 449 operações de acesso é recusada antes de gravar e orienta dividir turmas. Não há exclusão destrutiva nem migração em massa.
