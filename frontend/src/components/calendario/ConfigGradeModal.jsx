import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Clock, CalendarSync, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { HorarioRepository } from '@/infraestrutura/horario/HorarioRepository';
import { SHIFT_PRESETS } from '@/dominio/horario/entidades';
import { extrairDiasSemanaPorTurma, listarTurmasDaGrade } from '@/dominio/horario/conversorGradeCalendario';

export function ConfigGradeModal({ isOpen, onClose, onSave, turmaSelecionada, initialGrade }) {
  const { user } = useAuth();

  const [dataInicio, setDataInicio] = useState(initialGrade?.dataInicioPeriodo || '2026-02-01');
  const [dataFim, setDataFim] = useState(initialGrade?.dataFimPeriodo || '2026-12-15');
  const [diasSemana, setDiasSemana] = useState(initialGrade?.diasSemana || []);

  const [novoDia, setNovoDia] = useState(1); // 1 = Seg
  const [novoInicio, setNovoInicio] = useState('07:30');
  const [novoFim, setNovoFim] = useState('09:10');
  const [novaQtd, setNovaQtd] = useState(2);

  // Estados da sincronização com "Meu Horário"
  const [carregandoMeuHorario, setCarregandoMeuHorario] = useState(false);
  const [feedbackMeuHorario, setFeedbackMeuHorario] = useState(null);
  const [turmasMeuHorario, setTurmasMeuHorario] = useState([]);
  const [gradeMeuHorarioCache, setGradeMeuHorarioCache] = useState(null);

  // Sincroniza sempre que a turma ou initialGrade mudar
  useEffect(() => {
    if (initialGrade) {
      setDataInicio(initialGrade.dataInicioPeriodo || '2026-02-01');
      setDataFim(initialGrade.dataFimPeriodo || '2026-12-15');
      setDiasSemana(initialGrade.diasSemana || []);
    } else {
      setDataInicio('2026-02-01');
      setDataFim('2026-12-15');
      setDiasSemana([]);
    }
    setFeedbackMeuHorario(null);
  }, [initialGrade, turmaSelecionada, isOpen]);

  if (!isOpen) return null;

  const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const handleAddDia = () => {
    setDiasSemana([...diasSemana, {
      diaSemana: Number(novoDia),
      horarioInicio: novoInicio,
      horarioFim: novoFim,
      quantidadeAulas: Number(novaQtd)
    }]);
  };

  const handleRemoveDia = (index) => {
    setDiasSemana(diasSemana.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!dataInicio || !dataFim || diasSemana.length === 0) {
      alert("Preencha o período letivo e adicione ao menos um dia na grade.");
      return;
    }
    
    onSave({
      dataInicioPeriodo: dataInicio,
      dataFimPeriodo: dataFim,
      diasSemana
    });
  };

  // Puxar rotina de aulas automaticamente do Meu Horário
  const handlePuxarMeuHorario = async (nomeForcado) => {
    setCarregandoMeuHorario(true);
    setFeedbackMeuHorario(null);

    try {
      const repo = new HorarioRepository({ firestoreDb: db });
      const loaded = gradeMeuHorarioCache || (await repo.carregarGrade(user?.uid || null));
      if (!gradeMeuHorarioCache && loaded) {
        setGradeMeuHorarioCache(loaded);
      }

      if (!loaded || !loaded.schedule || Object.keys(loaded.schedule).length === 0) {
        setFeedbackMeuHorario({
          tipo: 'erro',
          msg: 'Nenhuma aula cadastrada no módulo Meu Horário. Monte sua grade lá primeiro!'
        });
        return;
      }

      const turmasDetectadas = listarTurmasDaGrade(loaded.schedule);
      setTurmasMeuHorario(turmasDetectadas);

      const nomeAlvo = (nomeForcado || turmaSelecionada?.name || turmaSelecionada?.nome || '').trim();
      const slots =
        loaded.customSlots?.[loaded.shift] ||
        SHIFT_PRESETS[loaded.shift] ||
        SHIFT_PRESETS.manha;

      let rotinaExtraida = extrairDiasSemanaPorTurma(loaded.schedule, slots, nomeAlvo);

      // Se não encontrou exato mas tem turmas na grade, tenta casamento aproximado
      if (rotinaExtraida.length === 0 && turmasDetectadas.length > 0 && !nomeForcado) {
        const match = turmasDetectadas.find(
          (t) =>
            t.toLowerCase().includes(nomeAlvo.toLowerCase()) ||
            nomeAlvo.toLowerCase().includes(t.toLowerCase())
        );
        if (match) {
          rotinaExtraida = extrairDiasSemanaPorTurma(loaded.schedule, slots, match);
        }
      }

      if (rotinaExtraida.length > 0) {
        setDiasSemana(rotinaExtraida);
        setFeedbackMeuHorario({
          tipo: 'sucesso',
          msg: `🎉 ${rotinaExtraida.length} dia(s) importados automaticamente do Meu Horário!`
        });
      } else {
        setFeedbackMeuHorario({
          tipo: 'aviso',
          msg: `Não encontramos aulas com o nome exato "${nomeAlvo}". Selecione qual turma do Meu Horário corresponde a esta:`
        });
      }
    } catch (err) {
      console.error('Erro ao importar do Meu Horário:', err);
      setFeedbackMeuHorario({
        tipo: 'erro',
        msg: 'Erro ao conectar ao Meu Horário: ' + err.message
      });
    } finally {
      setCarregandoMeuHorario(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Configurar Grade Horária
            </h2>
            {turmaSelecionada && (
              <span className="block text-xs font-semibold text-violet-600 mt-0.5">
                Turma: {turmaSelecionada.name || turmaSelecionada.nome}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Card de Importação Direta do Meu Horário */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  Importar do Meu Horário
                </h4>
                <p className="text-xs text-violet-700 mt-0.5">
                  Puxa automaticamente dias, horários e quantidade de aulas desta turma já cadastrados no Meu Horário.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePuxarMeuHorario()}
                disabled={carregandoMeuHorario}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CalendarSync className="w-4 h-4" />
                {carregandoMeuHorario ? 'Puxando...' : 'Puxar do Meu Horário'}
              </button>
            </div>

            {/* Feedback da Importação */}
            {feedbackMeuHorario && (
              <div className="mt-3 pt-3 border-t border-violet-200/60">
                {feedbackMeuHorario.tipo === 'sucesso' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{feedbackMeuHorario.msg}</span>
                  </div>
                )}

                {feedbackMeuHorario.tipo === 'erro' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{feedbackMeuHorario.msg}</span>
                  </div>
                )}

                {feedbackMeuHorario.tipo === 'aviso' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{feedbackMeuHorario.msg}</span>
                    </div>

                    {turmasMeuHorario.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs font-semibold text-slate-700">Vincular a:</label>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) handlePuxarMeuHorario(e.target.value);
                          }}
                          className="text-xs border border-violet-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 outline-none focus:ring-1 focus:ring-violet-500 font-medium"
                        >
                          <option value="" disabled>Escolha uma turma do Meu Horário...</option>
                          {turmasMeuHorario.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Período Letivo */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Período Letivo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data de Início</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={e => setDataInicio(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data de Término</label>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Adicionar Dia Manualmente */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Rotina Semanal de Aulas</h3>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
              <div className="grid grid-cols-5 gap-3 items-end">
                <div className="col-span-2">
                  <label className="block text-xs text-indigo-800 mb-1 font-medium">Dia da Semana</label>
                  <select 
                    value={novoDia} 
                    onChange={e => setNovoDia(e.target.value)}
                    className="w-full border-indigo-200 rounded-md text-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    {diasNomes.map((nome, i) => (
                      <option key={i} value={i}>{nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-indigo-800 mb-1 font-medium">Início</label>
                  <input type="time" value={novoInicio} onChange={e => setNovoInicio(e.target.value)} className="w-full border-indigo-200 rounded-md text-sm text-gray-900 focus:ring-indigo-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-indigo-800 mb-1 font-medium">Fim</label>
                  <input type="time" value={novoFim} onChange={e => setNovoFim(e.target.value)} className="w-full border-indigo-200 rounded-md text-sm text-gray-900 focus:ring-indigo-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-indigo-800 mb-1 font-medium">Qtd Aulas</label>
                  <input type="number" min="1" max="10" value={novaQtd} onChange={e => setNovaQtd(e.target.value)} className="w-full border-indigo-200 rounded-md text-sm text-gray-900 focus:ring-indigo-500 bg-white" />
                </div>
              </div>
              <button 
                type="button"
                onClick={handleAddDia}
                className="mt-3 flex items-center justify-center w-full py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-200 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar à Grade Manualmente
              </button>
            </div>

            {/* Lista de Dias Adicionados */}
            {diasSemana.length > 0 ? (
              <div className="space-y-2">
                {diasSemana.map((dia, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm">
                    <div>
                      <span className="font-semibold text-gray-800">{diasNomes[dia.diaSemana]}</span>
                      <span className="text-gray-500 text-sm ml-2">{dia.horarioInicio} às {dia.horarioFim}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                        {dia.quantidadeAulas} aula(s)
                      </span>
                      <button onClick={() => handleRemoveDia(index)} className="text-red-400 hover:text-red-600" title="Remover dia">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum dia configurado na grade ainda. Clique em "Puxar do Meu Horário" ou adicione acima.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Salvar e Gerar Aulas
          </button>
        </div>
      </div>
    </div>
  );
}
