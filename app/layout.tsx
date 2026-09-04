import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Caveat, Geist, Instrument_Serif, IBM_Plex_Sans } from 'next/font/google'
import { Tooltip } from '@base-ui/react/tooltip'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SettingsProvider } from '@/components/providers/settings-provider'
import { AuthProvider } from '@/lib/auth/auth-context'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument',
})
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })
const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plex',
})

export const metadata: Metadata = {
  title: 'PlannerHub — Seu planner digital',
  description:
    'Planner digital premium com escrita à mão, stickers e templates. Organize sua vida com fluidez e beleza.',
  icons: {
    icon: '/triaprojeto.png',
    apple: '/triaprojeto.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3eeed' },
    { media: '(prefers-color-scheme: dark)', color: '#36312e' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`bg-background ${geist.variable} ${instrument.variable} ${caveat.variable} ${plex.variable}`}
    >
      <body className="font-sans antialiased">
        <Tooltip.Provider closeDelay={200}>
          <AuthProvider>
            <ThemeProvider>
              <SettingsProvider>
                {children}
                <Toaster />
              </SettingsProvider>
            </ThemeProvider>
          </AuthProvider>
        </Tooltip.Provider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
