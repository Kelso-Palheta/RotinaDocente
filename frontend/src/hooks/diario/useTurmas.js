import { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeNome, cleanNome, genId } from '@/utils/diario/calculos';
import { criarAlunoDiario, atualizarAlunoDiario } from '@/dominio/diario/AlunoDiario';

export const useTurmas = (initialTurmas, persistTurmas) => {
  const [turmas, setTurmasState] = useState(() => {
    if (initialTurmas && initialTurmas.length > 0) return initialTurmas;
    return [];
  });

  const userEdited = useRef(false);
  const persistRef = useRef(persistTurmas);

  // Mantém a ref sempre apontando para o callback mais recente
  useEffect(() => {
    persistRef.current = persistTurmas;
  }, [persistTurmas]);

  // setTurmas é estável — usa a ref para sempre chamar o persist atual
  const setTurmas = useCallback((newTurmasOrFn) => {
    userEdited.current = true;
    setTurmasState((prev) => {
      const next = typeof newTurmasOrFn === 'function' ? newTurmasOrFn(prev) : newTurmasOrFn;
      if (persistRef.current) {
        persistRef.current(next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (initialTurmas && !userEdited.current) {
      setTurmasState(initialTurmas);
    }
  }, [initialTurmas]);

  const addTurma = useCallback((nome) => {
    const id = `turma-${nome.trim().replace(/\s+/g, '-').toLowerCase()}-${genId()}`;
    const bimestres = {};
    [1, 2, 3, 4].forEach((b) => {
      bimestres[String(b)] = { atividades: [], notas: {} };
    });
    const nova = { id, nome: nome.trim(), alunos: [], bimestres };
    setTurmas((prev) => [...prev, nova]);
    return nova;
  }, [setTurmas]);

  const removeTurma = useCallback((turmaId) => {
    setTurmas((prev) => prev.filter((t) => t.id !== turmaId));
  }, [setTurmas]);

  const addAlunos = useCallback((turmaId, nomesNovos) => {
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const existentesNormalizados = new Set(t.alunos.map((a) => normalizeNome(a.nome)));
        const novos = nomesNovos
          .map((item) => {
            // Suporta tanto string quanto objeto { nome, dataNascimento, necessidades }
            const isObj = typeof item === 'object' && item !== null;
            const nome = isObj ? item.nome : item;
            const dataNascimento = isObj ? item.dataNascimento : undefined;
            const necessidades = isObj ? item.necessidades : undefined;
            return { nome, dataNascimento, necessidades };
          })
          .filter(({ nome }) => {
            const norm = normalizeNome(nome);
            if (existentesNormalizados.has(norm)) return false;
            existentesNormalizados.add(norm);
            return true;
          })
          .map(({ nome, dataNascimento, necessidades }) =>
            criarAlunoDiario({
              id: `al_${genId()}`,
              nome: cleanNome(nome),
              dataNascimento,
              necessidades
            })
          );
        const alunos = [...t.alunos, ...novos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        return { ...t, alunos };
      })
    );
  }, [setTurmas]);

  const removeAluno = useCallback((turmaId, alunoId) => {
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const alunos = t.alunos.filter((a) => a.id !== alunoId);
        const bimestres = {};
        Object.entries(t.bimestres).forEach(([b, dados]) => {
          const notas = { ...dados.notas };
          delete notas[alunoId];
          bimestres[b] = { ...dados, notas };
        });
        return { ...t, alunos, bimestres };
      })
    );
  }, [setTurmas]);

  const removeAlunos = useCallback((turmaId, alunoIds) => {
    const idsSet = new Set(alunoIds);
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const alunos = t.alunos.filter((a) => !idsSet.has(a.id));
        const bimestres = {};
        Object.entries(t.bimestres).forEach(([b, dados]) => {
          const notas = { ...dados.notas };
          alunoIds.forEach((alId) => { delete notas[alId]; });
          bimestres[b] = { ...dados, notas };
        });
        const recuperacao = { ...(t.recuperacao || {}) };
        alunoIds.forEach((alId) => { delete recuperacao[alId]; });
        return { ...t, alunos, bimestres, recuperacao };
      })
    );
  }, [setTurmas]);

  const setRecuperacao = useCallback((turmaId, alunoId, tipo, valor) => {
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        const recObj = t.recuperacao || {};
        const alunoRec = typeof recObj[alunoId] === 'object' ? recObj[alunoId] : {};
        const novoValor = valor === '' ? '' : Number(valor);
        return {
          ...t,
          recuperacao: {
            ...recObj,
            [alunoId]: { ...alunoRec, [tipo]: novoValor }
          }
        };
      })
    );
  }, [setTurmas]);

  const addAlunoManual = useCallback((turmaId, dados) => {
    const novoAluno = criarAlunoDiario({
      id: `al_${genId()}`,
      nome: cleanNome(dados.nome),
      dataNascimento: dados.dataNascimento,
      necessidades: dados.necessidades,
      nivelSuporte: dados.nivelSuporte,
      hiperfoco: dados.hiperfoco,
      observacoes: dados.observacoes
    });
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        if (t.alunos.some((a) => normalizeNome(a.nome) === normalizeNome(dados.nome))) return t;
        const alunos = [...t.alunos, novoAluno].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        return { ...t, alunos };
      })
    );
    return novoAluno;
  }, [setTurmas]);

  const updateAluno = useCallback((turmaId, alunoId, updates) => {
    setTurmas((prev) =>
      prev.map((t) => {
        if (t.id !== turmaId) return t;
        return { ...t, alunos: t.alunos.map((al) => al.id === alunoId ? atualizarAlunoDiario(al, updates) : al) };
      })
    );
  }, [setTurmas]);

  return { turmas, setTurmas, addTurma, removeTurma, addAlunos, addAlunoManual, removeAluno, removeAlunos, setRecuperacao, updateAluno };
};
