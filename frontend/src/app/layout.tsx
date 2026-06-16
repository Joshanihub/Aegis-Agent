import type { Metadata } from 'next'
import { Inter, Epilogue, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const epilogue = Epilogue({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-epilogue',
  weight: ['400', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Aegis Agent — Enterprise Investment Analysis',
  description:
    'Enterprise multi-agent workflow command center for automated investment analysis and risk assessment. Powered by AI agents: Planner, Analyst, Reviewer, and Finalizer.',
  keywords: ['investment analysis', 'multi-agent AI', 'due diligence', 'risk assessment'],
  openGraph: {
    title: 'Aegis Agent',
    description: 'Enterprise multi-agent investment analysis command center.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${epilogue.variable} ${jetbrainsMono.variable} font-body bg-surface text-on-surface antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
