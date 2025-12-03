from sqlalchemy import Column, String, Text, Integer, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class TimeStampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class KnowledgeItem(Base, TimeStampMixin):
    __tablename__ = "knowledge_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic = Column(String, index=True)
    content = Column(Text, nullable=False)
    keywords = Column(String, nullable=True)
    technical_level = Column(String, default="General") 
    application_sector = Column(String, default="Transversal")
    source_url = Column(String, nullable=True)
    
class GraphNode(Base, TimeStampMixin):
    __tablename__ = "graph_nodes"
    id = Column(String, primary_key=True) 
    group = Column(Integer, default=1)
    weight = Column(Integer, default=1) 
    
class GraphEdge(Base, TimeStampMixin):
    __tablename__ = "graph_edges"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(String, ForeignKey("graph_nodes.id"))
    target_id = Column(String, ForeignKey("graph_nodes.id"))
    relation = Column(String, nullable=False)

class UserTaxonomy(Base, TimeStampMixin):
    __tablename__ = "user_taxonomy"
    code = Column(String, primary_key=True)
    description = Column(String)
    examples = Column(Text)

class InteractionLog(Base, TimeStampMixin):
    __tablename__ = "interaction_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, index=True)
    user_input = Column(Text)
    detected_intent = Column(String)
    bot_response = Column(Text)
    execution_steps = Column(Text)
    sentiment_score = Column(Float, default=0.0)
    sentiment_label = Column(String, default="NEUTRO")
    topics_detected = Column(String, nullable=True)

class ContactLead(Base, TimeStampMixin):
    __tablename__ = "contact_leads"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=True)
    correo = Column(String, nullable=True)
    empresa = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    interes = Column(String, nullable=True)
    mensaje = Column(Text, nullable=True)
    origen = Column(String, default="Chatbot")

# --- NUEVAS TABLAS PARA TOOLS ---

class CourseRegistration(Base, TimeStampMixin):
    __tablename__ = "course_registrations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_name = Column(String)
    email = Column(String)
    course_name = Column(String) # Ej: "Intro a IA", "Python"
    status = Column(String, default="Pre-inscrito")

class CitizenReport(Base, TimeStampMixin):
    __tablename__ = "citizen_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_type = Column(String) # Ej: Bache, Luminaria, Fuga
    location = Column(String)
    description = Column(Text)
    status = Column(String, default="Abierto")
    ticket_id = Column(String, unique=True) # Folio generado
# --------------------------------