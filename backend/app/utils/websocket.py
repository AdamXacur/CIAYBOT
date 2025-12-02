from fastapi import WebSocket
from typing import Dict, Any, Optional

class ConnectionManager:
    def __init__(self):
        # --- FIX: Diccionario para mapear session_id a WebSocket ---
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def _send_json_to(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except:
            # Si la conexión está rota, la eliminamos silenciosamente
            pass

    # --- NUEVO: Enviar log a una sesión específica ---
    async def send_log_to_session(self, session_id: str, step: str, detail: str, status: str = "running", data: Optional[Any] = None):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            message = {
                "type": "log",
                "payload": { "step": step, "detail": detail, "status": status, "data": data }
            }
            await self._send_json_to(websocket, message)

    # --- MODIFICADO: El grafo sí se transmite a todos ---
    async def broadcast_graph_data(self, graph_data: dict):
        message = { "type": "graph_data", "payload": graph_data }
        for websocket in self.active_connections.values():
            await self._send_json_to(websocket, message)

manager = ConnectionManager()