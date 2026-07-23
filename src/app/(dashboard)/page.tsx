'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DonutChart, BarChart, AreaChart } from '@/components/charts'
import { Users, Building2, Clock, Plane, Timer, MessageSquare, TrendingUp, ArrowUpRight, ChevronLeft } from 'lucide-react'

interface Stats {
  totalEmployees: number
  totalBranches: number
  activeShifts: number
  pendingHolidays: number
  pendingOvertime: number
  pendingComplaints: number
  byType: { key: string; value: number }[]
  status: { approved: number; pending: number; rejected: number }
  monthly: { label: string; value: number }[]
}

const empty: Stats = {
  totalEmployees: 0, totalBranches: 0, activeShifts: 0, pendingHolidays: 0, pendingOvertime: 0, pendingComplaints: 0,
  byType: [], status: { approved: 0, pending: 0, rejected: 0 }, monthly: [],
}

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { t, tm, lang } = useLanguage()
  const [stats, setStats] = useState<Stats>(empty)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const cnt = async (build: PromiseLike<{ count: number | null }>): Promise<number> => {
        const { count } = await build
        return count ?? 0
      }
      const base = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true })

      const [
        employees, branches, shifts, ph, po, pc,
        holidaysT, overtimeT, borrowsT, resignationsT, appointmentsT, complaintsT,
        appr, pend, rej,
      ] = await Promise.all([
        cnt(base('employees').eq('is_active', true)),
        cnt(base('branches')),
        cnt(base('attendance').eq('status', 'open')),
        cnt(base('holidays').eq('status', 'pending')),
        cnt(base('overtime_requests').eq('status', 'pending')),
        cnt(base('complaints').eq('is_seen', false)),
        cnt(base('holidays')), cnt(base('overtime_requests')), cnt(base('borrow_requests')),
        cnt(base('resignations')), cnt(base('appointments')), cnt(base('complaints')),
        cnt(base('holidays').eq('status', 'approved')),
        cnt(base('holidays').eq('status', 'pending')),
        cnt(base('holidays').eq('status', 'rejected')),
      ])

      // monthly activity: last 6 months of holiday + overtime requests
      const since = new Date()
      since.setMonth(since.getMonth() - 5)
      since.setDate(1)
      const [{ data: hd }, { data: od }] = await Promise.all([
        supabase.from('holidays').select('created_at').gte('created_at', since.toISOString()).limit(1000),
        supabase.from('overtime_requests').select('created_at').gte('created_at', since.toISOString()).limit(1000),
      ])
      const buckets: Record<string, number> = {}
      const monthsArr = tm('months')
      const labels: { key: string; label: string }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        buckets[key] = 0
        labels.push({ key, label: monthsArr[d.getMonth()] })
      }
      ;[...(hd || []), ...(od || [])].forEach((r) => {
        const d = new Date((r as { created_at: string }).created_at)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        if (key in buckets) buckets[key]++
      })

      setStats({
        totalEmployees: employees,
        totalBranches: branches,
        activeShifts: shifts,
        pendingHolidays: ph,
        pendingOvertime: po,
        pendingComplaints: pc,
        byType: [
          { key: 'holidays', value: holidaysT },
          { key: 'overtime', value: overtimeT },
          { key: 'borrows', value: borrowsT },
          { key: 'resignations', value: resignationsT },
          { key: 'appointments', value: appointmentsT },
          { key: 'complaints', value: complaintsT },
        ],
        status: { approved: appr, pending: pend, rejected: rej },
        monthly: labels.map((l) => ({ label: l.label, value: buckets[l.key] })),
      })
      setLoading(false)
    }
    run().catch(() => setLoading(false))
  }, [lang])

  const statCards = [
    { label: t('activeEmployees'), value: stats.totalEmployees, icon: <Users size={20} />, from: 'from-blue-500', to: 'to-blue-600', href: '/employees' },
    { label: t('branches'), value: stats.totalBranches, icon: <Building2 size={20} />, from: 'from-emerald-500', to: 'to-emerald-600', href: '/branches' },
    { label: t('openShifts'), value: stats.activeShifts, icon: <Clock size={20} />, from: 'from-amber-500', to: 'to-amber-600', href: '/attendance' },
    { label: t('pendingHolidays'), value: stats.pendingHolidays, icon: <Plane size={20} />, from: 'from-purple-500', to: 'to-purple-600', href: '/orders/holidays' },
    { label: t('pendingOvertime'), value: stats.pendingOvertime, icon: <Timer size={20} />, from: 'from-orange-500', to: 'to-orange-600', href: '/orders/overtime' },
    { label: t('newComplaints'), value: stats.pendingComplaints, icon: <MessageSquare size={20} />, from: 'from-rose-500', to: 'to-rose-600', href: '/complaints' },
  ]

  const card = 'bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('welcome')}، {profile?.full_name || ''}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('overview')}</p>
      </div>

      {/* Stat cards (clickable) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className={`${card} animate-fade-up group hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-white mb-3 shadow-lg`}>
                {c.icon}
              </div>
              <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 rtl:rotate-0 ltr:rotate-180 transition" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{loading ? '—' : c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <h2 className="font-semibold text-slate-900 dark:text-white">{t('monthlyActivity')}</h2>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight size={14} /> {stats.monthly.reduce((s, m) => s + m.value, 0)} {t('totalRequests')}
            </span>
          </div>
          <AreaChart data={stats.monthly.length ? stats.monthly : [{ label: '-', value: 0 }]} />
        </div>

        <div className={card}>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{t('requestStatus')}</h2>
          <DonutChart
            centerLabel={t('totalRequests')}
            data={[
              { label: t('approved'), value: stats.status.approved, color: '#10b981' },
              { label: t('pending'), value: stats.status.pending, color: '#f59e0b' },
              { label: t('rejected'), value: stats.status.rejected, color: '#ef4444' },
            ]}
          />
        </div>
      </div>

      {/* Requests by type */}
      <div className={card}>
        <h2 className="font-semibold text-slate-900 dark:text-white mb-5">{t('requestsByType')}</h2>
        <BarChart data={stats.byType.map((b) => ({ label: t(b.key as Parameters<typeof t>[0]), value: b.value }))} />
      </div>
    </div>
  )
}
