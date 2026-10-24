import { useCallback } from 'react';
import { aplicarImportacaoSimulado } from '@/dominio/diario/importacaoSimulado';
import { genId, round2 } from '@/utils/diario/calculos';
import { lerNumeroNota, validarCriterios } from '@/dominio/diario/criterios';

export const useNotas = (setTurmas) => {
  const importarSimulado = useCallback((turmaId, bimestre, registros) => {
    return setTurmas(prev => aplicarImportacaoSimulado(prev, turmaId, bimestre, registros), { origem: 'importacao', descricao: 'Importar notas do simulado' });
  }, [setTurmas]);

  const setNota = useCallback((turmaId, bimestre, alunoId, campo, valor) => {
    const numero = lerNumeroNota(valor, 0, Number.MAX_VALUE);
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const max = campo === 'simulado' ? Number(t.bimestres[b]?.config?.simuladoMaxLanca ?? 5) : Number(t.bimestres[b]?.atividades?.find(a => a.id === campo)?.max ?? 10);
        lerNumeroNota(numero, 0, max);
        const notasAnteriores = t.bimestres[b]?.notas || {};
        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: {
              ...t.bimestres[b],
              notas: {
                ...notasAnteriores,
                [alunoId]: {
                  ...(notasAnteriores[alunoId] || {}),
                  [campo]: numero
                }
              }
            }
          }
        };
      }),
      { origem: 'manual', descricao: 'Lançar nota' }
    );
  }, [setTurmas]);

  const addAtividade = useCallback((turmaId, bimestre, nome, max, atvIdNoMapa) => {
    const maximo = lerNumeroNota(max, 0.01, 100);
    if (maximo === '') throw new Error('Informe a nota máxima da atividade.');
    const id = atvIdNoMapa || `atv_${genId()}`;
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const bData = t.bimestres[b] || { atividades: [], notas: {} };
        const atividades = [...(bData.atividades || [])];
        const index = atividades.findIndex((a) => a.id === id);
        const novaAtv = { id, nome: nome.trim(), max: round2(maximo) };

        if (index >= 0) {
          atividades[index] = novaAtv;
        } else {
          atividades.push(novaAtv);
        }

        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: {
              ...bData,
              atividades
            }
          }
        };
      }),
      { origem: 'manual', descricao: 'Adicionar atividade' }
    );
  }, [setTurmas]);

  const removeAtividade = useCallback((turmaId, bimestre, atvId) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const atividades = (t.bimestres[b]?.atividades || []).filter((a) => a.id !== atvId);
        const notas = {};
        Object.entries(t.bimestres[b]?.notas || {}).forEach(([alId, vals]) => {
          const { [atvId]: _, ...resto } = vals;
          notas[alId] = resto;
        });
        return {
          ...t,
          bimestres: { ...t.bimestres, [b]: { ...t.bimestres[b], atividades, notas } }
        };
      }),
      { origem: 'limpeza', descricao: 'Remover atividade' }
    );
  }, [setTurmas]);

  const renameAtividade = useCallback((turmaId, bimestre, atvId, novoNome) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: {
              ...t.bimestres[b],
              atividades: (t.bimestres[b]?.atividades || []).map((a) =>
                a.id === atvId ? { ...a, nome: novoNome } : a
              )
            }
          }
        };
      }),
      { origem: 'manual', descricao: 'Renomear atividade' }
    );
  }, [setTurmas]);

  const updateConfig = useCallback((turmaId, bimestre, newConfig) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const bData = t.bimestres[b] || { atividades: [], notas: {} };
        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: {
              ...bData,
              config: validarCriterios({ ...(bData.config || {}), ...newConfig })
            }
          }
        };
      }),
      { origem: 'criterios', descricao: 'Alterar critérios' }
    );
  }, [setTurmas]);

  const clearAtividadesNota = useCallback((turmaId, bimestre, alunoId) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const bData = t.bimestres[b];
        if (!bData) return t;
        const notas = { ...bData.notas };
        const alunoNotas = notas[alunoId] || {};
        notas[alunoId] = { simulado: alunoNotas.simulado };
        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: { ...bData, notas }
          }
        };
      }),
      { origem: 'limpeza', descricao: 'Limpar atividades do aluno' }
    );
  }, [setTurmas]);

  const clearAtividadesTurma = useCallback((turmaId, bimestre) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const bData = t.bimestres[b];
        if (!bData) return t;
        const notas = {};
        Object.entries(bData.notas || {}).forEach(([alId, val]) => {
          notas[alId] = { simulado: val?.simulado };
        });
        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: { ...bData, notas }
          }
        };
      }),
      { origem: 'limpeza', descricao: 'Limpar atividades da turma' }
    );
  }, [setTurmas]);

  const clearSimuladoNota = useCallback((turmaId, bimestre, alunoId) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const bData = t.bimestres[b];
        if (!bData) return t;
        const notas = { ...bData.notas };
        const alunoNotas = notas[alunoId] || {};
        const { simulado: _, ...atividades } = alunoNotas;
        notas[alunoId] = atividades;
        return { ...t, bimestres: { ...t.bimestres, [b]: { ...bData, notas } } };
      }),
      { origem: 'limpeza', descricao: 'Limpar simulado do aluno' }
    );
  }, [setTurmas]);

  const clearSimuladoTurma = useCallback((turmaId, bimestre) => {
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        const bData = t.bimestres[b];
        if (!bData) return t;
        const notas = {};
        Object.entries(bData.notas || {}).forEach(([alId, val]) => {
          const { simulado: _, ...atividades } = val || {};
          notas[alId] = atividades;
        });
        return { ...t, bimestres: { ...t.bimestres, [b]: { ...bData, notas } } };
      }),
      { origem: 'limpeza', descricao: 'Limpar simulados da turma' }
    );
  }, [setTurmas]);

  const updateAtividadeMax = useCallback((turmaId, bimestre, atvId, novoMax) => {
    const maximo = lerNumeroNota(novoMax, 0.01, 100);
    if (maximo === '') throw new Error('Informe a nota máxima da atividade.');
    return setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const b = String(bimestre);
        return {
          ...t,
          bimestres: {
            ...t.bimestres,
            [b]: {
              ...t.bimestres[b],
              atividades: (t.bimestres[b]?.atividades || []).map((a) =>
                a.id === atvId ? { ...a, max: round2(maximo) } : a
              )
            }
          }
        };
      }),
      { origem: 'criterios', descricao: 'Alterar limite da atividade' }
    );
  }, [setTurmas]);

  return { setNota, importarSimulado, addAtividade, removeAtividade, renameAtividade, updateAtividadeMax, updateConfig, clearAtividadesNota, clearAtividadesTurma, clearSimuladoNota, clearSimuladoTurma };
};
