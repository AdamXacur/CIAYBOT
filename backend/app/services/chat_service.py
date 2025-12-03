from sqlalchemy.orm import Session
from app.services.rag_service import rag_service
from app.services.graph_service import graph_service
from app.services.tools_service import tools_service
from app.utils.websocket import manager
from app.models.knowledge import InteractionLog
from app.database import SessionLocal
from app.core.config import settings
from app.schemas.tools import SaveContactSchema, RegisterCourseSchema
import json
import time
import asyncio
import threading
import httpx
import re
from pydantic import ValidationError

class ChatService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.base_prompt = self._load_system_prompt()

    def _load_system_prompt(self) -> str:
        try:
            with open("data/system_prompt.txt", "r", encoding="utf-8") as f: return f.read()
        except: return "Eres el asistente del CIAY."

    def _get_tools_schema(self):
        """Genera el esquema JSON estricto para inyectar en el prompt"""
        return json.dumps({
            "oneOf": [
                SaveContactSchema.model_json_schema(),
                RegisterCourseSchema.model_json_schema()
            ]
        }, indent=2)

    async def _classify_intent_semantically(self, message: str):
        # ... (Misma lógica de clasificación, funciona bien)
        classification_prompt = [
            {"role": "system", "content": "Eres el Clasificador Semántico. Categorías: INVERSIONISTA, ESTUDIANTE, GOBIERNO, STARTUP, GENERAL, CONTACTO. JSON: {'intent': 'CATEGORIA', 'confidence': 0.95}"},
            {"role": "user", "content": message}
        ]
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": "deepseek-chat", "messages": classification_prompt, "response_format": { "type": "json_object" }}
                )
                if response.status_code == 200:
                    return json.loads(response.json()['choices'][0]['message']['content'])
        except: pass
        return {"intent": "GENERAL", "confidence": 0.5}

    def _save_log_background(self, log_data):
        db = SessionLocal()
        try:
            log_entry = InteractionLog(**log_data)
            db.add(log_entry)
            db.commit()
        except Exception as e: print(f"Error saving log: {e}")
        finally: db.close()

    async def stream_process_message(self, db: Session, message: str, session_id: str = "default"):
        logs = []
        full_response = ""
        
        async def log_step(step, detail, status="done", data=None):
            entry = {"step": step, "detail": detail, "status": status, "timestamp": time.time(), "data": data}
            logs.append(entry)
            await manager.broadcast_log(step, detail, status, data)

        await log_step("[KERNEL]", f"Sesión activa: {session_id[:6]}", "success")
        
        # 1. Clasificación
        classification = await self._classify_intent_semantically(message)
        intent = classification.get("intent", "GENERAL")
        await log_step("[SEMANTIC]", f"Intención: {intent}", "success", classification)
        await graph_service.boost_node_dynamic(intent)
        
        # 2. RAG
        context_items = rag_service.search(db, message)
        context_text = "\n".join([f"- {item.content}" for item in context_items])
        
        # 3. Construcción del Prompt con SCHEMA INYECTADO
        tools_schema = self._get_tools_schema()
        
        sys_prompt = f"{self.base_prompt}\n\nCONTEXTO RAG:\n{context_text}"
        
        # Solo inyectamos las instrucciones de herramientas si la intención lo amerita
        # Esto reduce alucinaciones en charlas casuales
        if intent in ["CONTACTO", "INVERSIONISTA", "ESTUDIANTE", "STARTUP"]:
            sys_prompt += f"""
            
            IMPORTANTE: Si tienes los datos necesarios para ejecutar una acción, DEBES generar un bloque JSON al final.
            Usa ESTRICTAMENTE este esquema JSON Schema para estructurar tu respuesta de herramienta:
            {tools_schema}
            
            Envuelve el JSON en marcadores así:
            @@TOOL_CALL: <JSON_AQUI> @@
            """

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": message}
        ]

        await log_step("[LLM]", "Inferencia Estructurada...", "running", {"model": "deepseek-chat", "schema_enforced": True})

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", f"{self.base_url}/chat/completions", 
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": "deepseek-chat", "messages": messages, "stream": True, "temperature": 0.3} # Temp baja para precisión
                ) as response:
                    async for chunk in response.aiter_lines():
                        if chunk.startswith("data: "):
                            data_str = chunk.replace("data: ", "")
                            if data_str == "[DONE]": break
                            try:
                                content = json.loads(data_str)['choices'][0]['delta'].get('content', '')
                                if content:
                                    full_response += content
                                    # Ocultamos el JSON crudo al usuario final
                                    if "@@" not in full_response and "{" not in content:
                                        yield content
                                    elif "@@" in full_response and "@@" not in content:
                                        # Estamos dentro del bloque, no emitimos texto
                                        pass
                                    elif "}" in content:
                                        # Fin potencial del bloque, no emitimos
                                        pass
                                    else:
                                        # Texto normal antes del bloque
                                        yield content
                            except: pass
                            
            # --- VALIDACIÓN ESTRUCTURADA (PYDANTIC) ---
            tool_match = re.search(r"@@TOOL_CALL:\s*({.*?})\s*@@", full_response, re.DOTALL)
            
            if tool_match:
                json_str = tool_match.group(1)
                await log_step("[VALIDATOR]", "Validando estructura JSON...", "running")
                
                try:
                    tool_data = json.loads(json_str)
                    action = tool_data.get("action")
                    
                    # Validación Estricta con Pydantic
                    validated_data = None
                    if action == "save_contact":
                        validated_data = SaveContactSchema(**tool_data)
                    elif action == "register_course":
                        validated_data = RegisterCourseSchema(**tool_data)
                    
                    if validated_data:
                        await log_step("[VALIDATOR]", "Schema Válido. Ejecutando...", "success", validated_data.model_dump())
                        
                        # Ejecución
                        result = tools_service.handle_tool_call(tool_data)
                        await log_step("[TOOL_EXEC]", result.get("msg"), "success", result)
                        
                        # Feedback al usuario si el LLM no lo dio
                        yield f"\n\n✅ {result.get('msg')}"
                    else:
                        await log_step("[VALIDATOR]", "Acción no reconocida en Schema", "failed")

                except ValidationError as ve:
                    error_msg = ve.errors()[0]['msg']
                    await log_step("[VALIDATOR]", f"Error de Schema: {error_msg}", "failed", {"raw": json_str})
                    yield "\n\n(Error interno: Los datos proporcionados no cumplen con el formato requerido)."
                except json.JSONDecodeError:
                    await log_step("[VALIDATOR]", "JSON Malformado por el LLM", "failed")

        except Exception as e:
            yield f"Error crítico: {str(e)}"

        threading.Thread(target=self._save_log_background, args=({
            "session_id": session_id,
            "user_input": message,
            "bot_response": full_response,
            "detected_intent": intent,
            "execution_steps": json.dumps(logs),
            "sentiment_score": classification.get("confidence", 0.0)
        },)).start()

chat_service = ChatService()