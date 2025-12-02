from sqlalchemy.orm import Session
from app.models.knowledge import GraphNode, GraphEdge
import math

class GraphService:
    def get_topology(self, db: Session):
        nodes = db.query(GraphNode).all()
        edges = db.query(GraphEdge).all()
        return self._format_graph(nodes, edges)

    async def get_dynamic_subgraph(self, db: Session, context: str):
        # Versión simplificada sin llamada a LLM para evitar errores de importación
        # Retorna el grafo completo por ahora para asegurar estabilidad
        return self.get_topology(db)

    def _format_graph(self, nodes, edges):
        formatted_nodes = []
        for n in nodes:
            w = max(1, n.weight)
            size = 4 + math.log(w) * 4 
            formatted_nodes.append({
                "id": n.id,
                "group": n.group,
                "val": size,
                "real_weight": w
            })
        
        return {
            "nodes": formatted_nodes,
            "links": [{"source": e.source_id, "target": e.target_id, "label": e.relation} for e in edges]
        }

    def boost_node(self, db: Session, node_keyword: str, amount: int = 1):
        pass

    def init_weights(self, db: Session):
        pass

graph_service = GraphService()