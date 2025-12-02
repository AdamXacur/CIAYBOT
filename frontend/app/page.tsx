"use client"
import { useState, useEffect } from "react"
import { ChatPanel } from "@/components/chat-panel"
import { BrainPanel } from "@/components/brain-panel"
import { StatusIndicator } from "@/components/status-indicator"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { BrainCircuit } from "lucide-react"

export default function Page() {
  const [sessionId, setSessionId] = useState<string>("")
  
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 9))
  }, [])

  return (
    <Sheet>
      <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
        <div className="fixed inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#7A1C42_1px,transparent_1px),linear-gradient(to_bottom,#7A1C42_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <header className="relative z-10 border-b border-guinda/30 bg-slate-900/95 backdrop-blur-sm">
          <div className="h-1 bg-gradient-to-r from-guinda via-dorado to-guinda"></div>
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-dorado to-guinda rounded-lg flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold text-white">C</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">CIAY</h1>
                  <p className="text-[10px] sm:text-xs text-dorado uppercase tracking-[0.2em] font-medium">
                    Inteligencia Artificial Yucatán
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusIndicator />
                <SheetTrigger asChild>
                  <button className="md:hidden p-2 bg-slate-800 rounded-lg border border-guinda/50 text-dorado">
                    <BrainCircuit className="w-5 h-5" />
                  </button>
                </SheetTrigger>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 h-[calc(100vh-88px)] sm:h-[calc(100vh-96px)]">
          <div className="h-full flex flex-col md:flex-row">
            <div className="w-full md:w-[40%] md:border-r border-guinda/30 bg-slate-800/50 backdrop-blur-sm h-full">
              <ChatPanel sessionId={sessionId} />
            </div>

            <div className="hidden md:block w-full md:w-[60%] bg-slate-900/50 h-full">
              <BrainPanel sessionId={sessionId} />
            </div>

            <SheetContent side="bottom" className="md:hidden h-[85%] bg-slate-950 border-t-2 border-guinda p-0">
                {/* --- FIX: Añadir Título y Descripción para accesibilidad --- */}
                <SheetTitle className="sr-only">Cerebro Digital</SheetTitle>
                <SheetDescription className="sr-only">Panel con la terminal, grafo de conocimiento y analíticas.</SheetDescription>
                {/* --------------------------------------------------------- */}
                <BrainPanel sessionId={sessionId} />
            </SheetContent>
          </div>
        </main>
      </div>
    </Sheet>
  )
}