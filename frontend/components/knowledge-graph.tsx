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
    TEXT: "#475569",    // Gris Texto
    LINK: "#CBD5E1"     // Gris Enlace
  }

  useEffect(() => {
      fetch(`${API_BASE_URL}/api/v1/graph`)
        .then(res => res.json())
        .then(data => setGraphData(data))
        .catch(err => console.error("Error loading graph:", err));
  }, []);

  // --- FÍSICAS CALIBRADAS (ESTABILIDAD) ---
  useEffect(() => {
    if (fgRef.current) {
        // 1. Repulsión: Suficiente para separar, pero no para explotar (-1000 es un buen balance)
        fgRef.current.d3Force('charge').strength(-1000); 
        
        // 2. Enlaces (La Correa): Distancia media (100) pero muy rígida (strength 1)
        // Esto evita que el nodo salga volando cuando crece.
        fgRef.current.d3Force('link').distance(100).strength(1);
        
        // 3. Gravedad Central: Mantiene todo en el medio
        fgRef.current.d3Force('center').strength(0.8);
        
        // 4. Colisión: Evita que los círculos se solapen físicamente
        // fgRef.current.d3Force('collide', d3.forceCollide(node => node.val + 5)); 
        
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
                setTimeout(() => setActiveNode(null), 2500);
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
            
            // Enlaces más visibles
            linkColor={() => COLORS.LINK}
            linkWidth={3} 
            
            // Motor de Físicas
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={100}
            
            nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.id;
                const fontSize = 12/globalScale;
                const isActive = node.id === activeNode;
                
                let color = node.group === 'root' ? COLORS.ROOT : COLORS.PILLAR;
                if (isActive) color = COLORS.ACTIVE;

                // Radio base (evitamos que sea demasiado pequeño)
                const radius = Math.max(node.val ? node.val : 10, 8);

                // Efecto de "Halo" cuando está activo
                if (isActive) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "rgba(234, 179, 8, 0.2)"; // Amarillo transparente
                    ctx.fill();
                }

                // Nodo Sólido
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();

                // Borde blanco para separar visualmente si se tocan
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();

                // Texto (Etiqueta)
                ctx.font = `bold ${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (node.group === 'root') {
                    // Texto DENTRO del nodo central (blanco)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, node.x, node.y);
                } else {
                    // Texto DEBAJO de los nodos satélite (gris oscuro)
                    // Esto evita que el texto tape el nodo o se vea sucio
                    ctx.fillStyle = COLORS.TEXT;
                    ctx.fillText(label, node.x, node.y + radius + fontSize);
                }
            }}
        />
      </div>
    </div>
  )
}