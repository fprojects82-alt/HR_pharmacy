'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Clock, Play, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface AttendanceRecord { id: number; employee_id: number; start_time: string | null; end_time: string | null; status: string; is_late: boolean; late_minutes: number; employees?: { full_name: string } | null }

export default function AttendancePage() {
  const { profile } = useAuthStore()
  const { t } = useLanguage()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState<AttendanceRecord | null>(null)
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr', 'control'].includes(profile.role)

  const load = async () => {
    let q = supabase.from('attendance').select('*, employees(full_name)').order('created_at', { ascending: false }).limit(50)
    if (!isAdmin && profile?.employee_id) q = q.eq('employee_id', profile.employee_id)
    const { data } = await q
    setRecords(data || [])
    if (profile?.employee_id) setActiveShift((data || []).find((r) => r.status === 'open' && r.employee_id === profile.employee_id) || null)
    setLoading(false)
  }
  useEffect(() => { load() }, [profile])

  const startShift = async () => {
    if (!profile?.employee_id) { toast.error(t('noProfile')); return }
    const { error } = await supabase.from('attendance').insert({ employee_id: profile.employee_id, start_time: new Date().toISOString(), status: 'open' })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('saved')); load()
  }
  const endShift = async () => {
    if (!activeShift) return
    const { error } = await supabase.from('attendance').update({ end_time: new Date().toISOString(), status: 'closed' }).eq('id', activeShift.id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('saved')); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('attendance')}</h1>
        {profile?.employee_id && (
          activeShift ? (
            <button onClick={endShift} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Square size={18} /> {t('endShift')}</button>
          ) : (
            <button onClick={startShift} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Play size={18} /> {t('startShift')}</button>
          )
        )}
      </div>

      {activeShift && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Clock size={20} className="text-emerald-600" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('openShiftSince')} {activeShift.start_time ? format(new Date(activeShift.start_time), 'HH:mm') : '-'}</p>
        </div>
      )}

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {isAdmin && <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('employee')}</th>}
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('checkIn')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('checkOut')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('status')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('lateMinutes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  {isAdmin && <td className="px-4 py-3 text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.start_time ? format(new Date(r.start_time), 'yyyy-MM-dd HH:mm') : '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.end_time ? format(new Date(r.end_time), 'yyyy-MM-dd HH:mm') : '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${r.status === 'open' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{r.status === 'open' ? t('open') : t('closed')}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.late_minutes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
