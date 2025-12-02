import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

// Configuración de la fuente oficial Source Sans Pro (vía Google Fonts)
const sourceSans = Source_Sans_3({ 
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CIAY | Centro de Inteligencia Artificial de Yucatán',
  description: 'Plataforma Neuro-Simbólica de Atención Ciudadana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        sourceSans.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}