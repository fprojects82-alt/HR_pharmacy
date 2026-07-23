'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Plus, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface Complaint {
  id: number
  employee_id: number
  subject: string
  body: string
  response: string | null
  is_seen: boolean
  created_at: string
  employees?: { full_name: string } | null
}

export default function ComplaintsPage() {
  const { profile } = useAuthStore()
  const [records, setRecords] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showResponse, setShowResponse] = useState<number | null>(null)
  const [form, setForm] = useState({ subject: '', body: '' })
  const [responseText, setResponseText] = useState('')
  const supabase = createClient()
  const isAdmin = profile?.role && ['admin', 'hr'].includes(profile.role)

  const fetchRecords = async () => {
    let query = supabase.from('complaints').select('*, employees(full_name)').order('created_at', { ascending: false })
    if (!isAdmin && profile?.employee_id) query = query.eq('employee_id', profile.employee_id)
    const { data } = await query
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.employee_id) { toast.error('لا يوجد ملف موظف'); return }
    const { error } = await supabase.from('complaints').insert({ employee_id: profile.employee_id, subject: form.subject, body: form.body })
    if (error) { toast.error('فشل'); return }
    toast.success('تم تقديم الشكوى')
    setShowForm(false); setForm({ subject: '', body: '' }); fetchRecords()
  }

  const handleRespond = async (id: number) => {
    const { error } = await supabase.from('complaints').update({ response: responseText, responded_by: profile?.id, responded_at: new Date().toISOString(), is_seen: true }).eq('id', id)
    if (error) { toast.error('فشل'); return }
    toast.success('تم الرد')
    setShowResponse(null); setResponseText(''); fetchRecords()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الشكاوى</h1>
        {profile?.employee_id && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> تقديم شكوى</button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-700">جاري التحميل...</div>
        ) : records.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-700">لا يوجد شكاوى</div>
        ) : records.map((r) => (
          <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{r.subject}</h3>
                {isAdmin && <p className="text-xs text-slate-500 mt-0.5">{r.employees?.full_name}</p>}
              </div>
              <div className="flex items-center gap-2">
                {!r.is_seen && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('ar')}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{r.body}</p>
            {r.response && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mt-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">الرد:</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{r.response}</p>
              </div>
            )}
            {isAdmin && !r.response && (
              <button onClick={() => { setShowResponse(r.id); setResponseText('') }} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                <MessageSquare size={14} /> رد
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">تقديم شكوى</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الموضوع *</label>
                <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التفاصيل *</label>
                <textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" rows={5} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">تقديم</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResponse !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">الرد على الشكوى</h2>
            <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 mb-4" rows={5} placeholder="اكتب ردك هنا..." />
            <div className="flex items-center gap-3">
              <button onClick={() => handleRespond(showResponse)} disabled={!responseText} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">إرسال الرد</button>
              <button onClick={() => setShowResponse(null)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
