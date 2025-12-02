"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Network, RefreshCw, Loader2, BrainCircuit } from "lucide-react"
import dynamic from "next/dynamic"
import { API_BASE_URL, WS_BASE_URL } from "@/lib/config"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-black text-dorado"><Loader2 className="w-10 h-10 animate-spin" /></div>
})

export function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [aiMode, setAiMode] = useState(false)
  const fgRef = useRef<any>()

  const COLORS = {
    CIAY: "#ff0055",
    Gobierno: "#00d4ff",
    Empresa: "#ffd700",
    Academia: "#00ff9d",
    Default: "#ffffff"
  }

  const processNodes = (data: any) => {
      if (!data.nodes) return { nodes: [], links: [] };
      return {
          nodes: data.nodes.map((node: any) => ({
            ...node,
            color: node.id.includes("CIAY") ? COLORS.CIAY :
                   node.id.includes("Gobierno") || node.id.includes("Secretaría") ? COLORS.Gobierno :
                   node.id.includes("Startup") || node.id.includes("AWS") || node.id.includes("Google") ? COLORS.Empresa :
                   node.id.includes("UADY") || node.id.includes("Tecnológico") ? COLORS.Academia :
                   COLORS.Default,
            val: node.id.includes("CIAY") ? 20 : 8
          })),
          links: data.links
      }
  }

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setAiMode(false)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/graph`)
      const data = await res.json()
      setGraphData(processNodes(data))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchGraph()
    
    const ws = new WebSocket(`${WS_BASE_URL}/ws/logs`)
    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data)
            if (msg.type === "graph_data") {
                setAiMode(true)
                setGraphData(processNodes(msg.payload))
                if (fgRef.current) {
                    fgRef.current.zoomToFit(1000, 50)
                }
            }
        } catch {}
    }
    return () => ws.close()
  }, [fetchGraph])

  return (
    <div className={`h-full flex flex-col relative overflow-hidden border-l border-guinda/20 transition-all duration-1000 ${aiMode ? 'bg-slate-950' : 'bg-black'}`}>
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-500 ${aiMode ? 'bg-guinda/20 border-dorado' : 'bg-black/60 border-white/10'}`}>
                {aiMode ? <BrainCircuit className="w-5 h-5 text-dorado animate-pulse" /> : <Network className="w-4 h-4 text-gray-400" />}
                <span className={`text-sm font-bold tracking-widest ${aiMode ? 'text-dorado' : 'text-white'}`}>
                    {aiMode ? "ENFOQUE NEURO-SIMBÓLICO" : "TOPOLOGÍA 2D"}
                </span>
            </div>
        </div>
        <div className="pointer-events-auto">
            <button onClick={fetchGraph} className="p-3 bg-slate-900/80 hover:bg-guinda text-white rounded-full border border-white/10 transition-all hover:scale-110">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      <div className="flex-1 cursor-move">
        <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="id"
            backgroundColor="rgba(0,0,0,0)"
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            linkColor={() => aiMode ? "#d4af37" : "#334155"}
            linkWidth={aiMode ? 2 : 1}
            linkDirectionalParticles={aiMode ? 4 : 2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={3}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.id;
                const fontSize = 12/globalScale;
                const radius = 5;
                ctx.shadowColor = node.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(label, node.x, node.y + radius + fontSize);
            }}
        />
      </div>
    </div>
  )
}