"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BrainCircuit, RefreshCw } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

export function IntelligenceDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      // --- FIX: USAR URL REAL ---
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/dashboard/stats`)
      if (res.ok) setData(await res.json())
    } catch (error) { console.error("Error fetching intelligence:", error) } 
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-ciay-brown">
      <RefreshCw className="w-6 h-6 mr-2 animate-spin" /> Cargando inteligencia...
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Interacciones Totales</p>
          <p className="text-4xl font-bold text-ciay-brown mt-2">{data?.kpis?.total_interactions || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Sesiones Únicas</p>
          <p className="text-4xl font-bold text-ciay-brown mt-2">{data?.kpis?.total_sessions || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Latencia Promedio</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{data?.kpis?.avg_latency || "0s"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[400px]">
          <h4 className="font-bold text-ciay-brown mb-4 uppercase tracking-wide">Distribución de Intenciones</h4>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data?.intents_distribution || []} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} tick={{fill: '#71706C', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#fff', borderColor: '#C49B64'}} />
              <Bar dataKey="value" fill="#C49B64" radius={[0, 4, 4, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="font-bold text-ciay-brown mb-4 uppercase tracking-wide">Nodos Activos (Grafo)</h4>
          <div className="space-y-3">
             {/* Lista estática de nodos principales para mostrar actividad */}
             {["Educación", "Inversión", "Gobierno", "Startups"].map((node) => (
              <div key={node} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                <BrainCircuit className="w-5 h-5 text-ciay-gold flex-shrink-0" />
                <p className="font-mono text-gray-700 truncate">{node}</p>
                <span className="ml-auto text-xs text-green-600 font-bold">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}