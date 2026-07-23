'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Building2,
  Clock,
  Plane,
  Timer,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface DashboardStats {
  totalEmployees: number
  totalBranches: number
  activeShifts: number
  pendingHolidays: number
  pendingOvertime: number
  pendingComplaints: number
}

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalBranches: 0,
    activeShifts: 0,
    pendingHolidays: 0,
    pendingOvertime: 0,
    pendingComplaints: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      const [employees, branches, shifts, holidays, overtime, complaints] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('branches').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('holidays').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('overtime_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('is_seen', false),
      ])

      setStats({
        totalEmployees: employees.count || 0,
        totalBranches: branches.count || 0,
        activeShifts: shifts.count || 0,
        pendingHolidays: holidays.count || 0,
        pendingOvertime: overtime.count || 0,
        pendingComplaints: complaints.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: 'الموظفين النشطين', value: stats.totalEmployees, icon: <Users size={22} />, color: 'bg-blue-500' },
    { label: 'الفروع', value: stats.totalBranches, icon: <Building2 size={22} />, color: 'bg-emerald-500' },
    { label: 'ورديات مفتوحة', value: stats.activeShifts, icon: <Clock size={22} />, color: 'bg-amber-500' },
    { label: 'إجازات معلقة', value: stats.pendingHolidays, icon: <Plane size={22} />, color: 'bg-purple-500' },
    { label: 'إضافي معلق', value: stats.pendingOvertime, icon: <Timer size={22} />, color: 'bg-orange-500' },
    { label: 'شكاوى جديدة', value: stats.pendingComplaints, icon: <MessageSquare size={22} />, color: 'bg-red-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          مرحباً، {profile?.full_name || 'المستخدم'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">نظرة عامة على النظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div className={`${card.color} w-11 h-11 rounded-xl flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {profile?.role && ['admin', 'hr'].includes(profile.role) && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ملخص سريع</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>إجمالي الموظفين النشطين: {stats.totalEmployees}</p>
              <p>عدد الفروع: {stats.totalBranches}</p>
              <p>الطلبات المعلقة: {stats.pendingHolidays + stats.pendingOvertime}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">تنبيهات</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              {stats.pendingComplaints > 0 && (
                <p className="text-red-600 dark:text-red-400">
                  يوجد {stats.pendingComplaints} شكوى جديدة تحتاج مراجعة
                </p>
              )}
              {stats.pendingHolidays > 0 && (
                <p className="text-purple-600 dark:text-purple-400">
                  يوجد {stats.pendingHolidays} طلب إجازة بانتظار الموافقة
                </p>
              )}
              {stats.pendingHolidays === 0 && stats.pendingComplaints === 0 && (
                <p className="text-emerald-600 dark:text-emerald-400">لا توجد تنبيهات حالياً</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
