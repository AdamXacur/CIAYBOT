from sqlalchemy import Column, String, Text, Integer, ForeignKey, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
from app.models.base import TimeStampMixin

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
    # --- CAMBIO CRÍTICO: AÑADIR SESSION_ID ---
    session_id = Column(String, index=True)
    # -----------------------------------------
    user_input = Column(Text)
    detected_intent = Column(String)
    bot_response = Column(Text)
    execution_steps = Column(Text)
    sentiment_score = Column(Float, default=0.0)
    sentiment_label = Column(String, default="NEUTRO")
    topics_detected = Column(String, nullable=True)