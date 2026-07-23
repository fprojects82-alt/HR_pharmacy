'use client'

import { Check, X, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-provider'

/**
 * Always-visible status control so a decision can be reconsidered at any time
 * (approve / reject / reset to pending) — even after it was already approved or rejected.
 */
export function StatusControl({ value, onChange }: { value: string; onChange: (s: 'approved' | 'rejected' | 'pending') => void }) {
  const { t } = useLanguage()
  const btn = (active: boolean, activeCls: string) =>
    `p-1.5 rounded-lg transition ${active ? activeCls : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-0.5">
      <button title={t('approve')} onClick={() => onChange('approved')} className={btn(value === 'approved', 'bg-emerald-500 text-white')}><Check size={15} /></button>
      <button title={t('reject')} onClick={() => onChange('rejected')} className={btn(value === 'rejected', 'bg-red-500 text-white')}><X size={15} /></button>
      <button title={t('pending')} onClick={() => onChange('pending')} className={btn(value === 'pending', 'bg-amber-500 text-white')}><RotateCcw size={14} /></button>
    </div>
  )
}
