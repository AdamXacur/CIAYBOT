from pydantic import BaseModel, Field, EmailStr
from typing import Literal, Optional

# --- MODELOS ESTRICTOS PARA VALIDACIÓN DE LLM ---

class SaveContactSchema(BaseModel):
    action: Literal["save_contact"]
    nombre: str = Field(..., description="Nombre completo del usuario")
    correo: str = Field(..., description="Correo electrónico válido")
    empresa: Optional[str] = Field(None, description="Nombre de la empresa o startup")
    interes: str = Field(..., description="Resumen del interés (Inversión, Alianza, etc)")
    telefono: Optional[str] = Field(None, description="Número de teléfono si se proporciona")

class RegisterCourseSchema(BaseModel):
    action: Literal["register_course"]
    nombre: str = Field(..., description="Nombre completo del estudiante")
    correo: str = Field(..., description="Correo electrónico para la inscripción")
    curso: str = Field(..., description="Nombre del curso (Python, IA, Bedrock, etc)")

# Este es el modelo maestro que el LLM debe intentar llenar
class ToolOutput(BaseModel):
    tool_call: SaveContactSchema | RegisterCourseSchema