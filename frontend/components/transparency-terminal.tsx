"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, Wifi, WifiOff, ChevronRight, Code } from "lucide-react"
import { WS_BASE_URL } from "@/lib/config"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface LogEntry {
  timestamp: string
  state: string
  message: string
  status?: string
  data?: any
}

export function TransparencyTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/logs`)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        addLog("SYSTEM", "Enlace WebSocket ACTIVO [SECURE].", "success")
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "log") {
              addLog(
                  data.payload.step || "INFO", 
                  data.payload.detail || data.payload.message, 
                  data.payload.status,
                  data.payload.data
              )
          }
        } catch (e) { console.error(e) }
      }

      ws.onclose = () => {
        setIsConnected(false)
        setTimeout(() => { if (wsRef.current?.readyState === WebSocket.CLOSED) connectWebSocket() }, 3000)
      }
      
      ws.onerror = () => { setIsConnected(false) }
    }

    const timer = setTimeout(connectWebSocket, 500)
    return () => { clearTimeout(timer); if (wsRef.current) wsRef.current.close() }
  }, [])

  const addLog = (state: string, message: string, status: string = "info", data: any = null) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      state,
      message,
      status,
      data
    }
    setLogs((prev) => [...prev.slice(-50), newLog])
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const formatTime = (iso: string) => {
      try { return new Date(iso).toLocaleTimeString("es-MX", { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) }
      catch { return "" }
  }

  return (
    <>
      <div className="h-full bg-black p-6 overflow-hidden flex flex-col font-mono border-l border-guinda/20">
        <div className="flex items-center justify-between mb-4 border-b border-green-900/50 pb-2">
          <div className="flex items-center gap-2">
              <Activity className={`w-5 h-5 ${isConnected ? "text-green-400 animate-pulse" : "text-red-500"}`} />
              <span className={`${isConnected ? "text-green-400" : "text-red-500"} text-sm uppercase tracking-wider font-bold`}>
              {isConnected ? "LIVE SYSTEM KERNEL" : "OFFLINE"}
              </span>
          </div>
          {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        </div>

        <div className="flex-1 overflow-y-auto text-xs sm:text-sm space-y-1 custom-scrollbar pr-2 font-mono">
          {logs.map((log, index) => (
            <div
              key={index}
              onClick={() => log.data && setSelectedLog(log)}
              className={`flex gap-3 px-2 py-1 rounded border-l-2 cursor-pointer group transition-all ${
                  log.status === 'running' ? 'border-blue-500 bg-blue-900/10 text-blue-300' :
                  log.status === 'failed' ? 'border-red-500 bg-red-900/10 text-red-400' :
                  log.status === 'success' ? 'border-green-500 bg-green-900/10 text-green-400' :
                  'border-transparent hover:bg-white/5 text-gray-300'
              }`}
            >
              <span className="text-gray-600 flex-shrink-0 select-none w-16">
                {formatTime(log.timestamp)}
              </span>
              <span className={`flex-shrink-0 font-bold w-24 ${
                  log.state.includes("STATE") ? "text-dorado" : "text-gray-500"
              }`}>
                {log.state}
              </span>
              <span className="break-words flex-1 flex items-center justify-between">
                {log.message}
                {log.data && <Code className="w-3 h-3 opacity-0 group-hover:opacity-100 text-dorado" />}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="bg-slate-950 border-l border-guinda/30 text-white w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-dorado font-mono uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Inspector de Proceso
            </SheetTitle>
            <SheetDescription className="text-gray-400">
              Detalle técnico del estado: <span className="text-white font-bold">{selectedLog?.state}</span>
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Mensaje de Log</h4>
                <p className="text-sm font-mono text-green-400">{selectedLog?.message}</p>
            </div>

            {selectedLog?.data && (
                <div className="bg-black p-4 rounded border border-slate-800 relative group">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between">
                        Payload de Datos (JSON)
                        <span className="text-[10px] bg-slate-800 px-2 rounded text-gray-400">READ-ONLY</span>
                    </h4>
                    <pre className="text-xs font-mono text-blue-300 overflow-x-auto custom-scrollbar">
                        {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                </div>
            )}

            <div className="text-xs text-gray-600 font-mono text-center pt-10">
                TIMESTAMP: {selectedLog?.timestamp} <br/>
                TRACE ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}