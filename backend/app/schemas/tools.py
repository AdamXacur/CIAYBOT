from pydantic import BaseModel, Field
from typing import Literal, Optional

# --- SUB-MODELOS DE DATOS (PAYLOAD) ---

class ContactData(BaseModel):
    nombre: str = Field(..., description="Nombre completo del usuario")
    correo: str = Field(..., description="Correo electrónico")
    empresa: Optional[str] = Field(None, description="Empresa")
    interes: str = Field(..., description="Interés principal")
    telefono: Optional[str] = Field(None, description="Teléfono")

class CourseData(BaseModel):
    nombre: str = Field(..., description="Nombre completo del estudiante")
    correo: str = Field(..., description="Correo electrónico")
    curso: str = Field(..., description="Nombre del curso (Python, IA, etc)")

# --- MODELOS DE ACCIÓN (ENVOLTORIOS) ---

class SaveContactTool(BaseModel):
    action: Literal["save_contact"]
    data: ContactData

class RegisterCourseTool(BaseModel):
    action: Literal["register_course"]
    data: CourseData

#