from sqlalchemy.orm import Session
from app.services.rag_service import rag_service
from app.services.tools_service import tools_service
from app.services.graph_service import graph_service
from app.utils.websocket import manager
from app.models.knowledge import InteractionLog
from app.database import SessionLocal
import google.generativeai as genai
from app.core.config import settings
import json
import time
import asyncio
import re
import threading

class ChatService:
    def __init__(self):
        if settings.GOOGLE_GEMINI_API_KEY:
            genai.configure(api_key=settings.GOOGLE_GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GOOGLE_GEMINI_MODEL)
        else:
            self.model = None
        self.base_prompt = self._load_system_prompt()
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
        if not self.model: return {"intent": "GENERAL", "sentiment": "NEUTRO", "score": 0.0}
        prompt = f"""Analiza: "{message}". JSON: {{ "intent": (INVERSIONISTA, ESTUDIANTE, PRENSA, GOBIERNO, CIUDADANO), "sentiment": (POSITIVO, NEGATIVO, NEUTRO), "score": float, "reasoning": str }}"""
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return self._extract_json(response.text) or {"intent": "GENERAL", "sentiment": "NEUTRO"}
        except: return {"intent": "GENERAL", "sentiment": "NEUTRO"}

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

    def _get_chat_session(self, session_id: str):
        if not self.model: return None
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = self.model.start_chat(history=[])
        return self.active_sessions[session_id]

    async def stream_process_message(self, db: Session, message: str, session_id: str = "default"):
        logs = []
        full_response = ""
        
        async def log_step(step, detail, status="done", data=None):
            entry = {"step": step, "detail": detail, "status": status, "timestamp": time.time(), "data": data}
            logs.append(entry)
            # CORRECCIÓN: Usar broadcast_log en lugar de send_log_to_session
            asyncio.create_task(manager.broadcast_log(step, detail, status, data))

        await log_step("[STATE_01]", f"Enlace seguro ID: {session_id[:8]}...")
        
        asyncio.create_task(self._update_graph_context(message))
        analysis_task = asyncio.create_task(self._analyze_deeply(message))
        
        await log_step("[STATE_03]", "Consultando Vector DB...", "running")
        context_items = rag_service.search(db, message)
        context_text = "\n".join([f"- {item.content}" for item in context_items]) if context_items else "Información general."
        
        analysis = await analysis_task
        intent = analysis.get("intent", "GENERAL")
        
        await log_step("[STATE_06]", f"Perfil Detectado: {intent}", "done", data=analysis)
        await log_step("[STATE_09]", "Sintetizando respuesta...", "running")
        
        augmented_message = f"""
        [SISTEMA]
        Rol: {self.base_prompt}
        Contexto RAG Relevante: {context_text}
        Perfil Usuario: {intent}
        [/SISTEMA]
        
        Usuario: {message}
        """

        chat_session = self._get_chat_session(session_id)

        if chat_session:
            try:
                response_stream = await asyncio.to_thread(chat_session.send_message, augmented_message, stream=True)
                for chunk in response_stream:
                    if chunk.text:
                        full_response += chunk.text
                        yield chunk.text
                        await asyncio.sleep(0.001)
            except Exception as e:
                yield "Error de conexión con el modelo."
                await log_step("[ERROR]", str(e), "failed")
        else:
            sim_msg = "Modo Simulación (Sin API Key)."
            full_response = sim_msg
            for word in sim_msg.split(): yield word + " "; await asyncio.sleep(0.01)

        log_data = {
            "user_input": message,
            "bot_response": full_response,
            "detected_intent": intent,
            "execution_steps": json.dumps(logs),
            "sentiment_score": analysis.get("score", 0),
            "sentiment_label": analysis.get("sentiment", "NEUTRO"),
            "topics_detected": analysis.get("reasoning", "")
        }
        threading.Thread(target=self._save_log_background, args=(log_data,)).start()

chat_service = ChatService()