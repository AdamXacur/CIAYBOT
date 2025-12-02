"use client"

import { useState } from "react"
import { Terminal, Network } from "lucide-react" // Se elimina BarChart3
import { TransparencyTerminal } from "./transparency-terminal"
import { KnowledgeGraph } from "./knowledge-graph"
// Se elimina LiveAnalytics

type TabType = "terminal" | "graph"

export function BrainPanel({ sessionId }: { sessionId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>("terminal")

  // --- FIX: Eliminar la pestaña de Analítica de la vista pública ---
  const tabs = [
    { id: "terminal" as TabType, label: "Terminal", icon: Terminal },
    { id: "graph" as TabType, label: "Grafo", icon: Network },
  ]
  // ----------------------------------------------------------------

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-guinda/30 bg-slate-900/80">
        <div className="px-4 sm:px-6 py-3 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-dorado uppercase tracking-wider">Cerebro Digital</h2>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto custom-scrollbar pb-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-guinda text-white" : "bg-slate-800/50 text-gray-400 hover:bg-slate-700"}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-black/40 relative">
        {activeTab === "terminal" && <TransparencyTerminal sessionId={sessionId} />}
        {activeTab === "graph" && <KnowledgeGraph />}
        {/* Se elimina la renderización de LiveAnalytics */}
      </div>
    </div>
  )
}