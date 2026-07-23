'use client'

import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DonutChart, BarChart, AreaChart, ProgressRing } from '@/components/charts'
import { StatusControl } from '@/components/status-control'
import {
  Users, Building2, Clock, Plane, Timer, MessageSquare, TrendingUp, TrendingDown, ArrowUpRight, Pill,
  Plane as PlaneIcon, HandCoins, CalendarClock, Landmark, Calendar, DollarSign, Star, UserX, AlarmClock,
  Package, Newspaper, Rocket, ClipboardCheck,
} from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n/translations'

interface Activity { id: string; name: string; type: string; date: string; status: string; icon: 'holiday' | 'overtime' | 'borrow' }
interface Approval { id: number; table: string; name: string; type: string; date: string; status: string }

interface Stats {
  totalEmployees: number; totalBranches: number; activeShifts: number
  pendingHolidays: number; pendingOvertime: number; pendingComplaints: number
  byType: { key: string; value: number }[]
  status: { approved: number; pending: number; rejected: number }
  monthly: { label: string; value: number }[]
  trend: number; recent: Activity[]; approvals: Approval[]; onboarding: { done: number; total: number }
}

const empty: Stats = {
  totalEmployees: 0, totalBranches: 0, activeShifts: 0, pendingHolidays: 0, pendingOvertime: 0, pendingComplaints: 0,
  byType: [], status: { approved: 0, pending: 0, rejected: 0 }, monthly: [], trend: 0, recent: [], approvals: [], onboarding: { done: 0, total: 0 },
}

const quickLinks: { key: TranslationKey; href: string; icon: React.ReactNode; color: string }[] = [
  { key: 'employees', href: '/employees', icon: <Users size={18} />, color: 'bg-blue-500' },
  { key: 'onboarding', href: '/onboarding', icon: <Rocket size={18} />, color: 'bg-violet-500' },
  { key: 'branches', href: '/branches', icon: <Building2 size={18} />, color: 'bg-emerald-500' },
  { key: 'banks', href: '/banks', icon: <Landmark size={18} />, color: 'bg-teal-500' },
  { key: 'attendance', href: '/attendance', icon: <Clock size={18} />, color: 'bg-amber-500' },
  { key: 'schedules', href: '/schedules', icon: <Calendar size={18} />, color: 'bg-purple-500' },
  { key: 'payroll', href: '/payroll', icon: <DollarSign size={18} />, color: 'bg-green-500' },
  { key: 'evaluations', href: '/evaluations', icon: <Star size={18} />, color: 'bg-yellow-500' },
  { key: 'holidays', href: '/orders/holidays', icon: <Plane size={18} />, color: 'bg-sky-500' },
  { key: 'overtime', href: '/orders/overtime', icon: <Timer size={18} />, color: 'bg-orange-500' },
  { key: 'borrows', href: '/orders/borrows', icon: <HandCoins size={18} />, color: 'bg-lime-600' },
  { key: 'resignations', href: '/orders/resignations', icon: <UserX size={18} />, color: 'bg-rose-500' },
  { key: 'appointments', href: '/orders/appointments', icon: <CalendarClock size={18} />, color: 'bg-cyan-500' },
  { key: 'forgottenHours', href: '/orders/forgotten-hours', icon: <AlarmClock size={18} />, color: 'bg-indigo-500' },
  { key: 'complaints', href: '/complaints', icon: <MessageSquare size={18} />, color: 'bg-red-500' },
  { key: 'custody', href: '/custody', icon: <Package size={18} />, color: 'bg-fuchsia-500' },
  { key: 'news', href: '/news', icon: <Newspaper size={18} />, color: 'bg-pink-500' },
]

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { t, tm, lang } = useLanguage()
  const [stats, setStats] = useState<Stats>(empty)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAll = async () => {
    const cnt = async (build: PromiseLike<{ count: number | null }>): Promise<number> => (await build).count ?? 0
    const base = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true })

    const [
      employees, branches, shifts, ph, po, pc,
      holidaysT, overtimeT, borrowsT, resignationsT, appointmentsT, complaintsT,
      appr, pend, rej, obTotal, obDone,
    ] = await Promise.all([
      cnt(base('employees').eq('is_active', true)), cnt(base('branches')), cnt(base('attendance').eq('status', 'open')),
      cnt(base('holidays').eq('status', 'pending')), cnt(base('overtime_requests').eq('status', 'pending')), cnt(base('complaints').eq('is_seen', false)),
      cnt(base('holidays')), cnt(base('overtime_requests')), cnt(base('borrow_requests')),
      cnt(base('resignations')), cnt(base('appointments')), cnt(base('complaints')),
      cnt(base('holidays').eq('status', 'approved')), cnt(base('holidays').eq('status', 'pending')), cnt(base('holidays').eq('status', 'rejected')),
      cnt(base('onboarding_tasks')), cnt(base('onboarding_tasks').eq('is_done', true)),
    ])

    const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1)
    const [{ data: hd }, { data: od }, { data: recentH }, { data: recentO }, { data: recentB }, { data: apH }, { data: apO }] = await Promise.all([
      supabase.from('holidays').select('created_at').gte('created_at', since.toISOString()).limit(1000),
      supabase.from('overtime_requests').select('created_at').gte('created_at', since.toISOString()).limit(1000),
      supabase.from('holidays').select('id, start_date, status, created_at, employees(full_name)').order('created_at', { ascending: false }).limit(4),
      supabase.from('overtime_requests').select('id, date, status, created_at, employees(full_name)').order('created_at', { ascending: false }).limit(4),
      supabase.from('borrow_requests').select('id, status, created_at, employees(full_name)').order('created_at', { ascending: false }).limit(4),
      supabase.from('holidays').select('id, start_date, status, employees(full_name)').eq('status', 'pending').limit(5),
      supabase.from('overtime_requests').select('id, date, status, employees(full_name)').eq('status', 'pending').limit(5),
    ])

    const buckets: Record<string, number> = {}
    const monthsArr = tm('months')
    const labels: { key: string; label: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      buckets[key] = 0; labels.push({ key, label: monthsArr[d.getMonth()] })
    }
    ;[...(hd || []), ...(od || [])].forEach((r) => {
      const d = new Date((r as { created_at: string }).created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (key in buckets) buckets[key]++
    })
    const monthly = labels.map((l) => ({ label: l.label, value: buckets[l.key] }))
    const lastV = monthly[monthly.length - 1]?.value || 0, prevV = monthly[monthly.length - 2]?.value || 0
    const trend = prevV === 0 ? (lastV > 0 ? 100 : 0) : Math.round(((lastV - prevV) / prevV) * 100)

    type Row = { id: number; status: string; created_at?: string; start_date?: string; date?: string; employees?: { full_name: string } | null }
    const mk = (rows: Row[] | null, icon: Activity['icon'], typeKey: string): Activity[] =>
      (rows || []).map((r) => ({ id: `${icon}-${r.id}`, name: r.employees?.full_name || '-', type: typeKey, date: r.start_date || r.date || r.created_at || '', status: r.status, icon }))
    const recent = [
      ...mk(recentH as unknown as Row[], 'holiday', 'holidays'),
      ...mk(recentO as unknown as Row[], 'overtime', 'overtime'),
      ...mk(recentB as unknown as Row[], 'borrow', 'borrows'),
    ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)

    const apRows = (rows: Row[] | null, table: string, typeKey: string): Approval[] =>
      (rows || []).map((r) => ({ id: r.id, table, name: r.employees?.full_name || '-', type: typeKey, date: r.start_date || r.date || '', status: r.status }))
    const approvals = [
      ...apRows(apH as unknown as Row[], 'holidays', 'holidays'),
      ...apRows(apO as unknown as Row[], 'overtime_requests', 'overtime'),
    ].slice(0, 6)

    setStats({
      totalEmployees: employees, totalBranches: branches, activeShifts: shifts,
      pendingHolidays: ph, pendingOvertime: po, pendingComplaints: pc,
      byType: [
        { key: 'holidays', value: holidaysT }, { key: 'overtime', value: overtimeT }, { key: 'borrows', value: borrowsT },
        { key: 'resignations', value: resignationsT }, { key: 'appointments', value: appointmentsT }, { key: 'complaints', value: complaintsT },
      ],
      status: { approved: appr, pending: pend, rejected: rej },
      monthly, trend, recent, approvals, onboarding: { done: obDone, total: obTotal },
    })
    setLoading(false)
  }

  useEffect(() => { fetchAll().catch(() => setLoading(false)) }, [lang])

  const decide = async (table: string, id: number, status: 'approved' | 'rejected' | 'pending') => {
    const on = status === 'approved'
    const payload: Record<string, unknown> = { status }
    if (table === 'holidays') Object.assign(payload, { hr_approved: on, area_manager_approved: on })
    if (table === 'overtime_requests') Object.assign(payload, { hr_approved: on, area_manager_approved: on, control_approved: on })
    await supabase.from(table).update(payload).eq('id', id)
    fetchAll()
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening')
  const attendancePct = stats.totalEmployees ? Math.round((stats.activeShifts / stats.totalEmployees) * 100) : 0
  const totalReq = stats.status.approved + stats.status.pending + stats.status.rejected
  const approvalPct = totalReq ? Math.round((stats.status.approved / totalReq) * 100) : 0
  const obPct = stats.onboarding.total ? Math.round((stats.onboarding.done / stats.onboarding.total) * 100) : 0

  const tiles = [
    { label: t('totalEmployees'), value: stats.totalEmployees, icon: <Users size={18} />, bg: 'bg-blue-50 dark:bg-blue-950/40', ring: 'bg-blue-500', href: '/employees', sub: `${stats.totalBranches} ${t('branches')}` },
    { label: t('pendingHolidays'), value: stats.pendingHolidays, icon: <Plane size={18} />, bg: 'bg-violet-50 dark:bg-violet-950/40', ring: 'bg-violet-500', href: '/orders/holidays', sub: t('pending') },
    { label: t('pendingOvertime'), value: stats.pendingOvertime, icon: <Timer size={18} />, bg: 'bg-amber-50 dark:bg-amber-950/40', ring: 'bg-amber-500', href: '/orders/overtime', sub: t('pending') },
    { label: t('newComplaints'), value: stats.pendingComplaints, icon: <MessageSquare size={18} />, bg: 'bg-rose-50 dark:bg-rose-950/40', ring: 'bg-rose-500', href: '/complaints', sub: t('newComplaints') },
  ]

  const card = 'bg-[var(--card)] rounded-2xl border border-slate-200 dark:border-slate-800 p-5'
  const actIcon = (i: Activity['icon']) => i === 'holiday' ? <PlaneIcon size={15} /> : i === 'overtime' ? <CalendarClock size={15} /> : <HandCoins size={15} />
  const statusChip = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : s === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  const statusLabel = (s: string) => s === 'approved' ? t('approved') : s === 'rejected' ? t('rejected') : t('pending')

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-6 sm:p-8 text-white">
        <div className="absolute -top-8 -end-8 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-12 -end-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-emerald-100 text-sm mb-1">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">{greeting}، {profile?.full_name || ''} <span>👋</span></h1>
            <p className="text-emerald-100 mt-2 text-sm">{t('overview')}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 text-sm"><b className="tabular-nums">{stats.totalEmployees}</b> {t('employees')}</span>
              <span className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 text-sm"><b className="tabular-nums">{stats.pendingHolidays + stats.pendingOvertime}</b> {t('pending')}</span>
              <span className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 text-sm"><b className="tabular-nums">{stats.activeShifts}</b> {t('openShifts')}</span>
            </div>
          </div>
          <div className="hidden sm:flex w-20 h-20 rounded-3xl bg-white/15 backdrop-blur items-center justify-center flex-shrink-0"><Pill size={36} className="text-white" /></div>
        </div>
      </div>

      {/* Pastel stat tiles */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {tiles.map((tile, i) => (
          <Link key={tile.label} href={tile.href} className={`${tile.bg} rounded-2xl p-5 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all animate-fade-up group`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${tile.ring} flex items-center justify-center text-white shadow-md`}>{tile.icon}</div>
              <ArrowUpRight size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{loading ? '—' : tile.value}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">{tile.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tile.sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick access to every page */}
      <div className={card}>
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
          {quickLinks.map((q) => (
            <Link key={q.href} href={q.href} className="flex flex-col items-center gap-2 group">
              <div className={`w-12 h-12 rounded-2xl ${q.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>{q.icon}</div>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 text-center leading-tight">{t(q.key)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Area chart + attendance gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600" /><h2 className="font-semibold text-slate-900 dark:text-white">{t('monthlyActivity')}</h2></div>
            <span className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg ${stats.trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'}`}>
              {stats.trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {Math.abs(stats.trend)}% <span className="hidden sm:inline text-slate-400">{t('vsLastMonth')}</span>
            </span>
          </div>
          <AreaChart data={stats.monthly.length ? stats.monthly : [{ label: '-', value: 0 }]} />
        </div>
        <div className={`${card} flex flex-col items-center justify-center`}>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2 self-start">{t('attendanceRate')}</h2>
          <ProgressRing value={attendancePct} label={t('present')} sub={`${stats.activeShifts} / ${stats.totalEmployees} ${t('present')}`} color="#10b981" />
        </div>
      </div>

      {/* Need your approval + onboarding progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><ClipboardCheck size={18} className="text-emerald-600" /><h2 className="font-semibold text-slate-900 dark:text-white">{t('needApproval') as string}</h2></div>
            <span className="text-xs text-slate-400">{stats.approvals.length}</span>
          </div>
          <div className="space-y-2">
            {loading ? <p className="text-sm text-slate-400 text-center py-6">{t('loading')}</p>
              : stats.approvals.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">{t('noAlerts')}</p>
              : stats.approvals.map((a) => (
                <div key={`${a.table}-${a.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{a.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.name}</p>
                    <p className="text-xs text-slate-400">{t(a.type as TranslationKey)} · {a.date}</p>
                  </div>
                  <StatusControl value={a.status} onChange={(s) => decide(a.table, a.id, s)} />
                </div>
              ))}
          </div>
        </div>

        <div className={`${card} flex flex-col items-center justify-center`}>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2 self-start">{t('onboardingProgress')}</h2>
          <ProgressRing value={obPct} color="#8b5cf6" label={t('completed')} sub={`${stats.onboarding.done} / ${stats.onboarding.total} ${t('tasksDone')}`} />
          <Link href="/onboarding" className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline">{t('viewAll')}</Link>
        </div>
      </div>

      {/* Donut + bar + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t('requestStatus')}</h2>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">{approvalPct}% {t('approvalRate')}</span>
          </div>
          <DonutChart centerLabel={t('totalRequests')} data={[
            { label: t('approved'), value: stats.status.approved, color: '#10b981' },
            { label: t('pending'), value: stats.status.pending, color: '#f59e0b' },
            { label: t('rejected'), value: stats.status.rejected, color: '#ef4444' },
          ]} />
        </div>
        <div className={card}>
          <h2 className="font-semibold text-slate-900 dark:text-white mb-5">{t('requestsByType')}</h2>
          <BarChart data={stats.byType.map((b) => ({ label: t(b.key as TranslationKey), value: b.value }))} color="#8b5cf6" />
        </div>
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t('recentActivity')}</h2>
            <Link href="/orders/holidays" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">{t('viewAll')}</Link>
          </div>
          <div className="space-y-2.5">
            {loading ? <p className="text-sm text-slate-400 text-center py-6">{t('loading')}</p>
              : stats.recent.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">{t('noRecent')}</p>
              : stats.recent.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">{actIcon(a.icon)}</div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.name}</p><p className="text-xs text-slate-400">{t(a.type as TranslationKey)} · {a.date}</p></div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusChip(a.status)}`}>{statusLabel(a.status)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
