'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/language-provider'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Employee {
  id: number; full_name: string; phone: string | null; email: string | null; job_title: string | null
  department: string | null; branch_id: number | null; is_active: boolean; hire_date: string; branches?: { name: string } | null
}

const emptyForm = {
  full_name: '', phone: '', email: '', national_id: '', job_title: '', department: '', address: '',
  salary: '', housing_allowance: '', transport_allowance: '', other_allowance: '', branch_id: '', bank_id: '',
  bank_account: '', hire_date: new Date().toISOString().split('T')[0],
}

export default function EmployeesPage() {
  const { t } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([])
  const [banks, setBanks] = useState<{ id: number; name: string }[]>([])
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('employees').select('id, full_name, phone, email, job_title, department, branch_id, is_active, hire_date, branches(name)').eq('is_active', true).order('full_name')
    setEmployees((data as unknown as Employee[]) || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    supabase.from('branches').select('id, name').order('name').then(({ data }) => setBranches(data || []))
    supabase.from('banks').select('id, name').order('name').then(({ data }) => setBanks(data || []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      full_name: formData.full_name, phone: formData.phone || null, email: formData.email || null,
      national_id: formData.national_id || null, job_title: formData.job_title || null, department: formData.department || null,
      address: formData.address || null, salary: Number(formData.salary) || 0, housing_allowance: Number(formData.housing_allowance) || 0,
      transport_allowance: Number(formData.transport_allowance) || 0, other_allowance: Number(formData.other_allowance) || 0,
      branch_id: formData.branch_id ? Number(formData.branch_id) : null, bank_id: formData.bank_id ? Number(formData.bank_id) : null,
      bank_account: formData.bank_account || null, hire_date: formData.hire_date,
    }
    const { error } = editingId
      ? await supabase.from('employees').update(payload).eq('id', editingId)
      : await supabase.from('employees').insert(payload)
    if (error) { toast.error(t('failed')); return }
    toast.success(editingId ? t('updated') : t('added'))
    reset(); load()
  }

  const handleEdit = async (id: number) => {
    const { data } = await supabase.from('employees').select('*').eq('id', id).single()
    if (data) {
      setFormData({
        full_name: data.full_name || '', phone: data.phone || '', email: data.email || '', national_id: data.national_id || '',
        job_title: data.job_title || '', department: data.department || '', address: data.address || '',
        salary: String(data.salary || ''), housing_allowance: String(data.housing_allowance || ''),
        transport_allowance: String(data.transport_allowance || ''), other_allowance: String(data.other_allowance || ''),
        branch_id: String(data.branch_id || ''), bank_id: String(data.bank_id || ''), bank_account: data.bank_account || '',
        hire_date: data.hire_date || '',
      })
      setEditingId(id); setShowForm(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmEndService'))) return
    const { error } = await supabase.from('employees').update({ is_active: false, end_of_service_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    if (error) { toast.error(t('failed')); return }
    toast.success(t('deleted')); load()
  }

  const reset = () => { setShowForm(false); setEditingId(null); setFormData({ ...emptyForm }) }

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500'
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('employees')}</h1>
        <button onClick={() => { reset(); setShowForm(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"><Plus size={18} /> {t('addEmployee')}</button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchEmployees')} className="w-full pe-10 ps-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('fullName')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('jobTitle')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('department')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('branch')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('phone')}</th>
                <th className="px-4 py-3 text-start font-medium text-slate-600 dark:text-slate-300">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('loading')}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noData')}</td></tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">{emp.full_name?.charAt(0)}</div>
                      <span className="font-medium text-slate-900 dark:text-white">{emp.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.job_title || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.department || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.branches?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(emp.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--card)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">{editingId ? t('editEmployee') : t('addEmployee')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={label}>{t('fullName')} *</label><input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('nationalId')}</label><input type="text" value={formData.national_id} onChange={(e) => setFormData({ ...formData, national_id: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('phone')}</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('email')}</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('jobTitle')}</label><input type="text" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('department')}</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('branch')}</label>
                  <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} className={inputCls}>
                    <option value="">{t('selectBranch')}</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div><label className={label}>{t('hireDate')}</label><input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('salary')}</label><input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('housingAllowance')}</label><input type="number" value={formData.housing_allowance} onChange={(e) => setFormData({ ...formData, housing_allowance: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('transportAllowance')}</label><input type="number" value={formData.transport_allowance} onChange={(e) => setFormData({ ...formData, transport_allowance: e.target.value })} className={inputCls} /></div>
                <div><label className={label}>{t('bank')}</label>
                  <select value={formData.bank_id} onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })} className={inputCls}>
                    <option value="">{t('selectBank')}</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div><label className={label}>{t('bankAccount')}</label><input type="text" value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className={inputCls} /></div>
              </div>
              <div><label className={label}>{t('address')}</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputCls} /></div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">{editingId ? t('update') : t('save')}</button>
                <button type="button" onClick={reset} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
