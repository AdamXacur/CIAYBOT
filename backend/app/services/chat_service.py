from sqlalchemy.orm import Session
from app.services.rag_service import rag_service
from app.services.graph_service import graph_service
from app.utils.websocket import manager
from app.models.knowledge import InteractionLog
from app.database import SessionLocal
from app.core.config import settings
import json
import time
import asyncio
import threading
import httpx

class ChatService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.base_prompt = self._load_system_prompt()
        self.active_sessions = {}

    def _load_system_prompt(self) -> str:
        try:
            with open("data/system_prompt.txt", "r", encoding="utf-8") as f: return f.read()
        except: return "Eres el asistente del CIAY."

    async def _classify_intent_semantically(self, message: str):
        classification_prompt = [
            {"role": "system", "content": """
            Eres el Clasificador Semántico del CIAY. Tu ÚNICA tarea es categorizar el input del usuario.
            
            CATEGORÍAS VÁLIDAS:
            - INVERSIONISTA (Habla de dinero, capital, ROI, negocios, startups)
            - ESTUDIANTE (Habla de cursos, aprender, becas, servicio social)
            - GOBIERNO (Habla de leyes, trámites, política pública, ciudadanía)
            - STARTUP (Habla de emprendimiento, ideas, apps, tecnología)
            - GENERAL (Saludos, preguntas de identidad, ubicación)

            FORMATO DE RESPUESTA OBLIGATORIO (JSON):
            {"intent": "CATEGORIA", "confidence": 0.95, "reasoning": "breve explicacion"}
            """},
            {"role": "user", "content": message}
        ]

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": "deepseek-chat",
                        "messages": classification_prompt,
                        "temperature": 0.1,
                        "max_tokens": 100,
                        "response_format": { "type": "json_object" }
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data['choices'][0]['message']['content']
                    return json.loads(content)
        except Exception as e:
            print(f"Error en clasificación: {e}")
        
        return {"intent": "GENERAL", "confidence": 0.5, "reasoning": "Fallback logic"}

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
            await manager.broadcast_log(step, detail, status, data)

        await log_step("[KERNEL]", f"Iniciando sesión segura: {session_id[:6]}...", "success")
        
        await log_step("[SEMANTIC_ROUTER]", "Analizando perfil del usuario...", "running")
        classification = await self._classify_intent_semantically(message)
        intent = classification.get("intent", "GENERAL")
        
        await log_step(
            "[SEMANTIC_ROUTER]", 
            f"Perfil Detectado: {intent}", 
            "success", 
            classification
        )

        await graph_service.boost_node_dynamic(intent)
        
        await log_step("[RAG_ENGINE]", f"Buscando contexto para: {intent}...", "running")
        context_items = rag_service.search(db, message)
        context_text = "\n".join([f"- {item.content}" for item in context_items])
        
        # --- CAMBIO AQUÍ: ENVIAR DATOS REALES DE CONFIGURACIÓN ---
        await log_step("[LLM_SYNTHESIS]", "Sintetizando respuesta adaptativa...", "running", {
            "model": "deepseek-chat",
            "provider": "DeepSeek API",
            "max_tokens": 4096,
            "temperature": 0.7,
            "stream": True
        })
        # ---------------------------------------------------------
        
        dynamic_instruction = ""
        if intent == "INVERSIONISTA":
            dynamic_instruction = "ADAPTACIÓN: Usa tono ejecutivo. Enfócate en ROI, ecosistema y oportunidades de negocio."
        elif intent == "ESTUDIANTE":
            dynamic_instruction = "ADAPTACIÓN: Usa tono motivador. Enfócate en aprendizaje, becas y futuro."
        
        messages = [
            {"role": "system", "content": f"{self.base_prompt}\n\nCONTEXTO:\n{context_text}\n\n{dynamic_instruction}"},
            {"role": "user", "content": message}
        ]

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": "deepseek-chat",
                        "messages": messages,
                        "stream": True
                    }
                ) as response:
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
                            
        except Exception as e:
            yield f"Error del sistema: {str(e)}"
            await log_step("[ERROR]", str(e), "failed")

        log_data = {
            "session_id": session_id,
            "user_input": message,
            "bot_response": full_response,
            "detected_intent": intent,
            "execution_steps": json.dumps(logs),
            "sentiment_score": classification.get("confidence", 0.0),
            "sentiment_label": "NEUTRO"
        }
        threading.Thread(target=self._save_log_background, args=(log_data,)).start()

chat_service = ChatService()