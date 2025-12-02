from fastapi import WebSocket
from typing import List, Any, Optional
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_log(self, step: str, detail: str, status: str = "running", data: Optional[Any] = None):
        message = {
            "type": "log",
            "payload": {
                "step": step,
                "detail": detail,
                "status": status,
                "timestamp": "now",
                "data": data
            }
        }
        for connection in self.active_connections:
            try: await connection.send_json(message)
            except: pass

    async def broadcast_graph_update(self, node_id: str, new_weight: int):
        """
        Notifica al frontend que un nodo ha crecido en importancia.
        """
        message = {
            "type": "graph_heat",
            "payload": { 
                "node_id": node_id,
                "new_weight": new_weight
            }
        }
        for connection in self.active_connections:
            try: await connection.send_json(message)
            except: pass

manager = ConnectionManager()