'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/lib/i18n/language-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
