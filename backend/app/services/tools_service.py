from sqlalchemy.orm import Session
from app.models.knowledge import ContactLead, CourseRegistration, CitizenReport
from app.database import SessionLocal
import json
import random

class ToolsService:
    def handle_tool_call(self, tool_json: dict):
        action = tool_json.get("action")
        data = tool_json.get("data", {})
        
        print(f"🔧 [TOOL_ROUTER] Ejecutando acción: {action}")

        if action == "save_contact":
            return self._save_contact(data)
        elif action == "register_course":
            return self._register_course(data)
        elif action == "create_report":
            return self._create_report(data)
        
        return {"status": "error", "msg": f"Acción '{action}' no reconocida"}

    def _save_contact(self, data):
        db = SessionLocal()
        try:
            lead = ContactLead(
                nombre=data.get("nombre"),
                correo=data.get("correo"),
                empresa=data.get("empresa"),
                telefono=data.get("telefono"),
                interes=data.get("interes"),
                mensaje=data.get("mensaje")
            )
            db.add(lead)
            db.commit()
            return {"status": "success", "msg": "Lead comercial guardado en CRM."}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
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
            return {"status": "success", "msg": f"Alumno inscrito en '{data.get('curso')}'. Cupo reservado."}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
        finally: db.close()

    def _create_report(self, data):
        db = SessionLocal()
        try:
            # Generar folio tipo "MID-2024-XXXX"
            folio = f"MID-{random.randint(1000, 9999)}"
            report = CitizenReport(
                report_type=data.get("tipo"),
                location=data.get("ubicacion"),
                description=data.get("descripcion"),
                ticket_id=folio
            )
            db.add(report)
            db.commit()
            return {"status": "success", "msg": f"Reporte ciudadano generado. Folio: {folio}. Enviado a Servicios Públicos."}
        except Exception as e:
            return {"status": "error", "msg": str(e)}
        finally: db.close()

tools_service = ToolsService()