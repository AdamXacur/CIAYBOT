import sys
import subprocess
import importlib.metadata

# --- BLOQUE DE AUTO-REPARACIÓN (HOTFIX) ---
try:
    httpx_version = importlib.metadata.version("httpx")
    if not httpx_version.startswith("0.27"):
        print(f"🚨 DETECTADO CONFLICTO (HTTPX {httpx_version}). REPARANDO...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx==0.27.2"])
        print("✅ REPARACIÓN COMPLETADA. REINICIANDO...")
        sys.exit(0)
except Exception as e:
    print(f"ℹ️ Verificación de entorno: {e}")
# ------------------------------------------

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.routers import api, analytics, auth
from app.database import engine, Base, SessionLocal, get_db
from app.services.ingestion_service import ingestion_service
from app.utils.websocket import manager
from app.services.chat_service import chat_service
from app.schemas.chat import ChatRequest

Base.metadata.create_all(bind=engine)
app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- FIX: RUTA DE WEBSOCKET CON SESSION ID ---
@app.websocket("/ws/logs/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id)
# ---------------------------------------------

@app.post(f"{settings.API_V1_STR}/chat")
async def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        chat_service.stream_process_message(db, request.message, request.session_id),
        media_type="text/plain"
    )

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(api.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics")

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    ingestion_service.ingest_initial_data(db)
    db.close()

@app.get("/")
def root(): return {"status": "CIAY Neuro-Symbolic System Operational"}