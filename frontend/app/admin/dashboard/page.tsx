"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts"
import { Cpu, Users, Zap, Clock, Server, Database, RefreshCw } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) router.push("/admin/login")
    
    // FETCH DE DATOS REALES
    const fetchStats = async () => {
        try {
            const res = await fetch("https://api.xac.lat/api/v1/analytics/dashboard/stats")
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error("Error fetching stats", e)
        } finally {
            setLoading(false)
        }
    }
    
    fetchStats()
    // Actualizar cada 10 segundos
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)

  }, [router])

  if (loading) return <div className="flex h-full items-center justify-center text-ciay-brown"><RefreshCw className="animate-spin mr-2"/> Cargando datos reales...</div>

  return (
    <div className="space-y-8">
      {/* TARJETAS DE MÉTRICAS REALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-ciay-brown/10 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-ciay-slate uppercase tracking-wider">Interacciones Totales</p>
                <h3 className="text-3xl font-bold text-ciay-brown mt-2">{stats?.kpis?.total_interactions || 0}</h3>
                <p className="text-xs text-green-600 mt-1 font-medium">Registradas en DB</p>
              </div>
              <div className="p-3 bg-ciay-cream rounded-lg text-ciay-brown">
                <Cpu className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-ciay-brown/10 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-ciay-slate uppercase tracking-wider">Sesiones Únicas</p>
                <h3 className="text-3xl font-bold text-ciay-brown mt-2">{stats?.kpis?.total_sessions || 0}</h3>
                <p className="text-xs text-blue-600 mt-1 font-medium">Usuarios distintos</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
           </div>
        </div>
        
        {/* Estos siguen siendo estáticos porque no tenemos métricas de infraestructura real expuestas, pero son honestos */}
        <div className="bg-white p-6 rounded-xl border border-ciay-brown/10 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-ciay-slate uppercase tracking-wider">Estado API</p>
                <h3 className="text-xl font-bold text-green-600 mt-2">ONLINE</h3>
                <p className="text-xs text-ciay-slate mt-1 font-medium">DeepSeek v3</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <Zap className="w-6 h-6" />
              </div>
           </div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-ciay-brown/10 shadow-sm">
            <h4 className="text-sm font-bold text-ciay-brown mb-6 uppercase tracking-wide">Actividad Reciente (Mensajes/Hora)</h4>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.activity_chart || []}>
                        <defs>
                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C49B64" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#C49B64" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71706C', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#71706C', fontSize: 12}} />
                        <Tooltip contentStyle={{backgroundColor: '#fff', borderColor: '#C49B64', borderRadius: '8px'}} />
                        <Area type="monotone" dataKey="tokens" stroke="#624E32" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-ciay-brown/10 shadow-sm">
            <h4 className="text-sm font-bold text-ciay-brown mb-6 uppercase tracking-wide">Distribución de Temas</h4>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.intents_distribution || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fill: '#71706C', fontSize: 11}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#fff', borderColor: '#C49B64'}} />
                        <Bar dataKey="value" fill="#624E32" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  )
}