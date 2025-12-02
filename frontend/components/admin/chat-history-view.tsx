"use client"

import { useEffect, useState } from "react"
import { User, Cpu, Bot, BrainCircuit, BarChart, FileText } from "lucide-react"

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
        const res = await fetch(`http://localhost:8000/api/v1/analytics/session/${sessionId}`)
        const data = await res.json()
        setHistory(data)
        if (data.length > 0) setSelectedMessage(data[0])
      } catch (error) { console.error("Error fetching history:", error) } 
      finally { setLoading(false) }
    }
    fetchHistory()
  }, [sessionId])

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 h-full flex flex-col border-r border-guinda/30">
        <header className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-white">Historial de Chat</h3>
          <p className="text-xs text-dorado font-mono">{sessionId}</p>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {history.map((msg) => (
            <div key={msg.id} onClick={() => setSelectedMessage(msg)} className={`p-3 rounded-lg cursor-pointer border ${selectedMessage?.id === msg.id ? 'bg-slate-700 border-dorado' : 'bg-slate-800 border-transparent'}`}>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-300">{msg.user_input}</p>
              </div>
              <div className="flex items-start gap-3 mt-3 pt-3 border-t border-slate-700">
                <Bot className="w-5 h-5 text-dorado flex-shrink-0 mt-1" />
                <p className="text-sm text-white">{msg.bot_response}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2 h-full flex flex-col">
        <header className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-white">Metadatos de Interacción</h3>
          <p className="text-xs text-gray-500">Análisis del mensaje seleccionado</p>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {selectedMessage && (
            <>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-xs text-gray-400 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-dorado" /> Intención Detectada</p>
                <p className="text-lg font-bold text-dorado">{selectedMessage.metadata.intent}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-xs text-gray-400 flex items-center gap-2"><BarChart className="w-4 h-4 text-dorado" /> Sentimiento</p>
                <p className="text-lg font-bold text-white">{selectedMessage.metadata.sentiment} ({selectedMessage.metadata.score.toFixed(2)})</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-xs text-gray-400 flex items-center gap-2"><FileText className="w-4 h-4 text-dorado" /> Pasos de Ejecución (Kernel)</p>
                <pre className="text-xs font-mono text-green-400 bg-black p-2 rounded mt-2 overflow-auto max-h-60 custom-scrollbar">
                  {JSON.stringify(selectedMessage.metadata.steps, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}