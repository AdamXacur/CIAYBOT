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
      <div className="min-h-screen bg-ciay-cream text-slate-800 relative overflow-hidden font-sans">
        
        <header className="relative z-10 border-b border-ciay-brown/10 bg-white shadow-sm">
          <div className="h-[4px] bg-ciay-brown"></div>
          
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              
              <div className="flex items-center gap-6">
                <img 
                  src="/logo-color.svg" 
                  alt="CIAY Logo" 
                  className="h-14 w-auto"
                />
                
                <div className="w-px h-10 bg-ciay-silver hidden sm:block"></div>
                
                <div className="hidden sm:block">
                  <h1 className="text-sm font-bold text-ciay-brown tracking-wide uppercase">
                    Plataforma Neuro-Simbólica
                  </h1>
                  {/* --- CAMBIO DE TEXTO AQUÍ --- */}
                  <p className="text-[10px] text-ciay-slate font-medium tracking-widest mt-0.5">
                    BASE DE CONOCIMIENTO INSTITUCIONAL
                  </p>
                  {/* --------------------------- */}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusIndicator />
                <SheetTrigger asChild>
                  <button className="md:hidden p-2 bg-white rounded-lg border border-ciay-brown/20 text-ciay-brown shadow-sm">
                    <BrainCircuit className="w-6 h-6" />
                  </button>
                </SheetTrigger>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 h-[calc(100vh-90px)]">
          <div className="h-full flex flex-col md:flex-row">
            <div className="w-full md:w-[45%] md:border-r border-ciay-brown/10 bg-white h-full relative">
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none"></div>
               <ChatPanel sessionId={sessionId} />
            </div>

            <div className="hidden md:block w-full md:w-[55%] bg-white h-full border-l-4 border-ciay-gold relative shadow-2xl">
              <BrainPanel />
            </div>

            <SheetContent side="bottom" className="md:hidden h-[85%] bg-white border-t-4 border-ciay-gold p-0">
                <SheetTitle className="sr-only">Motor Digital</SheetTitle>
                <SheetDescription className="sr-only">Visualización técnica.</SheetDescription>
                <BrainPanel />
            </SheetContent>
          </div>
        </main>
      </div>
    </Sheet>
  )
}