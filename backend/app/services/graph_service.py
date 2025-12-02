from sqlalchemy.orm import Session
from app.models.knowledge import GraphNode, GraphEdge
from app.utils.websocket import manager
import math
import asyncio

class GraphService:
    def __init__(self):
        # Mapa de calor en memoria (Volátil para demo rápida)
        # Estructura: { "NodoID": peso_actual }
        self.heat_map = {
            "CIAY": 40,
            "Educación": 20,
            "Inversión": 20,
            "Gobierno": 20,
            "Startups": 20
        }
        # Mapeo de Intenciones a Nodos del Grafo
        self.intent_map = {
            "ESTUDIANTE": "Educación",
            "INVERSIONISTA": "Inversión",
            "GOBIERNO": "Gobierno",
            "STARTUP": "Startups",
            "GENERAL": "CIAY"
        }

    def get_topology(self, db: Session):
        # Retorna la topología base enriquecida con el calor actual
        # Esto es lo que consume el frontend al cargar
        nodes = []
        for id, weight in self.heat_map.items():
            nodes.append({"id": id, "group": "pillar" if id != "CIAY" else "root", "val": weight})
            
        # Links estáticos definidos por lógica de negocio
        links = [
            {"source": "CIAY", "target": "Educación"},
            {"source": "CIAY", "target": "Inversión"},
            {"source": "CIAY", "target": "Gobierno"},
            {"source": "CIAY", "target": "Startups"}
        ]
        return {"nodes": nodes, "links": links}

    async def boost_node_dynamic(self, intent: str):
        """
        Aumenta el calor de un nodo basado en la intención detectada
        y notifica al frontend vía WebSocket.
        """
        target_node = self.intent_map.get(intent, "CIAY")
        
        # Incrementamos peso (Simulación de tendencia)
        if target_node in self.heat_map:
            self.heat_map[target_node] += 5
            # Limite para que no explote visualmente
            if self.heat_map[target_node] > 60: self.heat_map[target_node] = 60
            
        # Broadcast al frontend para animación en tiempo real
        await manager.broadcast_graph_update(target_node, self.heat_map[target_node])

graph_service = GraphService()