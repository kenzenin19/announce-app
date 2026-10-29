import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk } from 'next/font/google'
import './globals.css'
import './theme.css'

const font = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-app',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CSB Announcements',
  description: 'Announcements, due dates and your own plan for doing them.',
}

export const viewport: Viewport = {
  themeColor: '#0b6b61',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={font.variable}>
      <body>{children}</body>
    </html>
  )
}
