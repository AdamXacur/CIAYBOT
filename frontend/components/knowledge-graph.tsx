"use client"

import { useEffect, useState, useRef } from "react"
import { Network, Share2, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { WS_BASE_URL, API_BASE_URL } from "@/lib/config"

const ForceGraph2D = dynamic(() => import("react-force-graph-2d").then(mod => {
  const ForceGraphComponent = mod.default;
  return ({ forwardedRef, ...props }: any) => <ForceGraphComponent ref={forwardedRef} {...props} />;
}), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full bg-white text-ciay-brown"><Loader2 className="w-8 h-8 animate-spin" /></div>
});

export function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const fgRef = useRef<any>()

  const COLORS = {
    ROOT: "#624E32",    // Café
    PILLAR: "#C49B64",  // Dorado
    ACTIVE: "#EAB308",  // Amarillo (Highlight)
    TEXT: "#475569"
  }

  useEffect(() => {
      fetch(`${API_BASE_URL}/api/v1/graph`)
        .then(res => res.json())
        .then(data => setGraphData(data))
        .catch(err => console.error("Error loading graph:", err));
  }, []);

  // --- FÍSICAS AGRESIVAS PARA SEPARACIÓN ---
  useEffect(() => {
    if (fgRef.current) {
        // 1. Repulsión Extrema: Los nodos se empujan con mucha fuerza
        fgRef.current.d3Force('charge').strength(-4000); 
        
        // 2. Distancia de Enlace Larga: Obliga a los satélites a alejarse del centro
        fgRef.current.d3Force('link').distance(250);
        
        // 3. Centrado Suave: Mantiene el grafo en pantalla pero permite expansión
        fgRef.current.d3Force('center').strength(0.5);
        
        fgRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/logs`)
    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data)
            if (msg.type === "graph_heat") {
                const { node_id, new_weight } = msg.payload;
                setGraphData((prev: any) => ({
                    ...prev,
                    nodes: prev.nodes.map((n: any) => 
                        n.id === node_id ? { ...n, val: new_weight } : n
                    )
                }));
                setActiveNode(node_id);
                setTimeout(() => setActiveNode(null), 2000);
            }
        } catch {}
    }
    return () => ws.close()
  }, [])

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-white">
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow-sm">
            <Share2 className="w-4 h-4 text-ciay-brown" />
            <span className="text-xs font-bold text-ciay-brown tracking-widest uppercase">
                Mapa de Contexto (Live)
            </span>
        </div>
      </div>

      <div className="flex-1 cursor-move">
        <ForceGraph2D
            forwardedRef={fgRef}
            graphData={graphData}
            nodeLabel="id"
            backgroundColor="#ffffff"
            linkColor={() => "#e2e8f0"}
            linkWidth={2}
            d3AlphaDecay={0.01} // Movimiento más lento y estable
            d3VelocityDecay={0.4}
            warmupTicks={200} // Pre-calcula 200 frames para que aparezca ya separado
            
            nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.id;
                const fontSize = 14/globalScale;
                const isActive = node.id === activeNode;
                
                let color = node.group === 'root' ? COLORS.ROOT : COLORS.PILLAR;
                if (isActive) color = COLORS.ACTIVE;

                const radius = node.val ? node.val : 10;

                if (isActive) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius + 15, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "rgba(234, 179, 8, 0.3)";
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4 / globalScale; // Borde blanco más grueso para separar visualmente
                ctx.stroke();

                ctx.font = `bold ${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.group === 'root' ? '#ffffff' : COLORS.TEXT;
                
                if (node.group === 'root') {
                    ctx.fillText(label, node.x, node.y);
                } else {
                    // Texto más separado del nodo
                    ctx.fillText(label, node.x, node.y + radius + fontSize + 2);
                }
            }}
        />
      </div>
    </div>
  )
}