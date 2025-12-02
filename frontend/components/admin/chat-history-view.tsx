"use client"

import { useEffect, useState } from "react"
import { User, Bot, BrainCircuit, BarChart, FileText, RefreshCw } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

interface Message {
  id: string
  timestamp: string
  user_input: string
  bot_response: string
  metadata: any
}

export function ChatHistoryView({ sessionId }: { sessionId: string }) {
  const [history, setHistory] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const fetchHistory = async () => {
      setLoading(true)
      try {
        // --- FIX: USAR URL REAL (API_BASE_URL) ---
        const res = await fetch(`${API_BASE_URL}/api/v1/analytics/session/${sessionId}`)
        const data = await res.json()
        setHistory(data)
        if (data.length > 0) setSelectedMessage(data[0])
      } catch (error) { console.error("Error fetching history:", error) } 
      finally { setLoading(false) }
    }
    fetchHistory()
  }, [sessionId])

  if (loading) return <div className="flex items-center justify-center h-full text-ciay-brown"><RefreshCw className="animate-spin mr-2"/> Cargando conversación...</div>

  return (
    <div className="h-full flex flex-col md:flex-row bg-white">
      {/* COLUMNA IZQUIERDA: CHAT */}
      <div className="w-full md:w-1/2 h-full flex flex-col border-r border-gray-200">
        <header className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-bold text-ciay-brown uppercase tracking-wide text-sm">Historial de Chat</h3>
          <p className="text-xs text-gray-500 font-mono mt-1">ID: {sessionId}</p>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
          {history.map((msg) => (
            <div 
                key={msg.id} 
                onClick={() => setSelectedMessage(msg)} 
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedMessage?.id === msg.id 
                    ? 'bg-ciay-cream border-ciay-gold shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-50 rounded-full text-blue-600 mt-1">
                    <User className="w-4 h-4" />
                </div>
                <p className="text-sm text-gray-700 font-medium">{msg.user_input}</p>
              </div>
              <div className="flex items-start gap-3 mt-3 pt-3 border-t border-gray-100/50">
                <div className="p-1.5 bg-ciay-brown rounded-full text-white mt-1">
                    <Bot className="w-4 h-4" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{msg.bot_response}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: METADATOS */}
      <div className="w-full md:w-1/2 h-full flex flex-col bg-gray-50">
        <header className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-bold text-ciay-brown uppercase tracking-wide text-sm">Análisis Cognitivo</h3>
          <p className="text-xs text-gray-500 mt-1">Detalle del mensaje seleccionado</p>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {selectedMessage ? (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-ciay-gold" /> Intención Detectada
                </p>
                <p className="text-lg font-bold text-ciay-brown">{selectedMessage.metadata.intent}</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-ciay-gold" /> Confianza del Modelo
                </p>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500" 
                            style={{width: `${(selectedMessage.metadata.score || 0) * 100}%`}}
                        ></div>
                    </div>
                    <span className="text-sm font-mono text-gray-600">
                        {((selectedMessage.metadata.score || 0) * 100).toFixed(0)}%
                    </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-1">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-ciay-gold" /> Traza de Razonamiento (JSON)
                </p>
                <div className="bg-slate-900 rounded-md p-3 overflow-hidden">
                    <pre className="text-xs font-mono text-green-400 overflow-auto max-h-60 custom-scrollbar">
                      {JSON.stringify(selectedMessage.metadata.steps, null, 2)}
                    </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Selecciona un mensaje para ver su análisis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}