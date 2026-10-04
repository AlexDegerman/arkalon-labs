import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ArkalonNetworkWidget } from '@/components/ui/ArkalonNetworkWidget'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Arkalon Laboratories',
  description:
    'Advanced research facility. Study anomalous phenomena. Exploit multi-dimensional mathematics.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-tier="low"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-(--bg-primary) text-(--text-primary) antialiased">
        {children}
        <ArkalonNetworkWidget theme="dark" />
      </body>
    </html>
  )
}
