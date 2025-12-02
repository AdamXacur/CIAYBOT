"use client"

import { useEffect, useState } from "react"
import { ChatHistoryView } from "./chat-history-view"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { RefreshCw } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

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
      // --- FIX: USAR URL REAL ---
      const res = await fetch(`${API_BASE_URL}/api/v1/analytics/sessions`)
      if (res.ok) setSessions(await res.json())
      else setSessions([])
    } catch (error) { console.error("Error fetching sessions:", error); setSessions([]) } 
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="h-full bg-white p-0 flex flex-col rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full text-ciay-brown"><RefreshCw className="w-6 h-6 mr-2 animate-spin" /> Cargando sesiones...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-medium">ID de Sesión</th>
                  <th className="p-4 font-medium">Mensajes</th>
                  <th className="p-4 font-medium">Última Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sessions.map((session) => (
                  <tr key={session.session_id} onClick={() => setSelectedSessionId(session.session_id)} className="hover:bg-ciay-cream/50 transition-colors cursor-pointer">
                    <td className="p-4 font-mono text-ciay-brown font-bold">{session.session_id}</td>
                    <td className="p-4 text-center">{session.message_count}</td>
                    <td className="p-4 text-gray-500">{new Date(session.last_activity).toLocaleString()}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">No hay sesiones registradas aún.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Sheet open={!!selectedSessionId} onOpenChange={(open) => !open && setSelectedSessionId(null)}>
        <SheetContent className="w-full sm:max-w-3xl bg-white border-l-4 border-ciay-brown p-0">
          <SheetTitle className="sr-only">Historial</SheetTitle>
          <SheetDescription className="sr-only">Detalle</SheetDescription>
          {selectedSessionId && <ChatHistoryView sessionId={selectedSessionId} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}