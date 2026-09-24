"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { generatePDF } from '@/lib/redacao/pdf-generator';
import { gerarLoginAluno, gerarLoginKey } from '@/utils/diario/loginAluno';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { vincularAlunoProfessor } from '@/lib/firebase-aluno';
import { extractTextFromPDF } from '@/utils/atividades/pdfExtractor';
import { extractTextFromDocx } from '@/utils/atividades/docxExtractor';
import { useTurmas } from '@/hooks/diario/useTurmas';
import { turmasIniciais } from '@/data/diario/turmasIniciais';
import { getClientAIHeaders } from '@/utils/aiHeaders';
import {
  ArrowLeft, GraduationCap, ExternalLink, Copy, Check,
  FileText, Sparkles, Download, User, BookOpen,
  Zap, Camera, Loader2, Trash2, RefreshCw, BarChart3,
  ChevronRight, PenTool, Clock, Target, Shield,
  LayoutDashboard, History, LogOut, Menu, X
} from 'lucide-react';
import { usePathname } from 'next/navigation';

// ─── TOKENS ──────────────────────────────────────
const EASE_EXPO = [0.19, 1, 0.22, 1];
const EASE_OUT = [0.16, 1, 0.3, 1];
const EASE_SPRING = { type: "spring", stiffness: 300, damping: 24 };

function cleanFeedbackText(text) {
  if (!text) return '';
  // Remove blocos de código JSON com code-fence
  let cleaned = text.replace(/```json[\s\S]*?```/g, '');
  // Remove também blocos JSON brutos no final (sem code-fence)
  // Procura o último { que contenha c1/c2 para remover o bloco de notas
  const lastBrace = cleaned.lastIndexOf('{');
  if (lastBrace !== -1) {
    const tail = cleaned.slice(lastBrace);
    if (/"c[1-5]"/.test(tail)) {
      cleaned = cleaned.slice(0, lastBrace);
    }
  }
  return cleaned.trim();
}

const COMPETENCIAS = [
  { id: 'c1', label: 'C1 — Domínio da escrita formal', color: '#ef4444', bg: '#fef2f2', bar: '#fca5a5' },
  { id: 'c2', label: 'C2 — Compreensão da proposta', color: '#f97316', bg: '#fff7ed', bar: '#fdba74' },
  { id: 'c3', label: 'C3 — Seleção de argumentos', color: '#eab308', bg: '#fefce8', bar: '#fde047' },
  { id: 'c4', label: 'C4 — Mecanismos linguísticos', color: '#22c55e', bg: '#f0fdf4', bar: '#86efac' },
  { id: 'c5', label: 'C5 — Proposta de intervenção', color: '#3b82f6', bg: '#eff6ff', bar: '#93c5fd' },
];

const DEPTH_OPTIONS = [
  { value: 'basic', label: 'Básico', desc: 'Nota + justificativa curta', words: '400' },
  { value: 'analyzed', label: 'Analítico', desc: 'Nota + erros + checklist', words: '900' },
  { value: 'deep', label: 'Profundo', desc: 'Análise exaustiva + reescrita', words: '1200+' },
];

const stepTransition = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -16, filter: 'blur(4px)' },
  transition: { duration: 0.5, ease: EASE_EXPO }
};

const staggerItem = (i) => ({
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay: 0.08 + i * 0.06, duration: 0.45, ease: EASE_OUT }
});

function AnimatedCounter({ value, color }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = value || 0;
    if (target === 0) { setDisplay(0); return; }
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className="tabular-nums" style={{ color }}>{display}</span>;
}

// ─── COMPONENT ───────────────────────────────────
const STORAGE_KEY = 'diario_turmas';
const USER_KEY = 'diario_userId';

const carregarLocal = () => {
  try { const raw = sessionStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return null;
};

const salvarLocal = (turmas, timestamp = null) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(turmas));
    sessionStorage.setItem(STORAGE_KEY + '_lastUpdated', String(timestamp || Date.now()));
  } catch { /* ignora */ }
};

export default function RedacaoPage() {
  const { user, perfil, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);
  const motivatorFileRef = useRef(null);

  const [initialTurmas, setInitialTurmas] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });
  const [loadingTurmas, setLoadingTurmas] = useState(true);

  // Carrega do Firestore se sessionStorage estiver vazio, ou sync em background
  useEffect(() => {
    if (authLoading) return; // Aguarda o carregamento do estado de autenticação
    if (!user) {
      setLoadingTurmas(false);
      return;
    }

    (async () => {
      try {
        const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem(USER_KEY) : null;
        const isSameUser = storedUserId === user.uid;
        const local = isSameUser ? carregarLocal() : null;

        const ref = doc(db, 'professores', user.uid, 'turmas', 'data');
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().turmas?.length > 0) {
          const cloud = snap.data().turmas;
          const cloudTime = snap.data().lastUpdated || 0;
          const localTime = typeof window !== 'undefined' ? Number(sessionStorage.getItem(STORAGE_KEY + '_lastUpdated')) || 0 : 0;

          if (cloudTime >= localTime || !local) {
            setInitialTurmas(cloud);
            salvarLocal(cloud, cloudTime);
          } else {
            setInitialTurmas(local);
            await setDoc(ref, { turmas: local, lastUpdated: localTime }, { merge: true });
          }
          if (typeof window !== 'undefined') sessionStorage.setItem(USER_KEY, user.uid);
        } else {
          // Sem dados no Firestore nem sessionStorage: migra do caminho antigo ou usa padrão
          const oldRef = doc(db, 'users', user.uid, 'turmas', 'data');
          const oldSnap = await getDoc(oldRef);
          if (oldSnap.exists() && oldSnap.data().turmas?.length > 0) {
            const oldData = oldSnap.data().turmas;
            await setDoc(ref, { turmas: oldData, lastUpdated: Date.now() }, { merge: true });
            setInitialTurmas(oldData);
            salvarLocal(oldData);
          } else {
            // Tenta do outro caminho antigo (campo turmas no próprio perfil do professor)
            const profRef = doc(db, 'professores', user.uid);
            const profSnap = await getDoc(profRef);
            if (profSnap.exists() && profSnap.data().turmas?.length > 0) {
              const oldData = profSnap.data().turmas;
              await setDoc(ref, { turmas: oldData, lastUpdated: Date.now() }, { merge: true });
              setInitialTurmas(oldData);
              salvarLocal(oldData);
            } else if (local && local.length > 0) {
              setInitialTurmas(local);
            } else {
              setInitialTurmas([]);
              salvarLocal([]);
            }
          }
          if (typeof window !== 'undefined') sessionStorage.setItem(USER_KEY, user.uid);
        }
      } catch (e) {
        console.error('Erro ao carregar turmas:', e);
        // Fallback local caso haja falha de rede/conexão para o mesmo usuário
        const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem(USER_KEY) : null;
        if (storedUserId === user.uid) {
          const local = carregarLocal();
          if (local) setInitialTurmas(local);
        }
      } finally {
        setLoadingTurmas(false);
      }
    })();
  }, [user, authLoading]);

  const { turmas } = useTurmas(initialTurmas || [], () => {});

  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [modoAluno, setModoAluno] = useState('lista'); // 'lista' | 'manual'

  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [essayTheme, setEssayTheme] = useState('');
  const [motivatorText, setMotivatorText] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [depth, setDepth] = useState('analyzed');
  const [selectedBimestre, setSelectedBimestre] = useState(1);
  const [selectedCompetencies, setSelectedCompetencies] = useState(['c1', 'c2', 'c3', 'c4', 'c5']);
  const [step, setStep] = useState('input');
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState(null);
  const [correctionId, setCorrectionId] = useState(null);
  const [error, setError] = useState('');
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);
  const [alunoLinkCopied, setAlunoLinkCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [motivatorExtracting, setMotivatorExtracting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setCharCount(text.length); }, [text]);

  if (authLoading || loadingTurmas || (!perfil && user)) {
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc]"><div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-violet-400 animate-pulse shadow-2xl shadow-violet-500/20" /></div>;
  }
  if (!user) { router.replace('/'); return null; }
  if (!perfil?.modulos_permitidos?.includes('redacao-corretor')) { router.replace('/'); return null; }

  const toggleCompetency = (id) => setSelectedCompetencies(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const name = file.name.toLowerCase();
    
    // 0. Arquivos Word (.docx)
    if (name.endsWith('.docx')) {
      setExtracting(true);
      try {
        const extractedText = await extractTextFromDocx(file);
        if (!extractedText.trim()) {
          throw new Error('Nenhum texto pôde ser extraído deste documento Word.');
        }
        setText(extractedText);
        setStep('review');
      } catch (err) {
        setError('Erro ao extrair texto do documento Word: ' + err.message);
      } finally {
        setExtracting(false);
      }
      return;
    }

    // 1. Arquivos PDF
    if (name.endsWith('.pdf')) {
      setExtracting(true);
      try {
        const extractedText = await extractTextFromPDF(file);
        if (!extractedText.trim()) {
          throw new Error('Nenhum texto pôde ser extraído deste PDF. Certifique-se de que não é um PDF composto exclusivamente por imagens escaneadas.');
        }
        setText(extractedText);
        setStep('review');
      } catch (err) {
        setError('Erro ao extrair texto do PDF: ' + err.message);
      } finally {
        setExtracting(false);
      }
      return;
    }

    // 2. Arquivos de Texto (.txt)
    if (name.endsWith('.txt')) {
      try {
        const textContent = await file.text();
        setText(textContent);
        setStep('review');
      } catch (err) {
        setError('Erro ao ler arquivo de texto: ' + err.message);
      }
      return;
    }

    // 3. Imagens HEIC (converter para JPG)
    if (name.endsWith('.heic')) {
      try {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        const reader = new FileReader();
        reader.onload = () => { setImageBase64(reader.result.split(',')[1]); setImagePreview(reader.result); };
        reader.readAsDataURL(blob);
      } catch (err) { setError('Erro ao converter HEIC: ' + err.message); }
      return;
    }

    // 4. Imagens padrão (JPG, PNG, etc.)
    const reader = new FileReader();
    reader.onload = () => { setImageBase64(reader.result.split(',')[1]); setImagePreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleMotivatorFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const name = file.name.toLowerCase();

    // 0. Arquivos Word (.docx)
    if (name.endsWith('.docx')) {
      setMotivatorExtracting(true);
      try {
        const extractedText = await extractTextFromDocx(file);
        if (!extractedText.trim()) {
          throw new Error('Nenhum texto pôde ser extraído deste documento Word.');
        }
        setMotivatorText(extractedText);
      } catch (err) {
        setError('Erro ao extrair texto do Word motivador: ' + err.message);
      } finally {
        setMotivatorExtracting(false);
      }
      return;
    }

    // 1. Arquivos PDF
    if (name.endsWith('.pdf')) {
      setMotivatorExtracting(true);
      try {
        const extractedText = await extractTextFromPDF(file);
        if (!extractedText.trim()) {
          throw new Error('Nenhum texto pôde ser extraído deste PDF. Certifique-se de que não é um PDF composto exclusivamente por imagens escaneadas.');
        }
        setMotivatorText(extractedText);
      } catch (err) {
        setError('Erro ao extrair texto do PDF motivador: ' + err.message);
      } finally {
        setMotivatorExtracting(false);
      }
      return;
    }

    // 2. Arquivos de Texto (.txt)
    if (name.endsWith('.txt')) {
      try {
        const textContent = await file.text();
        setMotivatorText(textContent);
      } catch (err) {
        setError('Erro ao ler arquivo de texto motivador: ' + err.message);
      }
      return;
    }

    // 3. Imagens (requerem OCR via API)
    setMotivatorExtracting(true);
    try {
      let activeBlob = file;
      if (name.endsWith('.heic')) {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        activeBlob = Array.isArray(converted) ? converted[0] : converted;
      }
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        try {
          const res = await fetch('/api/extrair', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getClientAIHeaders(),
            },
            body: JSON.stringify({ imageBase64: base64Data, mediaType: 'image/jpeg' })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || data.error);
          setMotivatorText(data.text);
        } catch (err) {
          setError('Erro ao extrair texto da imagem do motivador: ' + err.message);
        } finally {
          setMotivatorExtracting(false);
        }
      };
      reader.readAsDataURL(activeBlob);
    } catch (err) {
      setError('Erro ao processar imagem do motivador: ' + err.message);
      setMotivatorExtracting(false);
    }
  };

  const handleExtract = async () => {
    if (!imageBase64) return;
    setExtracting(true); setError('');
    try {
      const res = await fetch('/api/extrair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClientAIHeaders(),
        },
        body: JSON.stringify({ imageBase64, mediaType: 'image/jpeg' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setText(data.text);
      setStep('review');
    } catch (err) { setError('Erro ao extrair texto: ' + err.message); }
    finally { setExtracting(false); }
  };

  const handleCorrect = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setError('Cole ou extraia o texto da redação.'); return; }
    if (!studentName.trim()) { setError('Informe o nome do aluno.'); return; }
    setStep('correcting'); setError('');

    const dn = dataNascimento.replace(/\D/g, '').slice(0, 4);
    let loginAluno = null;
    if (dn.length === 4) {
      loginAluno = gerarLoginAluno(studentName.trim(), dn);
    }

    try {
      const res = await fetch('/api/corrigir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getClientAIHeaders(),
        },
        body: JSON.stringify({
          text: trimmed,
          studentName: studentName.trim(),
          studentClass: studentClass.trim() || 'N/A',
          essayTheme: essayTheme.trim() || 'Geral',
          depth,
          competencies: selectedCompetencies.join(', '),
          userId: user.uid,
          loginAluno,
          nomeProfessor: perfil?.nome || user?.displayName || '',
          motivatorText: motivatorText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      // Determinar o ID da correção client-side para usar o token autenticado do Firebase
      let corrId;
      if (loginAluno) {
        corrId = await gerarLoginKey(loginAluno);

        await vincularAlunoProfessor({
          login: loginAluno,
          nome: studentName.trim(),
          professorUid: user.uid,
          turmaId: studentClass.trim() || 'N/A',
          modulo: 'redacao',
          nomeProfessor: perfil?.nome || user?.displayName || ''
        });
      } else {
        const a = Math.random().toString(36).substring(2, 5).toUpperCase();
        const b = Math.random().toString(36).substring(2, 5).toUpperCase();
        corrId = `${a}-${b}`;
      }

      const corrData = {
        id: corrId,
        studentName: studentName.trim(),
        studentClass: studentClass.trim() || 'N/A',
        essayTheme: essayTheme.trim() || 'Geral',
        bimestre: Number(selectedBimestre),
        motivatorText: motivatorText.trim(),
        result: data.result || '',
        scoreData: data.scores?.items || [],
        totalScore: data.scores?.total || 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      };
      if (loginAluno) {
        corrData.loginAluno = loginAluno;
      }

      // Salva a correção no Firestore usando o usuário logado
      const corrRef = doc(db, 'professores', user.uid, 'correcoes', corrId);
      await setDoc(corrRef, corrData);

      setResult(data.result);
      setScores(data.scores);
      setCorrectionId(loginAluno || corrId);
      setStep('result');
    } catch (err) { setError('Erro na correção: ' + err.message); setStep('review'); }
  };

  const handleReset = () => {
    setStep('input'); setText(''); setImageBase64(null); setImagePreview(null);
    setResult(null); setScores(null); setCorrectionId(null); setError('');
    setStudentName(''); setStudentClass(''); setEssayTheme(''); setMotivatorText(''); setDataNascimento('');
    setTurmaSelecionada(null); setAlunoSelecionado(null); setModoAluno('lista');
    setSelectedBimestre(1);
  };

  const handleExportPDF = () => {
    if (result) generatePDF(result, studentName, studentClass, essayTheme,
      scores?.items || COMPETENCIAS.map(c => ({ subject: c.label.split(' ')[0], A: 0, fullMark: 200 })));
  };

  const totalScore = scores?.total || (scores?.items?.reduce((s, i) => s + i.A, 0) ?? null);

  const handleSelectAluno = (aluno) => {
    if (!aluno) {
      setAlunoSelecionado(null);
      setStudentName('');
      setDataNascimento('');
      return;
    }
    setAlunoSelecionado(aluno);
    setStudentName(aluno.nome);
    setDataNascimento(aluno.dataNascimento || '');
    if (turmaSelecionada) {
      const t = turmas.find(t => t.id === turmaSelecionada);
      if (t) setStudentClass(t.nome);
    }
  };

  const turmaAtual = turmaSelecionada
    ? turmas.find(t => t.id === turmaSelecionada) : null;
  const alunosDaTurma = turmaAtual?.alunos || [];

  const sidebarItems = [
    { label: 'Nova Correção', icon: History, action: handleReset },
    { label: 'Minhas Correções', icon: LayoutDashboard, href: '/redacao/desempenho' },
    { label: 'Critérios INEP', icon: BookOpen, href: '/redacao/criterios' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-[#f8fafc]"
      style={{
        backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99,102,241,0.06), transparent), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(99,102,241,0.03), transparent)',
      }}>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`fixed inset-y-0 left-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 w-64 flex-shrink-0 bg-white border-r border-[#dce0f0] flex flex-col h-full font-sans`}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 border-b border-[#dce0f0] flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left">
            <div className="w-8 h-8 rounded-xl bg-[#f60c49] flex items-center justify-center shadow-sm text-white">
              <Zap size={16} color="white" />
            </div>
            <div>
              <span className="font-head font-extrabold text-[#101942] tracking-tight text-sm block leading-none">
                Redação ENEM
              </span>
              <p className="text-[10px] text-[#6070a0] font-medium mt-0.5">Correção Pedagógica</p>
            </div>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-[#6070a0] hover:text-[#101942] hover:bg-[#eef0f8] transition-all" aria-label="Fechar menu">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-[#dce0f0] bg-[#f7f8fc]/50">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-xl border border-[#dce0f0]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#fff2f6] border border-[#fde4ec] flex items-center justify-center text-[#d40840] font-extrabold text-xs">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#101942] truncate">{user?.displayName || 'Professor'}</p>
              <p className="text-[10px] text-[#6070a0] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item, idx) => {
            const Icon = item.icon;
            const isNova = item.label === 'Nova Correção';
            return item.href ? (
              <a
                key={idx}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#101942] hover:bg-[#f7f8fc] hover:text-[#f60c49] transition-all"
              >
                <Icon size={16} className="text-[#6070a0]" />
                {item.label}
              </a>
            ) : (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isNova
                    ? 'bg-[#fff2f6] text-[#d40840] border border-[#fde4ec] shadow-2xs'
                    : 'text-[#101942] hover:bg-[#f7f8fc]'
                }`}
              >
                <Icon size={16} className={isNova ? 'text-[#f60c49]' : 'text-[#6070a0]'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-2">
          {/* Student link dropdown */}
          <div className="relative">
            <button onClick={() => setShowAlunoDropdown(!showAlunoDropdown)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all duration-200">
              <GraduationCap size={17} className="text-slate-400" />
              Portal do Aluno
              <ExternalLink size={11} className="ml-auto text-slate-300" />
            </button>
            {showAlunoDropdown && (
              <div className="absolute left-0 bottom-full mb-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden animate-card-in">
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/redacao/aluno`); setAlunoLinkCopied(true); setTimeout(() => setAlunoLinkCopied(false), 2000); setShowAlunoDropdown(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  {alunoLinkCopied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                  {alunoLinkCopied ? 'Copiado!' : 'Copiar link'}
                </button>
                <div className="border-t border-slate-100" />
                <a href="/redacao/aluno" target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <ExternalLink size={15} /> Abrir em nova aba
                </a>
              </div>
            )}
          </div>

          <button onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200">
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <button onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200/50 hover:border-violet-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Hub</span>
            </button>
          </div>
          {step !== 'input' && (
            <button onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-violet-600 transition-colors duration-300">
              <RefreshCw size={13} /> Nova correção
            </button>
          )}
          <div className="flex-1" />
          {step === 'result' && result && (
            <button onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/60 transition-all duration-300 shadow-sm">
              <Download size={16} /> PDF
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto w-full px-4 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {/* ══════ INPUT ══════ */}
          {step === 'input' && (
            <motion.div key="input" {...stepTransition} className="space-y-4 sm:space-y-5">
              {/* Hero */}
              <motion.div className="text-center mb-4 sm:mb-6 flex flex-col items-center"
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_EXPO }}>
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-500 flex items-center justify-center shadow-xl sm:shadow-2xl shadow-violet-500/25 mb-2 sm:mb-4 ring-2 sm:ring-4 ring-violet-50">
                  <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-[2rem] font-black text-slate-900 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  Redação <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-500">Corrigida</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2 max-w-sm mx-auto leading-relaxed px-4">
                  Correção por IA seguindo as 5 competências oficiais do INEP
                </p>
              </motion.div>

              {/* Correção Config */}
              <motion.div {...staggerItem(0)}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><Target size={15} className="text-amber-500" /></div>
                  <h3 className="text-sm font-bold text-slate-800">Configuração da Correção</h3>
                </div>

                {/* Depth */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {DEPTH_OPTIONS.map(opt => (
                    <motion.button key={opt.value} onClick={() => setDepth(opt.value)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className={`relative p-2 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-300 overflow-hidden group flex flex-col justify-between h-full
                        ${depth === opt.value ? 'bg-violet-50 border-violet-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'}`}>
                      {depth === opt.value && <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />}
                      <div className="w-full">
                        <span className={`relative text-[11px] sm:text-xs font-bold block mb-0.5 sm:mb-1 ${depth === opt.value ? 'text-violet-700' : 'text-slate-700'}`}>{opt.label}</span>
                        <p className="relative text-[9px] sm:text-[10px] text-slate-400 leading-tight line-clamp-2 sm:line-clamp-none">{opt.desc}</p>
                      </div>
                      <span className="relative text-[9px] sm:text-[10px] text-slate-400 mt-1.5 sm:mt-2 block font-mono">~{opt.words} pal.</span>
                    </motion.button>
                  ))}
                </div>

                {/* Competency pills */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Competências</p>
                  <div className="flex flex-wrap gap-2">
                    {COMPETENCIAS.map(c => {
                      const active = selectedCompetencies.includes(c.id);
                      return (
                        <motion.button key={c.id} onClick={() => toggleCompetency(c.id)}
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border
                            ${active ? 'shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          style={active ? { color: c.color, backgroundColor: c.bg, borderColor: c.bar } : {}}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.label.split(' ')[0]}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Turma + Aluno Selector */}
              <motion.div {...staggerItem(1)}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
                {/* Turma selector */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Turma</label>
                    <select value={turmaSelecionada || ''} onChange={e => {
                      const tid = e.target.value;
                      setTurmaSelecionada(tid || null);
                      setAlunoSelecionado(null);
                      if (tid) {
                        const t = turmas.find(t => t.id === tid);
                        if (t) setStudentClass(t.nome);
                      } else {
                        setStudentClass('');
                      }
                      if (modoAluno === 'lista') { setStudentName(''); setDataNascimento(''); }
                    }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300">
                      <option value="">Selecionar turma...</option>
                      {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.nome} ({t.alunos.length} alunos)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bimestre</label>
                    <select value={selectedBimestre} onChange={e => setSelectedBimestre(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300">
                      {[1, 2, 3, 4].map(b => (
                        <option key={b} value={b}>{b}º Bimestre</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Aluno</label>
                    {turmaSelecionada && alunosDaTurma.length > 0 ? (
                      <select value={alunoSelecionado?.id || ''} onChange={e => {
                        const aid = e.target.value;
                        if (aid === '__manual__') {
                          setModoAluno('manual');
                          setAlunoSelecionado(null);
                          setStudentName('');
                          setDataNascimento('');
                        } else if (aid) {
                          setModoAluno('lista');
                          const al = alunosDaTurma.find(a => a.id === aid);
                          handleSelectAluno(al);
                        } else {
                          setAlunoSelecionado(null);
                          setStudentName('');
                          setDataNascimento('');
                        }
                      }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300">
                        <option value="">Selecionar aluno...</option>
                        {alunosDaTurma.map(a => (
                          <option key={a.id} value={a.id}>{a.nome} {a.dataNascimento ? '(nasc: ' + a.dataNascimento + ')' : ''}</option>
                        ))}
                        <option value="__manual__">✎ Digitar manualmente...</option>
                      </select>
                    ) : (
                      <p className="text-xs text-slate-400 pt-2.5">
                        {turmaSelecionada ? 'Turma sem alunos cadastrados.' : 'Selecione uma turma primeiro.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tema</label>
                    <input value={essayTheme} onChange={e => setEssayTheme(e.target.value)}
                      placeholder="Ex: Desafios da IA..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300" />
                  </div>
                </div>

                {/* Texto Motivador */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Texto Motivador (Opcional - Usado para cruzar e verificar plágio)</label>
                    <button type="button" onClick={() => motivatorFileRef.current?.click()} className="text-xs text-violet-600 hover:text-violet-500 font-semibold flex items-center gap-1">
                      {motivatorExtracting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Processando...
                        </>
                      ) : (
                        <>
                          <Download size={12} className="rotate-180" /> Importar arquivo...
                        </>
                      )}
                    </button>
                    <input ref={motivatorFileRef} type="file" accept="image/*,.heic,.HEIC,.pdf,.txt,.docx" className="hidden" onChange={handleMotivatorFilePick} />
                  </div>
                  <textarea value={motivatorText} onChange={e => setMotivatorText(e.target.value)}
                    lang="pt-BR"
                    placeholder={motivatorExtracting ? "Extraindo texto do arquivo enviado..." : "Cole aqui ou importe um arquivo com o texto motivador da redação..."}
                    disabled={motivatorExtracting}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300 resize-y" />
                </div>

                {/* Nome + Nascimento (manual mode ou auto-preenchido) */}
                {modoAluno === 'manual' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Aluno *</label>
                      <input value={studentName} onChange={e => setStudentName(e.target.value)}
                        placeholder="MARIA SILVA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nascimento (ddmm)</label>
                      <input value={dataNascimento} onChange={e => setDataNascimento(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="0704" maxLength={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-300 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300 font-mono" />
                      <p className="text-[10px] text-slate-400 mt-1">Login: {studentName.trim() && dataNascimento.length === 4 ? <span className="font-mono text-violet-500 font-semibold">{studentName.trim().split(' ')[0].toLowerCase()}{dataNascimento}</span> : <span className="text-slate-300">—</span>}</p>
                    </div>
                  </div>
                )}

                {/* Aluno selecionado da lista — info resumo */}
                {modoAluno === 'lista' && alunoSelecionado && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700"><User size={14} className="text-violet-400" /> {alunoSelecionado.nome}</span>
                    {alunoSelecionado.dataNascimento && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
                        <Shield size={12} /> Login: {alunoSelecionado.nome.split(' ')[0].toLowerCase()}{alunoSelecionado.dataNascimento}
                      </span>
                    )}
                    {studentClass && <span className="text-xs text-slate-400">Turma {studentClass}</span>}
                    {!alunoSelecionado.dataNascimento && <span className="text-xs text-amber-500">⚠ Sem data de nascimento — login não será gerado</span>}
                  </div>
                )}
              </motion.div>

              {/* Upload Zone */}
              <motion.div {...staggerItem(2)}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center"><FileText size={15} className="text-violet-500" /></div>
                  <h3 className="text-sm font-bold text-slate-800">Redação</h3>
                  {text && <span className="ml-auto text-[11px] text-slate-400 font-mono tabular-nums">{charCount} caracteres</span>}
                </div>

                {!imagePreview ? (
                  <motion.button onClick={() => fileRef.current?.click()}
                    whileHover={{ scale: 1.01, borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.02)' }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-12 border-2 border-dashed border-slate-300 rounded-2xl text-center transition-colors duration-300 bg-slate-50/50 cursor-pointer">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Camera size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 font-medium">Clique para selecionar ou fotografar a redação</p>
                    <p className="text-xs text-slate-400 mt-1">Imagem (JPG, PNG, HEIC), PDF, Word (.docx) ou Texto (.txt)</p>
                    <input ref={fileRef} type="file" accept="image/*,.heic,.HEIC,.pdf,.txt,.docx" className="hidden" onChange={handleFilePick} />
                  </motion.button>
                ) : (
                  <div className="relative group">
                    <img src={imagePreview} alt="Redação" className="w-full rounded-2xl border border-slate-200 max-h-72 object-contain bg-slate-100/50" />
                    <button onClick={() => { setImagePreview(null); setImageBase64(null); }}
                      className="absolute top-3 right-3 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {imagePreview && !text && (
                  <motion.button onClick={handleExtract} disabled={extracting}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 btn-brand-navy rounded-2xl text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                    {extracting ? <><Loader2 size={16} className="animate-spin" /> Extraindo texto com OCR...</> : <><Zap size={16} className="text-[#f60c49]" /> Extrair Texto da Imagem</>}
                  </motion.button>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#dce0f0]" />
                  <span className="text-[11px] text-[#6070a0] font-bold uppercase tracking-wider">ou cole o texto</span>
                  <div className="flex-1 h-px bg-[#dce0f0]" />
                </div>

                <textarea value={text} onChange={e => setText(e.target.value)}
                  lang="pt-BR"
                  spellCheck={false}
                  placeholder="Cole aqui o texto da redação para correção..."
                  rows={8}
                  className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-2xl px-5 py-4 text-sm text-[#101942] placeholder-[#9098c0] outline-none focus:border-[#f60c49] focus:ring-4 focus:ring-[#f60c49]/10 transition-all duration-300 resize-y leading-relaxed" />
              </motion.div>

              {/* CTA */}
              <motion.button onClick={handleCorrect}
                disabled={!text.trim() || !studentName.trim() || selectedCompetencies.length === 0}
                whileHover={text.trim() && studentName.trim() ? { scale: 1.015 } : {}}
                whileTap={text.trim() && studentName.trim() ? { scale: 0.985 } : {}}
                className="w-full py-4.5 btn-brand-primary rounded-2xl text-white text-base font-extrabold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed">
                <Sparkles size={20} /> Corrigir Redação com IA
              </motion.button>

              {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#fff2f6] border border-[#fde4ec] rounded-2xl text-sm font-semibold text-[#d40840]">{error}</motion.div>}
            </motion.div>
          )}

          {/* ══════ REVIEW ══════ */}
          {step === 'review' && (
            <motion.div key="review" {...stepTransition} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center"><FileText size={18} className="text-violet-500" /></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Revisar Texto Extraído</h2>
                  <p className="text-sm text-slate-400">Confira e edite antes de enviar para correção</p>
                </div>
              </div>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={16}
                lang="pt-BR"
                spellCheck={false}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all duration-300 resize-y font-serif leading-relaxed" />
              <div className="flex gap-3">
                <button onClick={() => { setText(''); setStep('input'); }}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-sm text-slate-600 font-semibold transition-all duration-300">Voltar</button>
                <motion.button onClick={handleCorrect} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-2xl text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
                  <Sparkles size={16} /> Corrigir Agora
                </motion.button>
              </div>
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">{error}</div>}
            </motion.div>
          )}

          {/* ══════ CORRECTING ══════ */}
          {step === 'correcting' && (
            <motion.div key="correcting" {...stepTransition}
              className="flex flex-col items-center justify-center py-24 space-y-6">
              <motion.div className="relative"
                animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
                  <Loader2 size={36} color="white" className="animate-spin" />
                </div>
              </motion.div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-900">Corrigindo redação</h2>
                <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">A IA está analisando as 5 competências do ENEM com os critérios oficiais do INEP.</p>
                <motion.p className="text-xs text-slate-400 font-mono"
                  animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                  Isso pode levar até 60 segundos
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ══════ RESULT ══════ */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.92, filter: 'blur(16px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: EASE_EXPO }} className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Sparkles size={18} color="white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resultado da Correção</h2>
                </div>
              </div>

              {/* Student info row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 px-1">
                <span className="inline-flex items-center gap-1.5"><User size={14} /> {studentName}</span>
                {studentClass && <span className="inline-flex items-center gap-1.5"><BookOpen size={14} /> Turma {studentClass}</span>}
                {correctionId && <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-xl"><Shield size={12} /> Login: {correctionId}</span>}
              </div>

              {/* SCORE HERO */}
              {totalScore != null && (
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.8, ease: EASE_EXPO }}
                  className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-8 sm:p-10 text-center shadow-sm">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] via-transparent to-indigo-500/[0.03]" />
                  <div className="relative">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mb-3">Nota Final</p>
                    <div className="inline-flex items-baseline gap-2">
                      <span className={`text-[5rem] sm:text-[7rem] font-black tracking-tighter leading-none tabular-nums
                        ${totalScore >= 600 ? 'text-green-500' : totalScore >= 400 ? 'text-blue-500' : 'text-red-500'}`}>
                        <AnimatedCounter value={totalScore} color="currentColor" />
                      </span>
                      <span className="text-2xl sm:text-3xl text-slate-300 font-bold">/1000</span>
                    </div>
                    <p className={`text-sm font-semibold mt-3 ${totalScore >= 600 ? 'text-green-600' : totalScore >= 400 ? 'text-blue-600' : 'text-red-500'}`}>
                      {totalScore >= 600 ? '✓ Desempenho satisfatório' : totalScore >= 400 ? '⚠ Precisa de atenção' : '✗ Abaixo do esperado'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* COMPETENCY BARS */}
              {scores?.items?.length > 0 && (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.1em] mb-1">Competências ENEM</h3>
                  {scores.items.map((item, i) => {
                    const comp = COMPETENCIAS[i] || COMPETENCIAS[0];
                    const pct = Math.min((item.A / 200) * 100, 100);
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.1, duration: 0.5, ease: EASE_OUT }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: comp.color }}>{comp.label.split(' ')[0]}</span>
                          <span className="text-xs font-mono font-bold tabular-nums text-slate-500">{item.A} <span className="text-slate-300 font-normal">/ 200</span></span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ backgroundColor: comp.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.45 + i * 0.1, duration: 0.8, ease: EASE_EXPO }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* FEEDBACK TEXT */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5, ease: EASE_OUT }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-[15px]">
                  {cleanFeedbackText(result)}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
