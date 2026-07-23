'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'

interface PayrollRecord {
  id: number; employee_id: number; month: number; year: number; base_salary: number; total_allowances: number
  total_deductions: number; total_bonuses: number; net_salary: number; working_days: number; absent_days: number
  employees?: { full_name: string } | null
}

export default function PayrollPage() {
  const { t, tm } = useLanguage()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const supabase = createClient()
  const months = tm('months')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('monthly_payroll').select('*, employees(full_name)').eq('month', month).eq('year', year).order('employee_id')
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [month, year])

  const selectCls = 'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('payroll')}</h1>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectCls}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectCls}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('employee')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('baseSalary')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('allowances')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('deductions')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('bonuses')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('netSalary')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('workingDays')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('absentDays')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">{Number(r.base_salary).toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-600 tabular-nums">{Number(r.total_allowances).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600 tabular-nums">{Number(r.total_deductions).toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-600 tabular-nums">{Number(r.total_bonuses).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white tabular-nums">{Number(r.net_salary).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.working_days}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.absent_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
