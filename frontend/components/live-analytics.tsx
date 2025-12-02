"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { TrendingUp, MessageSquare, Activity, RefreshCw } from "lucide-react"
import { API_BASE_URL } from "@/lib/config" // <--- IMPORTANTE

export function LiveAnalytics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      // USAMOS LA URL DE PRODUCCIÓN
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/dashboard/stats`)
      const data = await res.json()
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) return (
      <div className="h-full flex items-center justify-center text-dorado animate-pulse">
          <RefreshCw className="w-6 h-6 mr-2 animate-spin" /> Cargando métricas en tiempo real...
      </div>
  )

  const topicsData = stats.intents_distribution.map((i: any) => ({
      name: i.name,
      value: i.value
  }))

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-guinda/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Interacciones Totales</p>
              <p className="text-3xl font-bold text-dorado mt-1">{stats.total_interactions}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-guinda opacity-50" />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-guinda/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Sentimiento Promedio</p>
              <p className={`text-3xl font-bold mt-1 ${stats.average_sentiment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.average_sentiment.toFixed(2)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-4 border border-guinda/30">
             <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Estado del Motor</p>
              <p className="text-xl font-bold text-green-400 mt-1">OPTIMAL</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-guinda/20">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Distribución de Intenciones (Real)</h4>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fill: '#9ca3af', fontSize: 10}} />
                        <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#7A1C42'}} />
                        <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-slate-800/30 rounded-lg p-4 border border-guinda/20">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Feed de Actividad</h4>
            <div className="space-y-2">
                {stats.recent_activity.map((log: any, idx: number) => (
                    <div key={idx} className="text-xs border-b border-gray-700 pb-2">
                        <div className="flex justify-between text-gray-500 mb-1">
                            <span>{log.time}</span>
                            <span className="text-dorado">{log.intent}</span>
                        </div>
                        <div className="text-gray-300 truncate">{log.user}</div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
--- END OF CONTENT ---