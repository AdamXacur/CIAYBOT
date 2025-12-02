"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, MonitorPlay, Shield, BarChart2, Users } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) router.push("/admin/login")
    else setAuthorized(true)
  }, [router])

  const logout = () => {
    localStorage.removeItem("token")
    router.push("/admin/login")
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="bg-slate-900 border-b border-guinda/30 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-dorado to-guinda rounded flex items-center justify-center">
            <MonitorPlay className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-widest">CENTRO DE MANDO</h1>
            <p className="text-[10px] text-dorado uppercase tracking-[0.3em]">CIAY Neuro-Symbolic Core</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-white flex items-center gap-2">
          <LogOut className="w-3 h-3" /> Cerrar Sesión
        </button>
      </header>
      
      <main className="flex-1 p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/audit" className="bg-slate-900 p-8 rounded-lg border border-guinda/30 hover:border-dorado transition-all group">
            <Shield className="w-10 h-10 text-dorado mb-4" />
            <h2 className="text-2xl font-bold text-white">Auditoría Forense</h2>
            <p className="text-gray-400 mt-2">Revisa historiales de chat, metadatos y el razonamiento de la IA para cada interacción.</p>
          </Link>
          <Link href="/admin/intelligence" className="bg-slate-900 p-8 rounded-lg border border-guinda/30 hover:border-dorado transition-all group">
            <BarChart2 className="w-10 h-10 text-dorado mb-4" />
            <h2 className="text-2xl font-bold text-white">Inteligencia de Negocios</h2>
            <p className="text-gray-400 mt-2">Visualiza KPIs, tendencias de temas, sentimiento general y el crecimiento del grafo.</p>
          </Link>
          <Link href="/admin/profiles" className="bg-slate-900 p-8 rounded-lg border border-guinda/30 hover:border-dorado transition-all group">
            <Users className="w-10 h-10 text-dorado mb-4" />
            <h2 className="text-2xl font-bold text-white">Gestión de Perfiles</h2>
            <p className="text-gray-400 mt-2">Consulta la taxonomía de usuarios que guía las respuestas y el comportamiento del sistema.</p>
          </Link>
        </div>
      </main>
    </div>
  )
}