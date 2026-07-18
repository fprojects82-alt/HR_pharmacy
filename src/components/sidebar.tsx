'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore, type UserRole } from '@/stores/auth-store'
import {
  LayoutDashboard,
  Users,
  Building2,
  Landmark,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Plane,
  HandCoins,
  Timer,
  UserX,
  CalendarClock,
  AlarmClock,
  MessageSquare,
  Package,
  Newspaper,
  FileText,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'الموظفين', href: '/employees', icon: <Users size={20} />, roles: ['admin', 'hr'] },
  { label: 'الفروع', href: '/branches', icon: <Building2 size={20} />, roles: ['admin', 'hr'] },
  { label: 'البنوك', href: '/banks', icon: <Landmark size={20} />, roles: ['admin', 'hr'] },
  { label: 'الحضور والانصراف', href: '/attendance', icon: <Clock size={20} /> },
  { label: 'الجداول', href: '/schedules', icon: <Calendar size={20} />, roles: ['admin', 'hr'] },
  { label: 'الرواتب', href: '/payroll', icon: <DollarSign size={20} />, roles: ['admin', 'hr', 'accountant'] },
  { label: 'التقييمات', href: '/evaluations', icon: <Star size={20} />, roles: ['admin', 'hr'] },
  { label: 'الإجازات', href: '/orders/holidays', icon: <Plane size={20} /> },
  { label: 'السلف', href: '/orders/borrows', icon: <HandCoins size={20} /> },
  { label: 'العمل الإضافي', href: '/orders/overtime', icon: <Timer size={20} /> },
  { label: 'الاستقالات', href: '/orders/resignations', icon: <UserX size={20} /> },
  { label: 'المواعيد', href: '/orders/appointments', icon: <CalendarClock size={20} /> },
  { label: 'ساعات منسية', href: '/orders/forgotten-hours', icon: <AlarmClock size={20} /> },
  { label: 'الشكاوى', href: '/complaints', icon: <MessageSquare size={20} /> },
  { label: 'العهد', href: '/custody', icon: <Package size={20} />, roles: ['admin', 'hr'] },
  { label: 'الأخبار', href: '/news', icon: <Newspaper size={20} /> },
  { label: 'سجل العمليات', href: '/audit-logs', icon: <FileText size={20} />, roles: ['admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { profile } = useAuthStore()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true
    if (!profile) return false
    return item.roles.includes(profile.role)
  })

  return (
    <aside
      className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">ن</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-slate-900 dark:text-white truncate">نظام نور</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mr-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
        >
          <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        {!collapsed && profile && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{profile.role}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title={collapsed ? 'تسجيل الخروج' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  )
}
