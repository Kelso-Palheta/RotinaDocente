"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  DAYS,
  SHIFT_PRESETS,
  buildSlotKey,
  parseSlotKey,
  validarAlocacaoAula,
  validarSlotIntervalo,
} from "../../dominio/horario/entidades";
import {
  exportarGradeJson,
  importarGradeJson,
  calcularEstatisticasGrade,
} from "../../aplicacao/horario/gradeService";
import { HorarioRepository } from "../../infraestrutura/horario/HorarioRepository";
import { tHorario } from "./i18n";
import "./horario.css";

const COLOR_PALETTE = [
  "#4f46e5",
  "#2563eb",
  "#0284c7",
  "#0d9488",
  "#16a34a",
  "#d97706",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#475569",
];

const COMMON_SUBJECTS = [
  { name: "Matemática", color: "#6366f1" },
  { name: "Português", color: "#3b82f6" },
  { name: "História", color: "#f59e0b" },
  { name: "Geografia", color: "#10b981" },
  { name: "Biologia", color: "#059669" },
  { name: "Física", color: "#8b5cf6" },
  { name: "Química", color: "#ec4899" },
  { name: "Inglês", color: "#ef4444" },
  { name: "Arte", color: "#d946ef" },
  { name: "Ed. Física", color: "#14b8a6" },
  { name: "Filosofia", color: "#64748b" },
  { name: "Sociologia", color: "#78716c" },
];

export default function HorarioApp() {
  const { user } = useAuth();
  const repo = useMemo(() => new HorarioRepository({ firestoreDb: db }), []);

  // Idioma (pt-BR / es-Latam)
  const [lang, setLang] = useState("pt-BR");
  const t = (key) => tHorario(key, lang);

  // Estado da aplicação
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Prof. Usuário");
  const [schoolName, setSchoolName] = useState("Minha Escola");
  const [shift, setShift] = useState("manha");
  const [showSaturday, setShowSaturday] = useState(false);
  const [theme, setTheme] = useState("light");
  const [customSlots, setCustomSlots] = useState(null);
  const [schedule, setSchedule] = useState({});
  const [syncStatus, setSyncStatus] = useState("local"); // 'cloud' | 'local' | 'saving'

  // Modais
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [activeSlotData, setActiveSlotData] = useState(null); // { dayId, slotId, aula }
  const [formSubject, setFormSubject] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formRoom, setFormRoom] = useState("");
  const [formColor, setFormColor] = useState("#4f46e5");
  const [formNotes, setFormNotes] = useState("");
  const [replicateDays, setReplicateDays] = useState([]);

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [tempSlots, setTempSlots] = useState([]);

  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carregar dados na montagem
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const loaded = await repo.carregarGrade(user?.uid || null);
        if (isMounted && loaded) {
          setTeacherName(loaded.teacherName || "Prof. Usuário");
          setSchoolName(loaded.schoolName || "Minha Escola");
          setShift(loaded.shift || "manha");
          setShowSaturday(Boolean(loaded.showSaturday));
          setTheme(loaded.theme || "light");
          setCustomSlots(loaded.customSlots || null);
          setSchedule(loaded.schedule || {});
          setSyncStatus(user ? "cloud" : "local");
        }
      } catch (err) {
        console.error("Falha ao inicializar grade:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [repo, user]);

  // Aplicar tema no html / container
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Slots ativos no turno
  const currentSlots = useMemo(() => {
    if (customSlots && customSlots[shift]) {
      return customSlots[shift];
    }
    return SHIFT_PRESETS[shift] || SHIFT_PRESETS.manha;
  }, [shift, customSlots]);

  // Salvar alterações
  const saveState = async (nextState) => {
    setSyncStatus("saving");
    const payload = {
      teacherName: nextState.teacherName ?? teacherName,
      schoolName: nextState.schoolName ?? schoolName,
      shift: nextState.shift ?? shift,
      showSaturday: nextState.showSaturday ?? showSaturday,
      theme: nextState.theme ?? theme,
      customSlots: nextState.customSlots !== undefined ? nextState.customSlots : customSlots,
      schedule: nextState.schedule ?? schedule,
    };

    try {
      await repo.salvarGrade(user?.uid || null, payload);
      setSyncStatus(user ? "cloud" : "local");
    } catch (err) {
      console.warn("Erro ao sincronizar:", err);
      setSyncStatus("local");
    }
  };

  // Estatísticas da grade
  const stats = useMemo(() => calcularEstatisticasGrade(schedule), [schedule]);

  const visibleDays = useMemo(() => {
    return showSaturday ? DAYS : DAYS.filter((d) => d.id !== "sab");
  }, [showSaturday]);

  // Abertura do modal de aula
  const handleSlotClick = (dayId, slot) => {
    if (slot.isBreak) return;
    const slotKey = buildSlotKey(dayId, slot.id);
    const existing = schedule[slotKey];

    setActiveSlotData({ dayId, slotId: slot.id, slotLabel: slot.label, slotTime: `${slot.start} - ${slot.end}` });
    setFormSubject(existing?.subject || "");
    setFormGrade(existing?.grade || "");
    setFormRoom(existing?.room || "");
    setFormColor(existing?.color || "#4f46e5");
    setFormNotes(existing?.notes || "");
    setReplicateDays([]);
    setSlotModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!activeSlotData) return;

    try {
      validarAlocacaoAula({
        dayId: activeSlotData.dayId,
        slotId: activeSlotData.slotId,
        turno: shift,
        subject: formSubject,
      });

      const updatedSchedule = { ...schedule };
      const mainKey = buildSlotKey(activeSlotData.dayId, activeSlotData.slotId);

      const novaAula = {
        subject: formSubject.trim(),
        grade: formGrade.trim(),
        room: formRoom.trim(),
        color: formColor,
        notes: formNotes.trim(),
      };

      updatedSchedule[mainKey] = novaAula;

      // Replicar para outros dias selecionados
      replicateDays.forEach((targetDay) => {
        if (targetDay !== activeSlotData.dayId) {
          const repKey = buildSlotKey(targetDay, activeSlotData.slotId);
          updatedSchedule[repKey] = { ...novaAula };
        }
      });

      setSchedule(updatedSchedule);
      await saveState({ schedule: updatedSchedule });
      setSlotModalOpen(false);
      showToast(t("savedSuccess"));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSlot = async () => {
    if (!activeSlotData) return;
    const key = buildSlotKey(activeSlotData.dayId, activeSlotData.slotId);
    const updatedSchedule = { ...schedule };
    delete updatedSchedule[key];

    setSchedule(updatedSchedule);
    await saveState({ schedule: updatedSchedule });
    setSlotModalOpen(false);
    showToast(t("remove") + " com sucesso!");
  };

  // Limpar toda a grade
  const handleExecuteClear = async () => {
    const updatedSchedule = {};
    setSchedule(updatedSchedule);
    await saveState({ schedule: updatedSchedule });
    setConfirmClearOpen(false);
    showToast("Grade limpa com sucesso!");
  };

  // Exportar JSON
  const handleExportJson = () => {
    const jsonStr = exportarGradeJson({
      teacherName,
      schoolName,
      shift,
      showSaturday,
      theme,
      customSlots,
      schedule,
    });
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `horario_escolar_${shift}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("exportJson") + " pronto!");
  };

  // Importar JSON
  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        const imported = importarGradeJson(String(text), shift);

        setTeacherName(imported.teacherName);
        setSchoolName(imported.schoolName);
        setShift(imported.shift);
        setShowSaturday(imported.showSaturday);
        setSchedule(imported.schedule);
        if (imported.customSlots) setCustomSlots(imported.customSlots);

        await saveState(imported);
        setBackupModalOpen(false);
        showToast(t("importedSuccess"));
      } catch (err) {
        alert("Erro na importação: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Abrir modal de configuração de slots
  const handleOpenConfigModal = () => {
    setTempSlots(JSON.parse(JSON.stringify(currentSlots)));
    setConfigModalOpen(true);
  };

  const handleSaveConfigModal = async () => {
    const nextCustom = { ...(customSlots || {}) };
    nextCustom[shift] = tempSlots;
    setCustomSlots(nextCustom);
    await saveState({ customSlots: nextCustom });
    setConfigModalOpen(false);
    showToast(t("savedSuccess"));
  };

  const handleLoadPresetConfig = (presetKey) => {
    const preset = SHIFT_PRESETS[presetKey];
    if (preset) {
      setTempSlots(JSON.parse(JSON.stringify(preset)));
    }
  };

  const handleAddTempSlot = (isBreak) => {
    const nextIndex = tempSlots.length + 1;
    const newSlot = {
      id: isBreak ? `bk_${Date.now()}` : `s_${Date.now()}`,
      label: isBreak ? "Intervalo / Recreio" : `${nextIndex}º Horário`,
      start: "08:00",
      end: "08:45",
      isBreak,
    };
    setTempSlots([...tempSlots, newSlot]);
  };

  const handleRemoveTempSlot = (index) => {
    const next = [...tempSlots];
    next.splice(index, 1);
    setTempSlots(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="horario-module-wrapper">
      {/* CABEÇALHO */}
      <header className="app-header no-print">
        <div className="header-container">
          <div className="brand-group">
            <Link href="/" className="btn-back-hub" title="Voltar ao Hub RotinaDocente" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <div className="brand-icon" style={{ cursor: "pointer" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                </svg>
              </div>
            </Link>
            <div>
              <h1 className="brand-title">{t("appTitle")}</h1>
              <p className="brand-subtitle">
                RotinaDocente • {syncStatus === "cloud" ? "☁️ Sincronizado no Firestore" : "💾 Persistência Local"}
              </p>
            </div>
          </div>

          {/* Dados do Professor e Escola */}
          <div className="teacher-info-pill">
            <div className="info-field">
              <label htmlFor="teacherNameInput">{t("teacher")}:</label>
              <input
                type="text"
                id="teacherNameInput"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                onBlur={() => saveState({ teacherName })}
                placeholder="Seu nome"
              />
            </div>
            <div className="info-divider"></div>
            <div className="info-field">
              <label htmlFor="schoolNameInput">{t("school")}:</label>
              <input
                type="text"
                id="schoolNameInput"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                onBlur={() => saveState({ schoolName })}
                placeholder="Nome da Escola"
              />
            </div>
          </div>

          {/* Ações do Topo */}
          <div className="header-actions">
            {/* Seletor de Idioma */}
            <div className="select-wrapper" title="Alterar Idioma">
              <select
                aria-label="Idioma"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{ fontWeight: 600, color: "var(--primary)" }}
              >
                <option value="pt-BR">🇧🇷 PT-BR</option>
                <option value="es-Latam">🌎 ES-Latam</option>
              </select>
            </div>

            {/* Turno Selecionado */}
            <div className="select-wrapper" title="Alterar turno da grade">
              <svg className="select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
              </svg>
              <select
                id="shiftSelect"
                value={shift}
                onChange={(e) => {
                  const newShift = e.target.value;
                  setShift(newShift);
                  saveState({ shift: newShift });
                }}
              >
                <option value="manha">{t("shift")}: {t("shiftManha")} (7h - 12h)</option>
                <option value="tarde">{t("shift")}: {t("shiftTarde")} (13h - 18h)</option>
                <option value="noite">{t("shift")}: {t("shiftNoite")} (18h45 - 22h)</option>
                <option value="integral">{t("shiftIntegral")}</option>
              </select>
            </div>

            {/* Configurar Horários */}
            <button
              id="btnConfigSlots"
              className="btn btn-ghost"
              onClick={handleOpenConfigModal}
              title="Configurar horários de aulas e intervalos"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Horários</span>
            </button>

            {/* Imprimir / PDF */}
            <button
              id="btnPrint"
              className="btn btn-primary"
              onClick={() => window.print()}
              title="Imprimir ou Salvar em PDF"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>{t("print")} / PDF</span>
            </button>

            {/* Backup */}
            <button
              id="btnBackup"
              className="btn btn-outline"
              onClick={() => setBackupModalOpen(true)}
              title="Exportar ou Importar dados"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Backup</span>
            </button>

            {/* Alternar Tema */}
            <button
              id="btnThemeToggle"
              className="btn-icon"
              onClick={() => {
                const nextTheme = theme === "light" ? "dark" : "light";
                setTheme(nextTheme);
                saveState({ theme: nextTheme });
              }}
              aria-label="Alternar modo escuro"
            >
              {theme === "light" ? (
                <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg className="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* CABEÇALHO PARA IMPRESSÃO */}
      <div className="print-header only-print">
        <div className="print-title-box">
          <h2>QUADRO SEMANAL DE HORÁRIO INDIVIDUAL DO PROFESSOR</h2>
          <div className="print-meta-grid">
            <div><strong>{t("teacher")}:</strong> <span>{teacherName}</span></div>
            <div><strong>{t("school")}:</strong> <span>{schoolName}</span></div>
            <div><strong>Ano Letivo:</strong> <span>{new Date().getFullYear()}</span></div>
            <div><strong>{t("shift")}:</strong> <span>{t("shift" + shift.charAt(0).toUpperCase() + shift.slice(1))}</span></div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-container">
        {/* BARRA DE ESTATÍSTICAS */}
        <section className="stats-bar no-print">
          <div className="stat-card">
            <div className="stat-icon bg-indigo-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">{t("totalClasses")}</span>
              <span className="stat-value">{stats.totalAulas}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon bg-emerald-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">{t("uniqueSubjects")}</span>
              <span className="stat-value">{stats.disciplinasUnicas}</span>
            </div>
          </div>

          <div className="stat-card stat-card-wide">
            <div className="stat-icon bg-amber-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">{t("uniqueGrades")}</span>
              <span className="stat-value">{stats.turmasUnicas}</span>
            </div>
          </div>

          {/* CONTROLES */}
          <div className="view-controls">
            <label className="toggle-control" title="Exibir ou ocultar sábado na grade">
              <input
                type="checkbox"
                id="chkShowSaturday"
                checked={showSaturday}
                onChange={(e) => {
                  const val = e.target.checked;
                  setShowSaturday(val);
                  saveState({ showSaturday: val });
                }}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">{t("showSaturday")}</span>
            </label>
            <button
              id="btnClearSchedule"
              className="btn btn-ghost-danger btn-sm"
              onClick={() => setConfirmClearOpen(true)}
              title="Limpar todos os horários cadastrados"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>{t("confirmClear").replace("?", "")}</span>
            </button>
          </div>
        </section>

        {/* TABELA / GRADE DE HORÁRIOS */}
        <div className="schedule-table-card">
          <div className="table-responsive">
            <table className="schedule-table" id="scheduleTable">
              <thead>
                <tr>
                  <th className="col-time">Horário</th>
                  {visibleDays.map((d) => (
                    <th key={d.id} data-day={d.id} className="day-col">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentSlots.map((slot) => {
                  if (slot.isBreak) {
                    return (
                      <tr key={slot.id} className="row-break">
                        <td className="slot-time-col">
                          <span className="time-badge">{slot.start} - {slot.end}</span>
                        </td>
                        <td colSpan={visibleDays.length} className="slot-break-cell">
                          <span>☕ {slot.label}</span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.id} className="row-class">
                      <td className="slot-time-col">
                        <span className="slot-label-text">{slot.label}</span>
                        <span className="time-badge">{slot.start} - {slot.end}</span>
                      </td>
                      {visibleDays.map((d) => {
                        const key = buildSlotKey(d.id, slot.id);
                        const aula = schedule[key];

                        if (aula && aula.subject) {
                          return (
                            <td
                              key={key}
                              className="slot-cell filled-slot"
                              style={{ borderLeftColor: aula.color || "#4f46e5" }}
                              onClick={() => handleSlotClick(d.id, slot)}
                            >
                              <div className="class-card-content">
                                <div className="card-top-row">
                                  <strong className="class-subject" style={{ color: aula.color || "#4f46e5" }}>
                                    {aula.subject}
                                  </strong>
                                </div>
                                <div className="card-badges">
                                  {aula.grade && <span className="badge-grade">{aula.grade}</span>}
                                  {aula.room && <span className="badge-room">📍 {aula.room}</span>}
                                </div>
                                {aula.notes && <p className="class-notes">{aula.notes}</p>}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={key}
                            className="slot-cell empty-slot"
                            onClick={() => handleSlotClick(d.id, slot)}
                          >
                            <span className="add-hint">+</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DICA */}
        <div className="hint-banner no-print">
          <div className="hint-icon">💡</div>
          <div className="hint-text">
            <strong>Dica:</strong> Clique em qualquer horário vazio para adicionar sua aula (disciplina, turma e sala). Clique em uma aula cadastrada para editar ou excluir. Tudo é salvo automaticamente!
          </div>
        </div>
      </main>

      {/* RODAPÉ PARA IMPRESSÃO */}
      <footer className="print-footer only-print">
        <div className="print-signature-row">
          <div className="signature-line">
            <div className="line"></div>
            <span>Assinatura do(a) Professor(a)</span>
          </div>
          <div className="signature-line">
            <div className="line"></div>
            <span>Coordenação Pedagógica / Direção</span>
          </div>
        </div>
        <div className="print-timestamp">
          Documento gerado em {new Date().toLocaleDateString("pt-BR")} pelo app Meu Horário Escolar — RotinaDocente.
        </div>
      </footer>

      {/* MODAL 1: ADICIONAR / EDITAR AULA */}
      {slotModalOpen && activeSlotData && (
        <div className="app-dialog-backdrop" onClick={() => setSlotModalOpen(false)}>
          <div className="app-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-header">
                <div className="dialog-title-wrapper">
                  <div className="dialog-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="dialog-title">
                      {schedule[buildSlotKey(activeSlotData.dayId, activeSlotData.slotId)]
                        ? t("quickEdit")
                        : "Adicionar Aula"}
                    </h2>
                    <p className="dialog-subtitle">
                      {DAYS.find((d) => d.id === activeSlotData.dayId)?.label} • {activeSlotData.slotLabel} ({activeSlotData.slotTime})
                    </p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setSlotModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSaveSlot}>
                <div className="form-group">
                  <label>{t("subject")} <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Ex: Matemática, Português, História..."
                  />
                  {/* Sugestões de Disciplinas */}
                  <div className="quick-tags">
                    {COMMON_SUBJECTS.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className="tag-pill"
                        onClick={() => {
                          setFormSubject(s.name);
                          setFormColor(s.color);
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col-6">
                    <label>{t("grade")} <span className="required">*</span></label>
                    <input
                      type="text"
                      required
                      value={formGrade}
                      onChange={(e) => setFormGrade(e.target.value)}
                      placeholder="Ex: 1º Ano A, 3º EM..."
                    />
                  </div>
                  <div className="form-group col-6">
                    <label>{t("room")}</label>
                    <input
                      type="text"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      placeholder="Ex: Sala 12, Lab..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("color")}</label>
                  <div className="color-palette">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch ${formColor === c ? "active" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormColor(c)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("notes")}</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ex: Trazer material para experimento..."
                  />
                </div>

                {/* Replicar para outros dias */}
                <div className="form-group replication-box">
                  <label className="font-medium">Replicar esta aula para outros dias neste mesmo horário:</label>
                  <div className="replicate-days-row">
                    {visibleDays.map((d) => (
                      <label key={d.id} className="rep-chip">
                        <input
                          type="checkbox"
                          checked={replicateDays.includes(d.id)}
                          disabled={d.id === activeSlotData.dayId}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReplicateDays([...replicateDays, d.id]);
                            } else {
                              setReplicateDays(replicateDays.filter((x) => x !== d.id));
                            }
                          }}
                        />{" "}
                        {d.short}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="dialog-actions">
                  {schedule[buildSlotKey(activeSlotData.dayId, activeSlotData.slotId)] && (
                    <button
                      type="button"
                      className="btn btn-danger-ghost"
                      onClick={handleDeleteSlot}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span>{t("remove")}</span>
                    </button>
                  )}
                  <div className="actions-right" style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setSlotModalOpen(false)}>
                      {t("cancel")}
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {t("save")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIGURAÇÃO DE HORÁRIOS */}
      {configModalOpen && (
        <div className="app-dialog-backdrop" onClick={() => setConfigModalOpen(false)}>
          <div className="app-dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-header">
                <div className="dialog-title-wrapper">
                  <div className="dialog-icon bg-indigo-soft">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h2 className="dialog-title">Configurar Horários e Intervalos</h2>
                    <p className="dialog-subtitle">Personalize a ordem, nome e tempo de cada aula do turno</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setConfigModalOpen(false)}>✕</button>
              </div>

              <div className="config-body">
                <div className="preset-buttons-row">
                  <span className="text-sm font-semibold">Carregar Padrão:</span>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => handleLoadPresetConfig("manha")}>
                    {t("shiftManha")}
                  </button>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => handleLoadPresetConfig("tarde")}>
                    {t("shiftTarde")}
                  </button>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => handleLoadPresetConfig("noite")}>
                    {t("shiftNoite")}
                  </button>
                  <button type="button" className="btn btn-xs btn-outline" onClick={() => handleLoadPresetConfig("integral")}>
                    {t("shiftIntegral")}
                  </button>
                </div>

                <div className="slots-list-header">
                  <span>Tipo</span>
                  <span>Nome / Descrição</span>
                  <span>Início</span>
                  <span>Término</span>
                  <span className="text-right">Ação</span>
                </div>

                <div className="slots-list-container">
                  {tempSlots.map((s, idx) => (
                    <div key={s.id} className="slot-config-row" style={{ display: "grid", gridTemplateColumns: "100px 1fr 100px 100px 60px", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span className={`badge-type ${s.isBreak ? "badge-break" : "badge-class"}`} style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: s.isBreak ? "#fef3c7" : "#e0e7ff", color: s.isBreak ? "#92400e" : "#3730a3" }}>
                        {s.isBreak ? "☕ Intervalo" : "📖 Aula"}
                      </span>
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => {
                          const next = [...tempSlots];
                          next[idx].label = e.target.value;
                          setTempSlots(next);
                        }}
                        style={{ padding: "0.3rem 0.5rem", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                      />
                      <input
                        type="time"
                        value={s.start}
                        onChange={(e) => {
                          const next = [...tempSlots];
                          next[idx].start = e.target.value;
                          setTempSlots(next);
                        }}
                        style={{ padding: "0.3rem 0.5rem", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                      />
                      <input
                        type="time"
                        value={s.end}
                        onChange={(e) => {
                          const next = [...tempSlots];
                          next[idx].end = e.target.value;
                          setTempSlots(next);
                        }}
                        style={{ padding: "0.3rem 0.5rem", border: "1px solid var(--border-color)", borderRadius: "4px" }}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost-danger btn-xs"
                        onClick={() => handleRemoveTempSlot(idx)}
                        title="Excluir horário"
                        style={{ color: "var(--danger)" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-slot-row" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleAddTempSlot(false)}>
                    + Adicionar Aula
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => handleAddTempSlot(true)}>
                    ☕ Adicionar Intervalo
                  </button>
                </div>
              </div>

              <div className="dialog-actions config-actions-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setConfigModalOpen(false)}>
                  {t("cancel")}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveConfigModal}>
                  {t("save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BACKUP / SINCRONIZAÇÃO */}
      {backupModalOpen && (
        <div className="app-dialog-backdrop" onClick={() => setBackupModalOpen(false)}>
          <div className="app-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-header">
                <div className="dialog-title-wrapper">
                  <div className="dialog-icon bg-emerald-soft">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </div>
                  <div>
                    <h2 className="dialog-title">Backup e Sincronização</h2>
                    <p className="dialog-subtitle">Exporte seu horário em arquivo ou restaure um backup</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setBackupModalOpen(false)}>✕</button>
              </div>

              <div className="backup-body">
                <div className="backup-card">
                  <div className="backup-card-info">
                    <h3 className="font-semibold">{t("exportJson")}</h3>
                    <p className="text-sm text-muted">Baixe um arquivo JSON com todas as suas aulas e configurações.</p>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleExportJson}>
                    {t("exportJson")}
                  </button>
                </div>

                <div className="backup-card" style={{ marginTop: "1rem" }}>
                  <div className="backup-card-info">
                    <h3 className="font-semibold">{t("importJson")}</h3>
                    <p className="text-sm text-muted">Carregue um arquivo previamente exportado para restaurar a grade.</p>
                  </div>
                  <label className="btn btn-outline file-input-label" style={{ cursor: "pointer" }}>
                    <span>{t("importJson")}</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleImportJsonFile}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div className="dialog-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setBackupModalOpen(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAÇÃO DE LIMPEZA */}
      {confirmClearOpen && (
        <div className="app-dialog-backdrop" onClick={() => setConfirmClearOpen(false)}>
          <div className="app-dialog dialog-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-content">
              <div className="dialog-header">
                <div className="dialog-title-wrapper">
                  <div className="dialog-icon bg-danger-soft">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="dialog-title">{t("confirmClear")}</h2>
                    <p className="dialog-subtitle">Esta ação apagará todas as aulas cadastradas na grade</p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setConfirmClearOpen(false)}>✕</button>
              </div>

              <div className="confirm-body">
                <p>Tem certeza de que deseja apagar todas as aulas da sua grade horária? Você terá uma grade em branco pronta para novo preenchimento.</p>
              </div>

              <div className="dialog-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmClearOpen(false)}>
                  {t("cancel")}
                </button>
                <button type="button" className="btn btn-danger-solid" onClick={handleExecuteClear}>
                  Sim, Limpar Toda a Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST FLUTUANTE */}
      {toastMsg && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl bg-slate-900 text-white font-medium text-sm flex items-center gap-2"
          role="status"
        >
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
