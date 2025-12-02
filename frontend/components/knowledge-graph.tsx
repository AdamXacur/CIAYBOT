"use client"

import React, { useEffect, useState, useRef, useCallback, forwardRef } from "react"
import { Network, RefreshCw, Loader2, BrainCircuit } from "lucide-react"
import dynamic from "next/dynamic"

// Carga dinámica del componente del grafo
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-black text-dorado"><Loader2 className="w-10 h-10 animate-spin" /></div>
})

// --- FIX: Envolver el componente con forwardRef ---
const ForwardedForceGraph = forwardRef((props: any, ref) => (
  <ForceGraph2D {...props} ref={ref} />
));
ForwardedForceGraph.displayName = 'ForwardedForceGraph';
// -------------------------------------------------

export function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
  const [loading, setLoading] = useState(true)
  const [aiMode, setAiMode] = useState(false)
  const fgRef = useRef<any>()

  const fetchGraph = useCallback(async () => {
    setLoading(true); setAiMode(false)
    try {
      const res = await fetch("http://localhost:8000/api/v1/graph")
      const data = await res.json()
      setGraphData(data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchGraph()
    const ws = new WebSocket("ws://localhost:8000/ws/logs/graph-listener")
    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data)
            if (msg.type === "graph_data") {
                setAiMode(true)
                setGraphData(msg.payload)
                if (fgRef.current) { fgRef.current.zoomToFit(1000, 50) }
            }
        } catch {}
    }
    return () => ws.close()
  }, [fetchGraph])

  useEffect(() => {
    if (fgRef.current) {
      const engine = fgRef.current.d3Force;
      if (engine) {
        engine('charge').strength(-150);
        engine('link').distance(80);
      }
    }
  }, [graphData]);

  return (
    <div className={`h-full flex flex-col relative overflow-hidden border-l border-guinda/20 transition-all duration-1000 ${aiMode ? 'bg-slate-950' : 'bg-black'}`}>
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-500 ${aiMode ? 'bg-guinda/20 border-dorado' : 'bg-black/60 border-white/10'}`}>
            {aiMode ? <BrainCircuit className="w-5 h-5 text-dorado animate-pulse" /> : <Network className="w-4 h-4 text-gray-400" />}
            <span className={`text-sm font-bold tracking-widest ${aiMode ? 'text-dorado' : 'text-white'}`}>{aiMode ? "ENFOQUE NEURO-SIMBÓLICO" : "TOPOLOGÍA GENERAL"}</span>
        </div>
        <div className="pointer-events-auto">
            <button onClick={fetchGraph} className="p-3 bg-slate-900/80 hover:bg-guinda text-white rounded-full border border-white/10 transition-all hover:scale-110">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>
      <div className="flex-1 cursor-move">
        <ForwardedForceGraph
            ref={fgRef}
            graphData={graphData}
            nodeLabel="id"
            backgroundColor="rgba(0,0,0,0)"
            linkColor={() => aiMode ? "#d4af37" : "#334155"}
            linkWidth={aiMode ? 1.5 : 0.5}
            linkDirectionalParticles={aiMode ? 2 : 0}
            linkDirectionalParticleSpeed={0.008}
            linkDirectionalParticleWidth={2.5}
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
                const label = node.id;
                const fontSize = 12/globalScale;
                const radius = node.val / 4 || 3;
                const color = node.group === 1 ? '#ff0055' : '#ffffff';
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
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