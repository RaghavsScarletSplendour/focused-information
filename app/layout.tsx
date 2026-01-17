import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'Focus First | One Thing to Learn Today',
  description: 'Cut through the AI hype. Learn one thing at a time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <main className="w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
