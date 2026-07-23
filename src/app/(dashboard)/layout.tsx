'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { useAuthStore } from '@/stores/auth-store'
import { Menu } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:ms-64">
        <div className="flex items-center">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden fixed top-3 z-20 ms-4 w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--card)] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Menu size={20} />
          </button>
        </div>
        <Header />
        <main className="p-4 sm:p-6 max-w-[1400px] mx-auto animate-fade">{children}</main>
      </div>
    </div>
  )
}
