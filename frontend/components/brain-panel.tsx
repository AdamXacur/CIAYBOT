"use client"

import { useState } from "react"
import { Terminal, Activity } from "lucide-react"
import { TransparencyTerminal } from "./transparency-terminal"

// Eliminamos la dependencia del Grafo para que no cargue
// import { KnowledgeGraph } from "./knowledge-graph"

type TabType = "terminal"

export function BrainPanel() {
  // Forzamos la vista de terminal
  const [activeTab, setActiveTab] = useState<TabType>("terminal")

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del Panel Simplificado */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="px-6 py-3 flex justify-between items-center">
          <h2 className="text-xs font-bold text-ciay-brown uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="text-green-500 animate-pulse">●</span> Monitor de Sistema
          </h2>
          
          <div className="flex bg-gray-200/50 rounded-lg p-1">
            <button
              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap bg-white text-ciay-brown shadow-sm border border-gray-200"
            >
              <Terminal className="w-3 h-3" />
              Traza de Ejecución
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Solo renderizamos la terminal */}
        <div className="h-full w-full block">
            <TransparencyTerminal />
        </div>
      </div>
    </div>
  )
}