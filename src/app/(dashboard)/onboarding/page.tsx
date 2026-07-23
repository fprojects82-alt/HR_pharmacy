'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Trash2, Check, Rocket, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

interface Task { id: number; employee_id: number; title: string; is_done: boolean }
interface EmpGroup { employee_id: number; name: string; hire_date: string; tasks: Task[] }

export default function OnboardingPage() {
  const { t } = useLanguage()
  const [groups, setGroups] = useState<EmpGroup[]>([])
  const [employees, setEmployees] = useState<{ id: number; full_name: string; hire_date: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const supabase = createClient()

  const load = async () => {
    const [{ data: emps }, { data: tasks }] = await Promise.all([
      supabase.from('employees').select('id, full_name, hire_date').eq('is_active', true).order('hire_date', { ascending: false }).limit(12),
      supabase.from('onboarding_tasks').select('*').order('sort_order').order('id'),
    ])
    const taskList = (tasks as unknown as Task[]) || []
    const g: EmpGroup[] = (emps || []).map((e) => ({
      employee_id: e.id, name: e.full_name, hire_date: e.hire_date,
      tasks: taskList.filter((tk) => tk.employee_id === e.id),
    })).filter((x) => x.tasks.length > 0)
    setGroups(g)
    setEmployees(emps || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggle = async (task: Task) => {
    const { error } = await supabase.from('onboarding_tasks').update({ is_done: !task.is_done }).eq('id', task.id)
    if (error) { toast.error(t('failed')); return }
    load()
  }
  const addTask = async (employee_id: number) => {
    if (!title.trim()) return
    const { error } = await supabase.from('onboarding_tasks').insert({ employee_id, title })
    if (error) { toast.error(t('failed')); return }
    toast.success(t('added')); setTitle(''); setAdding(null); load()
  }
  const del = async (id: number) => {
    const { error } = await supabase.from('onboarding_tasks').delete().eq('id', id)
    if (error) { toast.error(t('failed')); return }
    load()
  }
  const seedFor = async (employee_id: number) => {
    const defaults = ['استلام الزي والعهدة - Receive uniform & tools', 'تدريب النظام - System training', 'مراجعة السياسات - Policy review', 'اجتماع تعريفي - Intro meeting']
    const rows = defaults.map((title, i) => ({ employee_id, title, sort_order: i }))
    const { error } = await supabase.from('onboarding_tasks').insert(rows)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('added')); load()
  }

  const noneEmployees = employees.filter((e) => !groups.find((g) => g.employee_id === e.id))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg"><Rocket size={20} /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('onboarding')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('onboardingDesc')}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-[var(--card)] rounded-2xl p-10 text-center text-slate-500 border border-slate-200 dark:border-slate-800">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {groups.map((g) => {
            const done = g.tasks.filter((x) => x.is_done).length
            const pct = g.tasks.length ? Math.round((done / g.tasks.length) * 100) : 0
            return (
              <div key={g.employee_id} className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">{g.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{g.name}</p>
                    <p className="text-xs text-slate-400">{done}/{g.tasks.length} {t('tasksDone')}</p>
                  </div>
                  <div className="relative w-12 h-12">
                    <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-700" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(2 * Math.PI * 20 * pct) / 100} ${2 * Math.PI * 20}`} style={{ transition: 'stroke-dasharray 0.7s ease' }} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-900 dark:text-white">{pct}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {g.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 group">
                      <button onClick={() => toggle(task)} className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${task.is_done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'}`}>
                        {task.is_done && <Check size={13} />}
                      </button>
                      <span className={`flex-1 text-sm ${task.is_done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</span>
                      <button onClick={() => del(task.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                {adding === g.employee_id ? (
                  <div className="flex items-center gap-2 mt-3">
                    <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTask(g.employee_id)} placeholder={t('taskTitle')} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button onClick={() => addTask(g.employee_id)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm">{t('save')}</button>
                    <button onClick={() => { setAdding(null); setTitle('') }} className="text-slate-400 text-sm px-2">{t('cancel')}</button>
                  </div>
                ) : (
                  <button onClick={() => { setAdding(g.employee_id); setTitle('') }} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><Plus size={15} /> {t('addTask')}</button>
                )}
              </div>
            )
          })}

          {/* Employees without a checklist yet */}
          {noneEmployees.length > 0 && (
            <div className="bg-[var(--card)] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
                <ClipboardList size={18} /> <h2 className="font-semibold">{t('newHires')}</h2>
              </div>
              <div className="space-y-2">
                {noneEmployees.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">{e.full_name.charAt(0)}</div>
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">{e.full_name}</span>
                    <button onClick={() => seedFor(e.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><Plus size={13} /> {t('addTask')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
