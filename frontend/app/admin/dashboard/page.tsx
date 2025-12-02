"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts"
import { Cpu, Users, Zap, Clock, Server } from "lucide-react"

// Datos simulados para la demo
const data = [
  { name: '09:00', tokens: 4000, latency: 240 },
  { name: '10:00', tokens: 3000, latency: 139 },
  { name: '11:00', tokens: 2000, latency: 980 },
  { name: '12:00', tokens: 2780, latency: 390 },
  { name: '13:00', tokens: 1890, latency: 480 },
  { name: '14:00', tokens: 2390, latency: 380 },
  { name: '15:00', tokens: 3490, latency: 430 },
]

export default function AdminDashboard() {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) router.push("/admin/login")
  }, [router])

  return (
    <div className="space-y-8">
      {/* TARJETAS DE MÉTRICAS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">AWS Token Usage</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">1.2M</h3>
                <p className="text-xs text-green-600 mt-1 font-medium">↑ 12% vs ayer</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <Cpu className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sesiones Activas</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">843</h3>
                <p className="text-xs text-blue-600 mt-1 font-medium">● En tiempo real</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Latencia Bedrock</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">420ms</h3>
                <p className="text-xs text-green-600 mt-1 font-medium">Titan Express v2</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <Zap className="w-6 h-6" />
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Uptime SLA</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">99.9%</h3>
                <p className="text-xs text-gray-400 mt-1 font-medium">Últimos 30 días</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <Clock className="w-6 h-6" />
              </div>
           </div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Gráfico Grande */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-6">Consumo de Inferencia (Tokens/Hora)</h4>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#C49B64" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#C49B64" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="tokens" stroke="#624E32" fillOpacity={1} fill="url(#colorTokens)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Estado de Servicios AWS */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-6">Estado de Infraestructura AWS</h4>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="text-sm font-bold text-gray-700">Amazon Bedrock</p>
                            <p className="text-[10px] text-gray-500">us-east-1</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">OPERATIONAL</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="text-sm font-bold text-gray-700">RDS PostgreSQL</p>
                            <p className="text-[10px] text-gray-500">db.t3.large</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">HEALTHY</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="text-sm font-bold text-gray-700">Cognito Auth</p>
                            <p className="text-[10px] text-gray-500">User Pool ID: us-east-1_...</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">ACTIVE</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  )
}