'use client';

import { motion } from 'framer-motion';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  delay = 0,
}) {
  const colorStyles = {
    blue: {
      bg: 'rgba(15, 118, 110, 0.08)',
      border: 'rgba(15, 118, 110, 0.2)',
      iconBg: 'rgba(15, 118, 110, 0.15)',
      iconColor: '#0F766E',
      accent: '#0B5F59',
    },
    emerald: {
      bg: 'rgba(15, 118, 110, 0.08)',
      border: 'rgba(15, 118, 110, 0.2)',
      iconBg: 'rgba(15, 118, 110, 0.15)',
      iconColor: '#0F766E',
      accent: '#0B5F59',
    },
    amber: {
      bg: 'rgba(15, 118, 110, 0.08)',
      border: 'rgba(15, 118, 110, 0.2)',
      iconBg: 'rgba(15, 118, 110, 0.15)',
      iconColor: '#0F766E',
      accent: '#0B5F59',
    },
    rose: {
      bg: 'rgba(15, 118, 110, 0.08)',
      border: 'rgba(15, 118, 110, 0.2)',
      iconBg: 'rgba(15, 118, 110, 0.15)',
      iconColor: '#0f766e',
      accent: '#0f766e',
    },
    purple: {
      bg: 'rgba(15, 118, 110, 0.08)',
      border: 'rgba(15, 118, 110, 0.2)',
      iconBg: 'rgba(15, 118, 110, 0.15)',
      iconColor: '#0f766e',
      accent: '#0f766e',
    },
  };

  const currentStyle = colorStyles[color] || colorStyles.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-md transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{
        backgroundColor: currentStyle.bg,
        borderColor: currentStyle.border,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider uppercase text-[#566F65]">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-[#123c3a] tracking-tight">
              {value}
            </h3>
            {trend && (
              <span className="text-xs font-bold text-[#4F6B63] bg-white/70 px-2 py-0.5 rounded-full border border-[#D5E3DC]">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#566F65] font-medium">{subtitle}</p>
          )}
        </div>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
          style={{ backgroundColor: currentStyle.iconBg }}
        >
          {Icon && <Icon size={24} style={{ color: currentStyle.iconColor }} />}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-70"
        style={{ backgroundColor: currentStyle.accent }}
      />
    </motion.div>
  );
}
