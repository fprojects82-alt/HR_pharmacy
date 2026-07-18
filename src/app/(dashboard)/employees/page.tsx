'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Employee {
  id: number
  full_name: string
  phone: string | null
  email: string | null
  job_title: string | null
  department: string | null
  branch_id: number | null
  is_active: boolean
  hire_date: string
  branches?: { name: string } | null
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_id: '',
    job_title: '',
    department: '',
    address: '',
    salary: '',
    housing_allowance: '',
    transport_allowance: '',
    other_allowance: '',
    branch_id: '',
    bank_id: '',
    bank_account: '',
    hire_date: new Date().toISOString().split('T')[0],
  })
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([])
  const [banks, setBanks] = useState<{ id: number; name: string }[]>([])

  const supabase = createClient()

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, full_name, phone, email, job_title, department, branch_id, is_active, hire_date, branches(name)')
      .eq('is_active', true)
      .order('full_name')
    setEmployees((data as unknown as Employee[]) || [])
    setLoading(false)
  }

  const fetchLookups = async () => {
    const [branchRes, bankRes] = await Promise.all([
      supabase.from('branches').select('id, name').order('name'),
      supabase.from('banks').select('id, name').order('name'),
    ])
    setBranches(branchRes.data || [])
    setBanks(bankRes.data || [])
  }

  useEffect(() => {
    fetchEmployees()
    fetchLookups()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      full_name: formData.full_name,
      phone: formData.phone || null,
      email: formData.email || null,
      national_id: formData.national_id || null,
      job_title: formData.job_title || null,
      department: formData.department || null,
      address: formData.address || null,
      salary: Number(formData.salary) || 0,
      housing_allowance: Number(formData.housing_allowance) || 0,
      transport_allowance: Number(formData.transport_allowance) || 0,
      other_allowance: Number(formData.other_allowance) || 0,
      branch_id: formData.branch_id ? Number(formData.branch_id) : null,
      bank_id: formData.bank_id ? Number(formData.bank_id) : null,
      bank_account: formData.bank_account || null,
      hire_date: formData.hire_date,
    }

    if (editingId) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editingId)
      if (error) { toast.error('فشل في تحديث الموظف'); return }
      toast.success('تم تحديث الموظف بنجاح')
    } else {
      const { error } = await supabase.from('employees').insert(payload)
      if (error) { toast.error('فشل في إضافة الموظف'); return }
      toast.success('تم إضافة الموظف بنجاح')
    }

    resetForm()
    fetchEmployees()
  }

  const handleEdit = async (id: number) => {
    const { data } = await supabase.from('employees').select('*').eq('id', id).single()
    if (data) {
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || '',
        national_id: data.national_id || '',
        job_title: data.job_title || '',
        department: data.department || '',
        address: data.address || '',
        salary: String(data.salary || ''),
        housing_allowance: String(data.housing_allowance || ''),
        transport_allowance: String(data.transport_allowance || ''),
        other_allowance: String(data.other_allowance || ''),
        branch_id: String(data.branch_id || ''),
        bank_id: String(data.bank_id || ''),
        bank_account: data.bank_account || '',
        hire_date: data.hire_date || '',
      })
      setEditingId(id)
      setShowForm(true)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من إنهاء خدمة هذا الموظف؟')) return
    const { error } = await supabase.from('employees').update({ is_active: false, end_of_service_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    if (error) { toast.error('فشل في العملية'); return }
    toast.success('تم إنهاء الخدمة')
    fetchEmployees()
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      full_name: '', phone: '', email: '', national_id: '', job_title: '', department: '',
      address: '', salary: '', housing_allowance: '', transport_allowance: '', other_allowance: '',
      branch_id: '', bank_id: '', bank_account: '', hire_date: new Date().toISOString().split('T')[0],
    })
  }

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الموظفين</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition"
        >
          <Plus size={18} />
          إضافة موظف
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، المسمى، القسم..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الاسم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">المسمى</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">القسم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الفرع</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">الهاتف</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">لا يوجد موظفين</td></tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{emp.full_name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.job_title || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.department || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.branches?.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{emp.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(emp.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
              {editingId ? 'تعديل موظف' : 'إضافة موظف جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل *</label>
                  <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم الهوية</label>
                  <input type="text" value={formData.national_id} onChange={(e) => setFormData({ ...formData, national_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الهاتف</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المسمى الوظيفي</label>
                  <input type="text" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">القسم</label>
                  <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الفرع</label>
                  <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">اختر الفرع</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ التعيين</label>
                  <input type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الراتب الأساسي</label>
                  <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">بدل السكن</label>
                  <input type="number" value={formData.housing_allowance} onChange={(e) => setFormData({ ...formData, housing_allowance: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">بدل النقل</label>
                  <input type="number" value={formData.transport_allowance} onChange={(e) => setFormData({ ...formData, transport_allowance: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البنك</label>
                  <select value={formData.bank_id} onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">اختر البنك</option>
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم الحساب البنكي</label>
                  <input type="text" value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">
                  {editingId ? 'تحديث' : 'حفظ'}
                </button>
                <button type="button" onClick={resetForm} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-medium transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
