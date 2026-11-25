# Reutilizar planejamento — implementação

**Objetivo:** nova versão gamificada a partir de plano regular salvo, sem modificar o original.
**Arquitetura:** helper puro de conversão e origem verificada pelo serviço privado de planos na transação existente. UI seleciona fonte e etapas, confirma criação de novo registro e abre o editor compartilhado.
**Tecnologias:** React/Next, serviços e Firestore atuais, Vitest. Nenhuma dependência nova.

1. Testes RED e helper de conversão; normalizar origem e validar snapshot/proveniência na persistência. Preservar legado.
2. Seletor privado, opções de etapas/formato, requisição idempotente e criação confirmada; integrar no módulo e em Meus planejamentos.
3. Origem no editor/lista, conteúdos longos e orientação de recorte no gerador.
4. Testes focados, revisão independente, suíte isolada, capturas, lint/build, commit/push e verificação online.
