import type { Metadata } from 'next'
import './globals.css'

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
      <body className="min-h-screen flex items-center justify-center p-4">
        <main className="w-full max-w-2xl">
          {children}
        </main>
      </body>
    </html>
  )
}
