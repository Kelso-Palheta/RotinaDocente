# Evidências — Redação Corrigida

Data: 27/10/2026. Dados fictícios; Firestore, navegação e chamadas de IA simulados. As páginas e funções analisadas são as reais do projeto.

Estes testes históricos passam ao confirmar defeitos existentes. Não integram a suíte de aceite e podem falhar depois da correção. Não executar contra serviços reais.

Para reproduzir, a partir de `frontend/`, copiar `config-vitest.cjs.txt` para `.auditoria-redacao.config.cjs`, executar `npx vitest run --config .auditoria-redacao.config.cjs --maxWorkers=2` e remover a configuração temporária ao terminar.

`contratos.test.js`: cinco reproduções de pontuação/extração/chamada de imagem. `interface.test.jsx`: duas reproduções dos efeitos de montagem das páginas com persistência simulada. `reproducoes.log`: sete cenários confirmados.

`testes-existentes.log`: 48 testes aprovados, em seis arquivos: `enem_score`, `redacao_evolucao`, `redacao_extracao_imagem`, `extrair_texto_vision_provider`, `correcao_feedback` e `padrao_visual_redacao`. A suíte completa e a homologação visual serão necessárias após uma implementação.
