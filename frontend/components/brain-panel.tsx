"use client"

import { useState } from "react"
import { Terminal, Network } from "lucide-react"
import { TransparencyTerminal } from "./transparency-terminal"
import { KnowledgeGraph } from "./knowledge-graph"

type TabType = "terminal" | "graph"

export function BrainPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("graph")

  const tabs = [
    { id: "graph" as TabType, label: "Mapa de Contexto", icon: Network },
    { id: "terminal" as TabType, label: "Traza de Ejecución", icon: Terminal },
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header del Panel */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="px-6 py-3 flex justify-between items-center">
          <h2 className="text-xs font-bold text-ciay-brown uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="text-green-500 animate-pulse">●</span> Motor Cognitivo
          </h2>
          
          <div className="flex bg-gray-200/50 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-ciay-brown shadow-sm border border-gray-200"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className={`h-full w-full ${activeTab === "terminal" ? "block" : "hidden"}`}>
            <TransparencyTerminal />
        </div>
        <div className={`h-full w-full ${activeTab === "graph" ? "block" : "hidden"}`}>
            <KnowledgeGraph />
        </div>
      </div>
    </div>
  )
}