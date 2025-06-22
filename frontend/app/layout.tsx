import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '../components/SessionProvider'

export const metadata: Metadata = {
  title: 'Gantt Chart App',
  description: 'A web-based Gantt chart application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}