"use client"

import { useEffect, useState } from "react"
import { ChatHistoryView } from "./chat-history-view"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { RefreshCw } from "lucide-react"

interface Session {
  session_id: string
  message_count: number
  last_activity: string
}

export function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:8000/api/v1/analytics/sessions")
      if (res.ok) setSessions(await res.json())
      else setSessions([])
    } catch (error) { console.error("Error fetching sessions:", error); setSessions([]) } 
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="h-full bg-slate-900 p-0 flex flex-col">
      <div className="flex-1 overflow-hidden rounded-lg border border-guinda/20 bg-black/20">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full text-dorado"><RefreshCw className="w-6 h-6 mr-2 animate-spin" /> Cargando sesiones...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-gray-400 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-medium">ID de Sesión</th>
                  <th className="p-4 font-medium">Mensajes</th>
                  <th className="p-4 font-medium">Última Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-gray-300">
                {sessions.map((session) => (
                  <tr key={session.session_id} onClick={() => setSelectedSessionId(session.session_id)} className="hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <td className="p-4 font-mono text-dorado">{session.session_id}</td>
                    <td className="p-4 text-center">{session.message_count}</td>
                    <td className="p-4 text-gray-500">{new Date(session.last_activity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Sheet open={!!selectedSessionId} onOpenChange={(open) => !open && setSelectedSessionId(null)}>
        <SheetContent className="w-full sm:max-w-3xl bg-slate-950 border-l-2 border-guinda p-0">
          <SheetTitle className="sr-only">Historial de Chat</SheetTitle>
          <SheetDescription className="sr-only">Vista detallada de la conversación y sus metadatos.</SheetDescription>
          {selectedSessionId && <ChatHistoryView sessionId={selectedSessionId} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}