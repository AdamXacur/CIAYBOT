from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeItem
import pandas as pd

class RAGService:
    def __init__(self):
        # En una implementación real, aquí cargaríamos ChromaDB o FAISS
        pass

    def search(self, db: Session, query: str, limit: int = 3):
        # Simulación de búsqueda vectorial usando búsqueda de texto simple en SQL por ahora
        # para no complicar el Docker con dependencias de vectores pesadas aún.
        # "Solid Architecture" permite cambiar esto luego sin romper el router.
        
        results = db.query(KnowledgeItem).filter(
            KnowledgeItem.content.ilike(f"%{query}%") | 
            KnowledgeItem.keywords.ilike(f"%{query}%")
        ).limit(limit).all()
        
        if not results:
            # Fallback: traer items generales si no hay coincidencia exacta
            results = db.query(KnowledgeItem).filter(
                KnowledgeItem.topic == "Identidad"
            ).limit(1).all()
            
        return results

rag_service = RAGService()