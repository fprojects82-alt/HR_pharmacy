'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DollarSign, Search } from 'lucide-react'

interface PayrollRecord {
  id: number
  employee_id: number
  month: number
  year: number
  base_salary: number
  total_allowances: number
  total_deductions: number
  total_bonuses: number
  net_salary: number
  working_days: number
  absent_days: number
  employees?: { full_name: string } | null
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const supabase = createClient()

  const fetchPayroll = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('monthly_payroll')
      .select('*, employees(full_name)')
      .eq('month', month)
      .eq('year', year)
      .order('employee_id')
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPayroll() }, [month, year])

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الرواتب</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الموظف</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الراتب الأساسي</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">البدلات</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الخصومات</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">المكافآت</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">صافي الراتب</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">أيام العمل</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">أيام الغياب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">لا يوجد بيانات رواتب لهذا الشهر</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.employees?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{Number(r.base_salary).toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-600">{Number(r.total_allowances).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600">{Number(r.total_deductions).toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-600">{Number(r.total_bonuses).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{Number(r.net_salary).toLocaleString()}</td>
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
