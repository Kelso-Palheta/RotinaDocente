"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-[#0B2B2A]/90 border-[#0F766E]/30 text-[#DAEBE5]',
  error: 'bg-[#0B2B2A]/90 border-[#0F766E]/30 text-[#DAEBE5]',
  warning: 'bg-[#0B2B2A]/90 border-[#0F766E]/30 text-[#DAEBE5]',
  info: 'bg-[#0B2B2A]/90 border-[#0F766E]/30 text-[#DAEBE5]',
};

const ICON_STYLES = {
  success: 'text-[#0F766E]',
  error: 'text-[#0F766E]',
  warning: 'text-[#0F766E]',
  info: 'text-[#0F766E]',
};

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = ICONS[type] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl shadow-black/40 text-sm font-medium ${STYLES[type] || STYLES.info}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${ICON_STYLES[type] || ICON_STYLES.info}`} />
      <span className="leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
