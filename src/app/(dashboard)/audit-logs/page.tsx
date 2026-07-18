'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface AuditLog {
  id: number
  user_id: string | null
  action: string
  entity: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  profiles?: { full_name: string } | null
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(100)
      setLogs(data || [])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">سجل العمليات</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">آخر 100 عملية في النظام</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">التاريخ</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">المستخدم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الإجراء</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الكيان</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">معرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">لا يوجد سجلات</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white">{log.profiles?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.entity || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.entity_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
