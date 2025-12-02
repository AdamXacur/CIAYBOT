"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BrainCircuit, RefreshCw } from "lucide-react"

export function IntelligenceDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/api/v1/analytics/intelligence")
      setData(await res.json())
    } catch (error) { console.error("Error fetching intelligence:", error) } 
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-dorado">
      <RefreshCw className="w-6 h-6 mr-2 animate-spin" /> Cargando datos de inteligencia...
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-lg border border-guinda/30">
          <p className="text-sm text-gray-400">Interacciones Totales</p>
          <p className="text-4xl font-bold text-dorado mt-2">{data?.kpis?.total_interactions || 0}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg border border-guinda/30">
          <p className="text-sm text-gray-400">Sesiones Únicas</p>
          <p className="text-4xl font-bold text-dorado mt-2">{data?.kpis?.total_sessions || 0}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg border border-guinda/30">
          <p className="text-sm text-gray-400">Sentimiento Promedio</p>
          <p className={`text-4xl font-bold mt-2 ${(data?.kpis?.average_sentiment || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{data?.kpis?.average_sentiment || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-slate-900 p-6 rounded-lg border border-guinda/30 min-h-[400px]">
          <h4 className="font-bold text-white mb-4">Temas de Interés (Distribución de Intenciones)</h4>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data?.intent_distribution || []} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={120} tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'rgba(212, 175, 55, 0.1)'}} contentStyle={{backgroundColor: '#1e293b', borderColor: '#7A1C42'}} />
              <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-lg border border-guinda/30">
          <h4 className="font-bold text-white mb-4">Últimas Entidades Aprendidas por el Grafo</h4>
          <div className="space-y-3">
            {(data?.new_entities || []).map((node: any) => (
              <div key={node.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-md border border-slate-700">
                <BrainCircuit className="w-5 h-5 text-dorado flex-shrink-0" />
                <p className="font-mono text-white truncate">{node.id}</p>
              </div>
            ))}
            {(data?.new_entities || []).length === 0 && (
              <p className="text-gray-500 text-sm">No se han aprendido nuevas entidades recientemente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}