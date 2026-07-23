'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Trash2, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

interface Schedule { id: number; employee_id: number; day_of_week: number; start_time: string; end_time: string; is_off: boolean; employees?: { full_name: string; job_title: string | null } | null }
interface EmpRow { employee_id: number; name: string; role: string; days: Record<number, Schedule> }

const palette = [
  'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
]
const avatarBg = ['from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-sky-500 to-blue-600', 'from-rose-500 to-pink-600', 'from-teal-500 to-cyan-600']

export default function SchedulesPage() {
  const { t, tm } = useLanguage()
  const [rows, setRows] = useState<EmpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: number; full_name: string }[]>([])
  const [form, setForm] = useState({ employee_id: '', day_of_week: '0', start_time: '09:00', end_time: '17:00', is_off: false })
  const supabase = createClient()
  const dayNames = tm('days')

  const load = async () => {
    const { data } = await supabase.from('schedules').select('*, employees(full_name, job_title)').order('employee_id').order('day_of_week')
    const map = new Map<number, EmpRow>()
    ;(data as unknown as Schedule[] || []).forEach((s) => {
      if (!map.has(s.employee_id)) map.set(s.employee_id, { employee_id: s.employee_id, name: s.employees?.full_name || '-', role: s.employees?.job_title || '', days: {} })
      map.get(s.employee_id)!.days[s.day_of_week] = s
    })
    setRows([...map.values()])
    setLoading(false)
  }
  useEffect(() => {
    load()
    supabase.from('employees').select('id, full_name').eq('is_active', true).order('full_name').then(({ data }) => setEmployees(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('schedules').insert({ employee_id: Number(form.employee_id), day_of_week: Number(form.day_of_week), start_time: form.start_time, end_time: form.end_time, is_off: form.is_off })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('added'))
    setShowForm(false); load()
  }
  const del = async (id: number) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('deleted')); load()
  }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg"><CalendarDays size={20} /></div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('workSchedules')}</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('addSchedule')}</button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-start font-semibold text-slate-600 dark:text-slate-300 sticky start-0 bg-slate-50 dark:bg-slate-800/50 min-w-[180px]">{t('employee')}</th>
                {dayNames.map((d, i) => (
                  <th key={i} className="px-2 py-3 text-center font-medium text-slate-500 dark:text-slate-400 border-s border-slate-100 dark:border-slate-800 min-w-[92px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">{t('loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">{t('noData')}</td></tr>
              ) : rows.map((row, ri) => (
                <tr key={row.employee_id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 sticky start-0 bg-[var(--card)]">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarBg[ri % avatarBg.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{row.name.charAt(0)}</div>
                      <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">{row.name}</span>
                    </div>
                  </td>
                  {dayNames.map((_, di) => {
                    const s = row.days[di]
                    return (
                      <td key={di} className="p-1.5 align-top border-s border-slate-100 dark:border-slate-800">
                        {s ? (
                          s.is_off ? (
                            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-[11px] text-center py-3 relative group">
                              {t('off')}
                              <button onClick={() => del(s.id)} className="absolute top-0.5 end-0.5 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={11} /></button>
                            </div>
                          ) : (
                            <div className={`rounded-lg border px-2 py-1.5 text-[11px] relative group ${palette[ri % palette.length]}`}>
                              <div className="font-semibold tabular-nums">{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</div>
                              {row.role && <div className="opacity-75 truncate">{row.role.split(' - ')[0]}</div>}
                              <button onClick={() => del(s.id)} className="absolute top-0.5 end-0.5 opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={11} /></button>
                            </div>
                          )
                        ) : (
                          <div className="h-full min-h-[42px]" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900/50" /> {t('workSchedules')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-dashed border-slate-400" /> {t('off')}</span>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{t('addSchedule')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('employee')} *</label>
                <select required value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className={inputCls}>
                  <option value="">{t('selectEmployee')}</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('day')} *</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} className={inputCls}>
                  {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.is_off} onChange={(e) => setForm({ ...form, is_off: e.target.checked })} className="rounded" /> {t('dayOff')}
              </label>
              {!form.is_off && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('from')}</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputCls} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('to')}</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputCls} /></div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('save')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
