'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useLanguage } from '@/lib/i18n/language-provider'
import type { TranslationKey } from '@/lib/i18n/translations'
import {
  LayoutDashboard, Users, Building2, Landmark, Calendar, Clock, DollarSign, Star, Plane,
  HandCoins, Timer, UserX, CalendarClock, AlarmClock, MessageSquare, Package, Newspaper,
  FileText, LogOut, X, ShieldCheck, Pill,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  key: TranslationKey
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/', icon: <LayoutDashboard size={19} /> },
  { key: 'employees', href: '/employees', icon: <Users size={19} /> },
  { key: 'branches', href: '/branches', icon: <Building2 size={19} /> },
  { key: 'banks', href: '/banks', icon: <Landmark size={19} /> },
  { key: 'attendance', href: '/attendance', icon: <Clock size={19} /> },
  { key: 'schedules', href: '/schedules', icon: <Calendar size={19} /> },
  { key: 'payroll', href: '/payroll', icon: <DollarSign size={19} /> },
  { key: 'evaluations', href: '/evaluations', icon: <Star size={19} /> },
  { key: 'holidays', href: '/orders/holidays', icon: <Plane size={19} /> },
  { key: 'borrows', href: '/orders/borrows', icon: <HandCoins size={19} /> },
  { key: 'overtime', href: '/orders/overtime', icon: <Timer size={19} /> },
  { key: 'resignations', href: '/orders/resignations', icon: <UserX size={19} /> },
  { key: 'appointments', href: '/orders/appointments', icon: <CalendarClock size={19} /> },
  { key: 'forgottenHours', href: '/orders/forgotten-hours', icon: <AlarmClock size={19} /> },
  { key: 'complaints', href: '/complaints', icon: <MessageSquare size={19} /> },
  { key: 'custody', href: '/custody', icon: <Package size={19} /> },
  { key: 'news', href: '/news', icon: <Newspaper size={19} /> },
  { key: 'users', href: '/users', icon: <ShieldCheck size={19} />, adminOnly: true },
  { key: 'auditLogs', href: '/audit-logs', icon: <FileText size={19} />, adminOnly: true },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuthStore()
  const { t } = useLanguage()

  const isAdmin = profile?.role === 'admin'
  const items = navItems.filter((i) => !i.adminOnly || isAdmin)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const content = (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-600/20">
          <Pill size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 dark:text-white truncate leading-tight">{t('appName')}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">{t('pharmacyHr')}</p>
        </div>
        <button onClick={onClose} className="ms-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 lg:hidden">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{t(item.key)}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={19} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 start-0 w-64 bg-[var(--card)] border-e border-slate-200 dark:border-slate-800 flex-col z-30">
        {content}
      </aside>

      {/* Mobile: drawer */}
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 start-0 z-50 w-64 bg-[var(--card)] border-e border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  )
}
