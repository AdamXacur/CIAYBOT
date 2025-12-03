from sqlalchemy.orm import Session
from app.models.knowledge import ContactLead, CourseRegistration
from app.database import SessionLocal

class ToolsService:
    def handle_tool_call(self, action: str, data: dict):
        """
        Recibe la acción y el diccionario de datos YA VALIDADO por Pydantic.
        """
        print(f"🔧 [TOOL_SERVICE] Procesando: {action} con datos: {data}")

        if action == "save_contact":
            return self._save_contact(data)
        elif action == "register_course":
            return self._register_course(data)
        
        return {"status": "error", "msg": f"Acción '{action}' no implementada"}

    def _save_contact(self, data):
        db = SessionLocal()
        try:
            lead = ContactLead(
                nombre=data.get("nombre"),
                correo=data.get("correo"),
                empresa=data.get("empresa"),
                telefono=data.get("telefono"),
                interes=data.get("interes"),
                mensaje=data.get("mensaje") # Opcional
            )
            db.add(lead)
            db.commit()
            print("💾 [DB] Lead guardado.")
            return {"status": "success", "msg": "Contacto guardado en CRM."}
        except Exception as e:
            print(f"❌ [DB ERROR] {e}")
            return {"status": "error", "msg": "Error de base de datos."}
        finally: db.close()

    def _register_course(self, data):
        db = SessionLocal()
        try:
            reg = CourseRegistration(
                student_name=data.get("nombre"),
                email=data.get("correo"),
                course_name=data.get("curso")
            )
            db.add(reg)
            db.commit()
            print(f"💾 [DB] Inscripción guardada: {data.get('curso')}")
            return {"status": "success", "msg": f"Inscripción exitosa en {data.get('curso')}."}
        except Exception as e:
            print(f"❌ [DB ERROR] {e}")
            return {"status": "error", "msg": "Error de base de datos."}
        finally: db.close()

tools_service = ToolsService()