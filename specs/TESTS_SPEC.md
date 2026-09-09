# 🧪 Especificação de Testes (TESTS_SPEC) — SimuladoApp.Edu

Mapeamento formal dos testes obrigatórios por regra de negócio.

---

## 1. Testes Unitários (`tests/unit/`)

### Módulo: Diário & Cálculos (`tests/unit/calculos.test.js`)
- [ ] **UT-01 (RN-01):** Validar cálculo de média com pesos padrão (Simulado 5.0 + Atividades 5.0).
- [ ] **UT-02 (RN-01):** Validar cálculo de média com pesos customizados (Simulado 3.0 + Atividades 7.0).
- [ ] **UT-03 (RN-02):** Validar arredondamento exato com 2 casas decimais (`round2(6.6666)` $\rightarrow$ `6.67`).
- [ ] **UT-04 (RN-03):** Validar categorização de status (`good`, `warn`, `bad`) conforme limites configurados.
- [ ] **UT-05 (RN-04):** Validar detecção de extrapolação de soma máxima de atividades.

### Módulo: Redação ENEM (`tests/unit/redacao_scores.test.js`)
- [ ] **UT-06 (RN-05):** Validar que toda pontuação de competência é múltiplo de 40 no intervalo [0, 200].
- [ ] **UT-07 (RN-05):** Validar cálculo de nota total como somatório estrito de C1..C5 (0 a 1000).

### Módulo: Horário Escolar (`tests/unit/horario_escolar.test.js`)
- [x] **UT-08 (RN-23):** Validar bloqueio de alocação de aula em slot classificado como intervalo (`isBreak: true`).
- [x] **UT-09 (RN-23):** Validar composição e parsing da chave canônica `${dayId}_${slotId}` e integridade dos turnos (`manha`, `tarde`, `noite`, `integral`).
- [x] **UT-10 (RN-24):** Validar persistência híbrida: chave local `meu_horario_escolar_data_v1` e fallback quando Firestore offline/não-autenticado.
- [x] **UT-11 (RN-25):** Validar exportação e importação de JSON com validação de esquema estrutural e sanitização.
- [x] **UT-12 (RN-26):** Validar dicionários i18n (pt-BR e es-Latam) garantindo paridade total de 100% das chaves e fallback para pt-BR.

---

## 2. Testes de Integração (`tests/integration/`)
- [ ] **IT-01:** Testar extração de texto de arquivos DOCX e PDF.
- [ ] **IT-02:** Testar serialização e deserialização do backup em JSON das turmas.
- [x] **IT-03 (RN-24 & RN-25):** Testar sincronização de grade horária e restore via repositório.

---

## 3. Testes de Contrato / API (`tests/contract/`)
- [ ] **CT-01:** Validar payload de chamada para o modelo `sabiazinho-4`.

---

## 4. Testes End-to-End (`tests/e2e/`)
- [ ] **E2E-01:** Validar carregamento da rota `/meuhorario` (com redirect a partir de `/horario`), renderização da grade, modal de edição e seletor de idioma pt-BR / es-Latam.
