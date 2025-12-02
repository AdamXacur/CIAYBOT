"use client"

import { useState } from "react"
import { Terminal, Network, BarChart3 } from "lucide-react"
import { TransparencyTerminal } from "./transparency-terminal"
import { KnowledgeGraph } from "./knowledge-graph"
import { LiveAnalytics } from "./live-analytics"

type TabType = "terminal" | "graph" | "analytics"

export function BrainPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("terminal")

  const tabs = [
    { id: "terminal" as TabType, label: "Terminal", icon: Terminal },
    { id: "graph" as TabType, label: "Grafo 3D", icon: Network },
    { id: "analytics" as TabType, label: "Analítica", icon: BarChart3 },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-guinda/30 bg-slate-900/80">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-dorado uppercase tracking-wider">Cerebro Digital</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-guinda text-white shadow-lg shadow-guinda/20"
                      : "bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-black/40 relative">
        {/* CORRECCIÓN: Renderizar todos pero ocultar con CSS para mantener estado */}
        <div className={`h-full w-full ${activeTab === "terminal" ? "block" : "hidden"}`}>
            <TransparencyTerminal />
        </div>
        <div className={`h-full w-full ${activeTab === "graph" ? "block" : "hidden"}`}>
            <KnowledgeGraph />
        </div>
        <div className={`h-full w-full ${activeTab === "analytics" ? "block" : "hidden"}`}>
            <LiveAnalytics />
        </div>
      </div>
    </div>
  )
}