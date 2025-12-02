from sqlalchemy.orm import Session
from app.services.rag_service import rag_service
from app.services.tools_service import tools_service
from app.services.graph_service import graph_service
from app.utils.websocket import manager
from app.models.knowledge import InteractionLog
from app.database import SessionLocal
from app.core.config import settings
import json
import time
import asyncio
import re
import threading
import httpx

class ChatService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.base_prompt = self._load_system_prompt()
        # Memoria simple en RAM
        self.active_sessions = {}

    def _load_system_prompt(self) -> str:
        try:
            with open("data/system_prompt.txt", "r", encoding="utf-8") as f: return f.read()
        except: return "Eres el asistente del CIAY."

    def _extract_json(self, text: str):
        try:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            return json.loads(match.group(0)) if match else json.loads(text)
        except: return None

    async def _analyze_deeply(self, message: str):
        # Análisis simulado rápido para no gastar tokens en cada paso intermedio
        # Opcional: Llamar a DeepSeek aquí si quieres análisis real
        return {"intent": "GENERAL", "sentiment": "NEUTRO", "score": 0.0}

    async def _update_graph_context(self, message: str):
        db = SessionLocal()
        try:
            new_topology = await graph_service.get_dynamic_subgraph(db, message)
            await manager.broadcast_graph_data(new_topology)
        except Exception as e:
            print(f"Error actualizando grafo: {e}")
        finally:
            db.close()

    def _save_log_background(self, log_data):
        db = SessionLocal()
        try:
            log_entry = InteractionLog(**log_data)
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"Error saving log: {e}")
        finally:
            db.close()

    async def stream_process_message(self, db: Session, message: str, session_id: str = "default"):
        logs = []
        full_response = ""
        
        async def log_step(step, detail, status="done", data=None):
            entry = {"step": step, "detail": detail, "status": status, "timestamp": time.time(), "data": data}
            logs.append(entry)
            asyncio.create_task(manager.broadcast_log(step, detail, status, data))

        await log_step("[STATE_01]", f"Enlace seguro ID: {session_id[:8]}...")
        
        asyncio.create_task(self._update_graph_context(message))
        
        await log_step("[STATE_03]", "Consultando Vector DB...", "running")
        context_items = rag_service.search(db, message)
        context_text = "\n".join([f"- {item.content}" for item in context_items]) if context_items else "Información general."
        
        # Análisis simple de intención basado en keywords (para velocidad)
        intent = "GENERAL"
        if "invertir" in message.lower(): intent = "INVERSIONISTA"
        elif "curso" in message.lower(): intent = "ESTUDIANTE"
        
        await log_step("[STATE_06]", f"Perfil Detectado: {intent}", "done")
        await log_step("[STATE_09]", "Sintetizando respuesta...", "running")
        
        # Construir historial para DeepSeek
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = [
                {"role": "system", "content": f"{self.base_prompt}\nCONTEXTO RAG: {context_text}"}
            ]
        
        self.active_sessions[session_id].append({"role": "user", "content": message})

        # Llamada a DeepSeek API
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": self.active_sessions[session_id],
                        "stream": True
                    }
                ) as response:
                    if response.status_code != 200:
                        yield f"Error del modelo: {response.status_code}"
                        return

                    async for chunk in response.aiter_lines():
                        if chunk.startswith("data: "):
                            data_str = chunk.replace("data: ", "")
                            if data_str == "[DONE]": break
                            try:
                                data_json = json.loads(data_str)
                                content = data_json['choices'][0]['delta'].get('content', '')
                                if content:
                                    full_response += content
                                    yield content
                            except: pass
                            
            # Guardar respuesta en historial
            self.active_sessions[session_id].append({"role": "assistant", "content": full_response})

        except Exception as e:
            yield f"Error de conexión: {str(e)}"
            await log_step("[ERROR]", str(e), "failed")

        log_data = {
            "user_input": message,
            "bot_response": full_response,
            "detected_intent": intent,
            "execution_steps": json.dumps(logs),
            "sentiment_score": 0,
            "sentiment_label": "NEUTRO",
            "topics_detected": ""
        }
        threading.Thread(target=self._save_log_background, args=(log_data,)).start()

chat_service = ChatService()