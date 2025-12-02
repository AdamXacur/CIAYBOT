"use client"

import { useRouter, usePathname } from "next/navigation" // Importar useRouter
import { ArrowLeft } from "lucide-react"

const getTitle = (path: string) => {
  if (path.includes("/audit")) return "Auditoría Forense"
  if (path.includes("/intelligence")) return "Inteligencia de Negocios"
  if (path.includes("/profiles")) return "Gestión de Perfiles"
  return "Centro de Mando"
}

export default function AdminViewsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter() // Instanciar el router
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="bg-slate-900 border-b border-guinda/30 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        {/* --- FIX: Reemplazar Link por Button con router.push --- */}
        <button 
          onClick={() => router.push('/admin/dashboard')} 
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        {/* ---------------------------------------------------- */}
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </header>
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}