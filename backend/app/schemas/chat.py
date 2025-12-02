from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

class LogStep(BaseModel):
    step: str
    detail: str
    status: str
    data: Optional[Any] = None

class ChatResponse(BaseModel):
    response: str
    logs: List[LogStep]
    detected_intent: str
    metadata: Optional[Dict[str, Any]] = None

class GraphData(BaseModel):
    nodes: List[Dict[str, Any]]
    links: List[Dict[str, Any]]