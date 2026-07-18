'use client'

import { Sidebar } from '@/components/sidebar'
import { useAuthStore } from '@/stores/auth-store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <Sidebar />
      <main className="mr-64 p-6 min-h-screen">
        {children}
      </main>
    </div>
  )
}
