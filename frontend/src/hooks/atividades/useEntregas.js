"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { prepararCorrecaoManual, registrarCorrecaoAnterior } from '@/dominio/atividades/correcaoManual';
import { entregaNoEscopo } from '@/dominio/diario/sincronizacaoAtividades';
import { corrigirAtividade, detectarRespostasSimilares } from '@/utils/atividades/correcaoIA';

export function useEntregas(activityId, onNotaChanged, { turmaId, bimestre } = {}) {
  const [snapshot, setSnapshot] = useState({ activityId: null, entregas: [], erro: '' });
  const entregas = useMemo(() => snapshot.activityId === activityId ? snapshot.entregas.filter(entrega => entregaNoEscopo(entrega, { turmaId, bimestre })) : [], [snapshot, activityId, turmaId, bimestre]);
  const [corrigindo, setCorrigindo] = useState(null);
  const erro = snapshot.activityId === activityId ? snapshot.erro : '';

  useEffect(() => {
    if (!activityId) return;
    const q = query(collection(db, 'entregas'), where('activityId', '==', activityId));
    const unsub = onSnapshot(q, (snap) => {
      setSnapshot({ activityId, entregas: snap.docs.map(d => ({ ...d.data(), id: d.id })), erro: '' });
    }, error => { setSnapshot({ activityId, entregas: [], erro: error.message || 'Erro ao carregar entregas.' }); });
    return () => unsub();
  }, [activityId]);

  const overrideNota = useCallback(async (entregaId, novaNota, professorId) => {
    const entrega = entregas.find(e => e.id === entregaId);
    if (!entrega) return;
    await setDoc(doc(db, 'entregas', entregaId), {
      notaRevisada: Number(novaNota),
      notaAnteriorRevisao: entrega.notaRevisada ?? entrega.notaFinal ?? null,
      revisadaPorId: professorId,
      revisadaEm: serverTimestamp(),
      status: 'revisado'
    }, { merge: true });
  }, [entregas]);

  const corrigirManualmente = useCallback(async (entregaId, atividade, dados, professorId) => {
    const entrega = entregas.find(item => item.id === entregaId);
    if (!entrega) throw new Error('Entrega fora do escopo selecionado.');
    const payload = prepararCorrecaoManual(atividade, entrega, dados, professorId);
    payload.revisadaEm = serverTimestamp();
    payload.corrigidoEm = serverTimestamp();
    await setDoc(doc(db, 'entregas', entregaId), payload, { mergeFields: Object.keys(payload) });
    onNotaChanged?.({ turmaId: entrega.turmaId, bimestre: entrega.bimestre, alunoId: entrega.alunoId, notaFinal: payload.notaFinal });
    return payload;
  }, [entregas, onNotaChanged]);

  const corrigirEntrega = useCallback(async (entregaId, atividade, nivelCorrecao = 'normal') => {
    const entrega = entregas.find(e => e.id === entregaId);
    if (!entrega || !atividade) return;

    setCorrigindo(entregaId);
    try {
      let resultado;

      if (atividade.questoes?.length > 0) {
        resultado = await corrigirAtividade({
          questoes: atividade.questoes,
          respostas: entrega.respostas || {},
          materialTexto: atividade.materialApoio?.textoExtraido || '',
          nivelCorrecao
        });

        await setDoc(doc(db, 'entregas', entregaId), {
          resultados: resultado.resultados,
          notaOriginal: resultado.notaFinal,
          notaFinal: resultado.notaFinal,
          modeloIA: resultado.modelo,
          corrigidoEm: serverTimestamp(),
          status: 'corrigido', tipoCorrecao: 'ia', penalidadePlagio: false, notaRevisada: null, revisadaPorId: null,
          correcaoAnterior: registrarCorrecaoAnterior(entrega),
          feedback: resultado.feedback || '', feedbackGeral: '',
        }, { mergeFields: ['resultados', 'notaOriginal', 'notaFinal', 'modeloIA', 'corrigidoEm', 'status', 'tipoCorrecao', 'penalidadePlagio', 'notaRevisada', 'revisadaPorId', 'correcaoAnterior', 'feedback', 'feedbackGeral'] });
      } else {
        resultado = await corrigirAtividade({
          enunciado: atividade.enunciado,
          gabarito: atividade.gabarito,
          respostaTexto: entrega.respostaTexto || '',
          notaMaxima: atividade.notaMaxima || 10,
          imagens: [],
          nivelCorrecao
        });

        await setDoc(doc(db, 'entregas', entregaId), {
          notaIA: resultado.notaIA,
          notaOriginal: resultado.notaFinal,
          notaFinal: resultado.notaFinal,
          feedback: resultado.feedback,
          criterios: resultado.criterios,
          modeloIA: resultado.modelo,
          corrigidoEm: serverTimestamp(),
          status: 'corrigido', tipoCorrecao: 'ia', penalidadePlagio: false, notaRevisada: null, revisadaPorId: null, feedbackGeral: '',
          correcaoAnterior: registrarCorrecaoAnterior(entrega),
        }, { merge: true });
      }

      if (resultado && entrega) {
        const notaValor = resultado.notaFinal;
        onNotaChanged?.({
          turmaId: entrega.turmaId,
          bimestre: entrega.bimestre,
          alunoId: entrega.alunoId,
          notaFinal: notaValor
        });
      }

      return resultado;
    } catch (err) {
      console.error('Erro na correção por IA:', err);
      if (!['corrigido', 'revisado'].includes(entrega.status)) {
        await setDoc(doc(db, 'entregas', entregaId), { status: 'erro_correcao' }, { merge: true });
      }
      throw err;
    } finally {
      setCorrigindo(null);
    }
  }, [entregas, onNotaChanged]);

  // Similaridade orienta revisão humana; jamais grava punição automática.
  const similaridades = useMemo(() => {
    const corrigidas = entregas.filter(e => ['corrigido', 'revisado'].includes(e.status) && e.notaRevisada == null && e.tipoCorrecao !== 'manual');
    return corrigidas.length < 2 ? [] : detectarRespostasSimilares(corrigidas).clusters;
  }, [entregas]);

  return { entregas, corrigindo, erro, similaridades, overrideNota, corrigirEntrega, corrigirManualmente };
}
