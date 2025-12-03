from sqlalchemy.orm import Session
from app.services.rag_service import rag_service
from app.services.graph_service import graph_service
from app.services.tools_service import tools_service
from app.utils.websocket import manager
from app.models.knowledge import InteractionLog
from app.database import SessionLocal
from app.core.config import settings
from app.schemas.tools import SaveContactTool, RegisterCourseTool
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
        return json.dumps({
            "oneOf": [
                SaveContactTool.model_json_schema(),
                RegisterCourseTool.model_json_schema()
            ]
        }, indent=2)

    async def _classify_intent_semantically(self, message: str):
        # ... (Lógica de clasificación existente)
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

        await log_step("[KERNEL]", f"Sesión: {session_id[:6]}", "success")
        
        classification = await self._classify_intent_semantically(message)
        intent = classification.get("intent", "GENERAL")
        await log_step("[SEMANTIC]", f"Intención: {intent}", "success", classification)
        await graph_service.boost_node_dynamic(intent)
        
        context_items = rag_service.search(db, message)
        context_text = "\n".join([f"- {item.content}" for item in context_items])
        
        tools_schema = self._get_tools_schema()
        
        sys_prompt = f"{self.base_prompt}\n\nCONTEXTO RAG:\n{context_text}"
        
        if intent in ["CONTACTO", "INVERSIONISTA", "ESTUDIANTE", "STARTUP"]:
            sys_prompt += f"""
            
            IMPORTANTE: Si tienes los datos necesarios, GENERA EL JSON AL FINAL.
            Usa este esquema EXACTO:
            {tools_schema}
            
            Envuelve el JSON así:
            @@TOOL_CALL: <JSON_AQUI> @@
            """

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": message}
        ]

        await log_step("[LLM]", "Inferencia Estructurada...", "running", {"model": "deepseek-chat"})

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", f"{self.base_url}/chat/completions", 
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": "deepseek-chat", "messages": messages, "stream": True, "temperature": 0.1} 
                ) as response:
                    async for chunk in response.aiter_lines():
                        if chunk.startswith("data: "):
                            data_str = chunk.replace("data: ", "")
                            if data_str == "[DONE]": break
                            try:
                                content = json.loads(data_str)['choices'][0]['delta'].get('content', '')
                                if content:
                                    full_response += content
                                    
                                    # --- FILTRO VISUAL MEJORADO ---
                                    # Si detectamos marcadores, no enviamos ese pedazo al usuario
                                    if "@@" in content: continue
                                    if "TOOL_CALL" in content: continue
                                    # Si ya estamos dentro de un bloque JSON (detectado por llaves en el buffer global), ocultamos
                                    if "@@TOOL_CALL" in full_response and "@@" not in full_response.split("@@TOOL_CALL")[1]:
                                        continue
                                    
                                    yield content
                            except: pass
                            
            # --- DEBUG LOGS EN SERVIDOR ---
            print(f"\n🔍 [DEBUG] Respuesta Completa LLM:\n{full_response}\n")

            # --- EXTRACCIÓN ROBUSTA ---
            # Busca cualquier cosa entre @@TOOL_CALL: y @@, ignorando espacios extra
            tool_match = re.search(r"@@TOOL_CALL:\s*({.*?})\s*@@", full_response, re.DOTALL)
            
            if tool_match:
                json_str = tool_match.group(1)
                print(f"🔍 [DEBUG] JSON Extraído: {json_str}")
                
                await log_step("[VALIDATOR]", "Validando estructura...", "running")
                
                try:
                    raw_data = json.loads(json_str)
                    action = raw_data.get("action")
                    
                    # Validación Pydantic
                    validated_payload = None
                    if action == "save_contact":
                        model = SaveContactTool(**raw_data)
                        validated_payload = model.data.dict() # Extraemos solo la data limpia
                    elif action == "register_course":
                        model = RegisterCourseTool(**raw_data)
                        validated_payload = model.data.dict()
                    
                    if validated_payload:
                        print(f"✅ [DEBUG] Datos Validados: {validated_payload}")
                        await log_step("[VALIDATOR]", "Schema Correcto", "success", validated_payload)
                        
                        # Ejecución pasando la data limpia y la acción
                        result = tools_service.handle_tool_call(action, validated_payload)
                        await log_step("[TOOL_EXEC]", result.get("msg"), "success", result)
                        
                        yield f"\n\n✅ {result.get('msg')}"
                    else:
                        print("❌ [DEBUG] Acción no reconocida en JSON")

                except ValidationError as ve:
                    print(f"❌ [DEBUG] Error Pydantic: {ve}")
                    await log_step("[VALIDATOR]", f"Error Schema: {ve}", "failed")
                except json.JSONDecodeError:
                    print("❌ [DEBUG] JSON Malformado")
                    await log_step("[VALIDATOR]", "JSON Inválido", "failed")

        except Exception as e:
            print(f"🔥 [ERROR CRÍTICO]: {e}")
            yield f"Error: {str(e)}"

        threading.Thread(target=self._save_log_background, args=({
            "session_id": session_id,
            "user_input": message,
            "bot_response": full_response,
            "detected_intent": intent,
            "execution_steps": json.dumps(logs),
            "sentiment_score": classification.get("confidence", 0.0)
        },)).start()

chat_service = ChatService()