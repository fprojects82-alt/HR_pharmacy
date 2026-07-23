'use client'

import { Check, X, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-provider'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type S = 'approved' | 'rejected' | 'pending'

/**
 * Two-stage approval control.
 * - HR users set a recommendation (hr_decision) — the request is then forwarded to the admin.
 * - Admin users set the final status. The admin can always reconsider (even after deciding).
 */
export function ApprovalControl({ table, id, status, hrDecision, onDone }: {
  table: string
  id: number
  status: string
  hrDecision?: string | null
  onDone: () => void
}) {
  const { t } = useLanguage()
  const { profile } = useAuthStore()
  const supabase = createClient()
  const isAdmin = profile?.role === 'admin'

  const setFinal = async (s: S) => {
    const on = s === 'approved'
    const payload: Record<string, unknown> = { status: s }
    if (table === 'holidays') Object.assign(payload, { hr_approved: on, area_manager_approved: on })
    if (table === 'overtime_requests') Object.assign(payload, { hr_approved: on, area_manager_approved: on, control_approved: on })
    if (['borrow_requests', 'resignations', 'appointments', 'forgotten_hours'].includes(table)) Object.assign(payload, { approved_by: profile?.id, approved_at: new Date().toISOString() })
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t(s === 'approved' ? 'approvedMsg' : s === 'rejected' ? 'rejectedMsg' : 'updated')); onDone()
  }

  const setRec = async (s: S) => {
    const { error } = await supabase.from(table).update({ hr_decision: s }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('hrRecommends')); onDone()
  }

  const active = isAdmin ? status : (hrDecision || 'pending')
  const onClick = isAdmin ? setFinal : setRec
  const btn = (on: boolean, cls: string) => `p-1.5 rounded-lg transition ${on ? cls : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-0.5 w-fit">
        <button title={isAdmin ? t('approve') : t('recommend')} onClick={() => onClick('approved')} className={btn(active === 'approved', 'bg-emerald-500 text-white')}><Check size={15} /></button>
        <button title={t('reject')} onClick={() => onClick('rejected')} className={btn(active === 'rejected', 'bg-red-500 text-white')}><X size={15} /></button>
        <button title={t('pending')} onClick={() => onClick('pending')} className={btn(active === 'pending', 'bg-amber-500 text-white')}><RotateCcw size={14} /></button>
      </div>
      {/* Cross-role hint */}
      {isAdmin && hrDecision && hrDecision !== 'pending' && (
        <span className="text-[10px] text-slate-400">{t('hrRecommends')}: {hrDecision === 'approved' ? t('approved') : t('rejected')}</span>
      )}
      {!isAdmin && status !== 'pending' && (
        <span className="text-[10px] text-slate-400">{t('finalDecision')}: {status === 'approved' ? t('approved') : t('rejected')}</span>
      )}
      {!isAdmin && status === 'pending' && hrDecision && hrDecision !== 'pending' && (
        <span className="text-[10px] text-amber-500">{t('awaitingAdmin')}</span>
      )}
    </div>
  )
}
