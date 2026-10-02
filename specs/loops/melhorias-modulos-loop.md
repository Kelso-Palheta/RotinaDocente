# 🔄 Registro de Ciclo SDD: Melhorias Estratégicas nos Módulos da Plataforma

**Data:** 01/10/2026  
**Status:** Concluído com Sucesso ✅  
**Escopo:** TASK-18 a TASK-22 (RN-51 a RN-55) / UT-25 a UT-29

---

## 1. 👁️ Perceber (Sense)
- O usuário solicitou sugestões de alto valor para os módulos existentes e instruiu: *"Quero todas"*.
- Foram mapeadas 5 frentes de melhoria com alto impacto pedagógico e conformidade normativa:
  1. **Meu Horário ↔ Calendário Pedagógico:** Eliminar o retrabalho de digitação manual convertendo os horários das turmas em aulas semanais para a distribuição letiva.
  2. **Evolução Longitudinal de Redação ENEM:** Diagnosticar o histórico cronológico de notas do aluno, calculando médias C1..C5, identificando a competência prioritária e detectando tendência de evolução.
  3. **Leitor Imersivo Acessível TTS:** Apoio a estudantes com TEA, Baixa Visão e Dislexia, oferecendo síntese de voz com limpeza fonética de markdown/HTML e controle de taxa de fala nos limites de conforto cognitivo.
  4. **Frequência Escolar & Infrequência LDB (Art. 24):** Alerta legal imediato para alunos em risco de reprovação por falta (< 75% frequência) e suporte à chamada em lote em 1 clique.
  5. **Telemetria Local de Consumo de IA (BYOK):** Transparência total e sem custo para o professor monitorar quantidade de chamadas e estimativa de tokens consumidos por provedor e módulo em armazenamento local seguro.

---

## 2. 🧠 Decidir (Decide)
- Adotar estritamente o ciclo **TDD (Red-Green-Refactor)** e **Clean Architecture**:
  - Cada regra implementada como função pura e isolada dentro de `src/dominio/`.
  - Nenhuma dependência externa, chamadas de rede ou acoplamento a frameworks de UI.
  - Blindagem de testes: escrever os testes unitários correspondentes em `tests/unit/`, validar a falha (Red), implementar a solução mínima (Green) e verificar a suíte completa de 41 arquivos.

---

## 3. ⚡ Agir (Act)
- **TASK-18 (RN-51 / UT-25):** Criado `tests/unit/grade_calendario_sync.test.js` e implementado `frontend/src/dominio/horario/conversorGradeCalendario.js` (`converterGradeParaAulasSemanais`).
- **TASK-19 (RN-52 / UT-26):** Criado `tests/unit/redacao_evolucao.test.js` e implementado `frontend/src/dominio/redacao/diagnosticoEvolucao.js` (`calcularEvolucaoCompetencias`).
- **TASK-20 (RN-53 / UT-27):** Criado `tests/unit/leitor_imersivo_tts.test.js` e implementado `frontend/src/dominio/adaptacoes/leitorAcessivel.js` (`prepararTextoParaLeitura`, `validarTaxaFala`, `ESTADOS_LEITURA`).
- **TASK-21 (RN-54 / UT-28):** Criado `tests/unit/frequencia_escolar.test.js` e implementado `frontend/src/dominio/diario/frequenciaEscolar.js` (`calcularFrequencia`, `classificarRiscoInfrequencia`, `marcarPresencaTodos`).
- **TASK-22 (RN-55 / UT-29):** Criado `tests/unit/telemetria_ia.test.js` e implementado `frontend/src/dominio/ai/telemetriaConsumo.js` (`registrarConsumoIA`, `obterResumoConsumoIA`, `limparTelemetriaIA`).

---

## 4. 🔍 Verificar (Verify)
- **Suíte Completa Executada:** `npm test` no frontend.
- **Resultado:**
  - **41/41 arquivos de teste aprovados (100% PASS)**
  - **324/324 testes unitários e de integração verdes (0 falhas)**
  - Tempo de execução: ~7.7s.
- **Checklists Atualizados:**
  - `specs/TESTS_SPEC.md`: UT-25 a UT-29 marcados com `[x]`.
  - `specs/TASKS.md`: TASK-18 a TASK-22 movidos para Entregas Concluídas `[x]`.
