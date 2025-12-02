from fastapi import WebSocket
from typing import List, Any, Optional

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    # CORRECCIÓN: Quitamos el session_id obligatorio o lo hacemos opcional
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
        # Broadcast a todos (para la demo es mejor que todos vean lo mismo)
        for connection in self.active_connections:
            try: await connection.send_json(message)
            except: pass

    async def broadcast_graph_update(self, node_id: str):
        message = {
            "type": "graph_event",
            "payload": { "action": "highlight", "node_id": node_id }
        }
        for connection in self.active_connections:
            try: await connection.send_json(message)
            except: pass

    async def broadcast_graph_data(self, graph_data: dict):
        message = {
            "type": "graph_data",
            "payload": graph_data
        }
        for connection in self.active_connections:
            try: await connection.send_json(message)
            except: pass

manager = ConnectionManager()