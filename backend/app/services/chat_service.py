from sqlalchemy.orm import Session
from app.services.rag_service import rag_service
from app.services.graph_service import graph_service
from app.utils.websocket import manager
from app.models.knowledge import InteractionLog
from app.database import SessionLocal
from openai import OpenAI
from app.core.config import settings
import json
import time
import asyncio
import threading

class ChatService:
    def __init__(self):
        if settings.DEEPSEEK_API_KEY:
            self.client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL)
        else:
            self.client = None
        self.base_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        try:
            with open("data/system_prompt.txt", "r", encoding="utf-8") as f: return f.read()
        except: return "Eres el asistente del CIAY."

    async def _analyze_deeply(self, message: str):
        if not self.client: return {"intent": "GENERAL", "sentiment": "NEUTRO", "score": 0.0}
        prompt = f"""Analiza: "{message}". JSON: {{ "intent": "TIPO", "sentiment": "VALOR", "score": 0.0 }}"""
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
                model="deepseek-chat", messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}, temperature=0.1
            ))
            return json.loads(response.choices[0].message.content)
        except: return {"intent": "GENERAL", "sentiment": "NEUTRO", "score": 0.5}

    async def _update_graph_context(self, message: str):
        db = SessionLocal()
        try:
            new_topology = await graph_service.get_dynamic_subgraph(db, message)
            await manager.broadcast_graph_data(new_topology)
        except: pass
        finally: db.close()

    def _harvest_knowledge_background(self, user_msg: str, bot_msg: str):
        try:
            loop = asyncio.new_event_loop(); asyncio.set_event_loop(loop)
            data = loop.run_until_complete(graph_service.extract_knowledge_ai(user_msg, bot_msg))
            loop.close()
        except Exception as e: print(f"Error IA Cosechador: {e}"); return

        if data:
            db = SessionLocal()
            try:
                result = graph_service.persist_knowledge(db, data)
                if result: 
                    print(f"🧠 [AGENTE] {result}")
                    loop2 = asyncio.new_event_loop(); asyncio.set_event_loop(loop2)
                    new_topo = graph_service.get_topology(db)
                    loop2.run_until_complete(manager.broadcast_graph_data(new_topo))
                    loop2.close()
            finally: db.close()

    def _save_log_background(self, log_data):
        db = SessionLocal()
        try:
            intent = log_data.get("detected_intent")
            if isinstance(intent, dict): log_data["detected_intent"] = "GENERAL"
            db.add(InteractionLog(**log_data))
            db.commit()
        except Exception as e: print(f"Error saving log: {e}")
        finally: db.close()

    async def stream_process_message(self, db: Session, message: str, session_id: str = "default"):
        logs = []
        full_response = ""
        
        async def log_step(step, detail, status="done", data=None):
            entry = {"step": step, "detail": detail, "status": status, "timestamp": time.time(), "data": data}
            logs.append(entry)
            await manager.send_log_to_session(session_id, step, detail, status, data)

        await log_step("[STATE_01]", f"DeepSeek Engine ID: {session_id[:8]}...")
        
        asyncio.create_task(self._update_graph_context(message))
        analysis_task = asyncio.create_task(self._analyze_deeply(message))
        
        await log_step("[STATE_03]", "RAG: Buscando contexto...", "running")
        context_items = rag_service.search(db, message)
        context_text = "\n".join([f"- {item.content}" for item in context_items]) if context_items else "Información general."
        
        analysis = await analysis_task
        intent = analysis.get("intent", "GENERAL")
        
        await log_step("[STATE_06]", f"Perfil: {intent}", "done", data=analysis)
        
        system_msg = f"{self.base_prompt}\nCONTEXTO: {context_text}\nPERFIL: {intent}"
        await log_step("[STATE_10]", "Expandiendo Grafo...", "running")

        if self.client:
            try:
                response_stream = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model="deepseek-chat",
                    messages=[{"role": "system", "content": system_msg}, {"role": "user", "content": message}],
                    stream=True
                )
                for chunk in response_stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_response += content; yield content; await asyncio.sleep(0.001)
            except Exception as e:
                yield "Error de servicio."; await log_step("[ERROR]", str(e), "failed")
        else:
            yield "Modo Offline."

        log_data = {
            "session_id": session_id, # --- AÑADIR SESSION_ID AL LOG ---
            "user_input": message,
            "bot_response": full_response,
            "detected_intent": intent,
            "execution_steps": json.dumps(logs),
            "sentiment_score": analysis.get("score", 0),
            "sentiment_label": analysis.get("sentiment", "NEUTRO"),
            "topics_detected": ""
        }
        
        threading.Thread(target=self._save_log_background, args=(log_data,)).start()
        threading.Thread(target=self._harvest_knowledge_background, args=(message, full_response)).start()

chat_service = ChatService()