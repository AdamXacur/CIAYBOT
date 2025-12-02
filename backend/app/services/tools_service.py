from sqlalchemy.orm import Session
import json

class ToolsService:
    """
    Aquí reside la LÓGICA SIMBÓLICA (Hard Logic).
    La IA decide llamar a estas funciones, pero el código Python las ejecuta.
    """

    def execute_tool(self, tool_name: str, params: dict):
        if tool_name == "registrar_lead_inversion":
            return self._registrar_lead(params)
        elif tool_name == "consultar_beca":
            return self._consultar_beca(params)
        elif tool_name == "reportar_incidencia":
            return self._reportar_incidencia(params)
        else:
            return {"status": "error", "msg": "Herramienta no encontrada"}

    def _registrar_lead(self, params):
        # Simulación de guardar en CRM
        nombre = params.get("nombre", "Anónimo")
        sector = params.get("sector", "General")
        print(f"💾 [TOOL] Guardando Lead en Base de Datos: {nombre} - {sector}")
        return {
            "status": "success", 
            "msg": f"Lead registrado en CRM Estatal. Folio: INV-{sector[:3].upper()}-001",
            "data": {"folio": "INV-001", "priority": "HIGH"}
        }

    def _consultar_beca(self, params):
        # Simulación de consulta a base de datos de la SIIES
        nivel = params.get("nivel", "licenciatura")
        print(f"💾 [TOOL] Consultando disponibilidad de becas para: {nivel}")
        return {
            "status": "success",
            "msg": f"Convocatoria abierta para {nivel}. 150 lugares disponibles.",
            "data": {"available": True, "deadline": "30 Nov"}
        }

    def _reportar_incidencia(self, params):
        tipo = params.get("tipo", "general")
        ubicacion = params.get("ubicacion", "desconocida")
        print(f"💾 [TOOL] Generando ticket de soporte ciudadano: {tipo} en {ubicacion}")
        return {
            "status": "success",
            "msg": f"Ticket generado y enviado a la dependencia correspondiente.",
            "data": {"ticket_id": "TKT-9988", "sla": "24h"}
        }

tools_service = ToolsService()