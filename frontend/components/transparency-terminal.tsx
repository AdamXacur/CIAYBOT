"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, Database, Cpu, Server, Code2, Zap, Radio, Lock, FileJson } from "lucide-react"
import { WS_BASE_URL } from "@/lib/config"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`${WS_BASE_URL}/ws/logs`)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        // Log inicial real del sistema
        addLog("SISTEMA", "Conexión WebSocket establecida.", "success")
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "log") {
              const msg = data.payload.detail || data.payload.message || "";
              
              if (msg.includes("Sintetizando") || msg.includes("Synthesizing")) {
                  setIsStreaming(true);
                  setTimeout(() => setIsStreaming(false), 4000);
              }

              addLog(
                  data.payload.step || "INFO", 
                  msg, 
                  data.payload.status,
                  data.payload.data // <--- AQUÍ PASAMOS LA DATA REAL, SIN MODIFICAR
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
      data: data // CERO INVENTOS. Si es null, es null.
    }
    setLogs((prev) => [...prev.slice(-50), newLog])
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const getIcon = (state: string) => {
      if (state.includes("RAG") || state.includes("DB")) return <Database className="w-4 h-4" />
      if (state.includes("LLM") || state.includes("Sintetizando")) return <Cpu className="w-4 h-4" />
      if (state.includes("TOOL")) return <Server className="w-4 h-4" />
      return <Activity className="w-4 h-4" />
  }

  return (
    <>
      <div className="h-full bg-gray-50 flex flex-col font-sans border-l border-gray-200 relative">
        
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-20 relative">
            <div>
                <h3 className="text-sm font-bold text-ciay-brown uppercase tracking-wider">Traza de Ejecución</h3>
                <p className="text-[10px] text-gray-500">Datos en tiempo real (Sin Simulación)</p>
            </div>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {isConnected ? "ONLINE" : "OFFLINE"}
            </div>
        </div>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isStreaming ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-ciay-gold/10 border-b border-ciay-gold/30 p-3 flex items-center gap-4">
                <div className="relative flex h-8 w-8 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ciay-gold opacity-75"></span>
                    <div className="relative inline-flex rounded-full h-6 w-6 bg-ciay-gold items-center justify-center">
                        <Radio className="w-3 h-3 text-white" />
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-ciay-brown uppercase tracking-wider flex items-center gap-2">
                        GENERANDO RESPUESTA
                        <Zap className="w-3 h-3 text-ciay-gold fill-ciay-gold animate-pulse" />
                    </p>
                    <p className="text-[10px] text-ciay-slate font-mono mt-0.5">
                        Streaming desde DeepSeek API...
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
          {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  <p className="text-xs">Esperando interacción...</p>
              </div>
          )}
          
          {logs.map((log, index) => {
            const hasData = log.data && Object.keys(log.data).length > 0;

            return (
                <div
                key={index}
                onClick={() => hasData && setSelectedLog(log)}
                className={`group relative bg-white p-3 rounded-lg border transition-all duration-200 shadow-sm 
                    ${hasData 
                        ? 'cursor-pointer hover:border-ciay-gold hover:shadow-md border-l-4 border-l-ciay-gold/50' 
                        : 'cursor-default border-gray-100 opacity-80'
                    } 
                    animate-in slide-in-from-bottom-2 fade-in duration-300`}
                >
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${
                        log.status === 'running' ? 'bg-blue-50 text-blue-600' :
                        log.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                        {getIcon(log.state)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                {log.state.replace(/[\[\]]/g, '')}
                            </span>
                            <span className="text-[9px] text-gray-300 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                            </span>
                        </div>
                        <p className={`text-xs font-medium leading-snug ${hasData ? 'text-gray-800' : 'text-gray-500'}`}>
                            {log.message}
                        </p>
                    </div>

                    {hasData && (
                        <div className="flex flex-col items-center justify-center pl-2 border-l border-gray-100">
                            <div className="p-1 rounded bg-ciay-cream text-ciay-brown group-hover:bg-ciay-gold group-hover:text-white transition-colors">
                                <FileJson className="w-3 h-3" />
                            </div>
                        </div>
                    )}
                </div>
                </div>
            )
          })}
          <div ref={logsEndRef} />
        </div>
      </div>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white p-0">
          <div className="bg-ciay-brown p-6 text-white">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-ciay-gold" />
                    Inspección de Proceso
                </SheetTitle>
                <SheetDescription className="text-ciay-cream/80">
                  Datos reales del servidor
                </SheetDescription>
              </SheetHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Evento</h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 font-medium text-sm">
                    {selectedLog?.message}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex justify-between items-center">
                    Payload JSON
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">RAW DATA</span>
                </h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto shadow-inner">
                    <pre className="text-xs font-mono text-green-400 leading-relaxed">
                        {JSON.stringify(selectedLog?.data, null, 2)}
                    </pre>
                </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}