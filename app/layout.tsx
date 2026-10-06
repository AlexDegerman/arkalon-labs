import type { Metadata, Viewport } from 'next'
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

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark'
}

export const metadata: Metadata = {
  title: 'Arkalon Laboratories',
  description:
    'Sci-fi idle incremental game. Upgrade facility equipment, rack up research points, automate complex operations, and scale beyond 10^162.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Arkalon Laboratories',
    description:
      'Sci-fi idle incremental game. Upgrade facility equipment, rack up research points, automate complex operations, and scale beyond 10^162.',
    url: 'https://labs.rpsleague.fi',
    siteName: 'Arkalon Laboratories',
    images: [
      {
        url: 'https://labs.rpsleague.fi/brand/arkalon-labs-app-icon.svg',
        width: 512,
        height: 512,
        alt: 'Arkalon Laboratories'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  icons: {
    icon: [
      {
        url: '/brand/arkalon-labs-icon-32.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml'
      },
      {
        url: '/brand/arkalon-labs-emblem.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml'
      }
    ],
    apple: [
      {
        url: '/brand/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Arkalon Labs'
  }
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
