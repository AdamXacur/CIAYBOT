import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.knowledge import KnowledgeItem, GraphNode, GraphEdge, UserTaxonomy
from app.services.graph_service import graph_service
import os

class IngestionService:
    def ingest_initial_data(self, db: Session):
        kb_path = "data/knowledge_base.csv"
        graph_path = "data/grafo_relaciones.csv"
        tax_path = "data/taxonomia_usuarios.csv"

        # 1. Ingestar Base de Conocimiento
        if os.path.exists(kb_path):
            try:
                kb_df = pd.read_csv(kb_path)
                # Iteramos e intentamos insertar uno por uno
                for _, row in kb_df.iterrows():
                    try:
                        # Verificar si ya existe por ID antes de insertar
                        exists = db.query(KnowledgeItem).filter(KnowledgeItem.id == row.get('ID')).first()
                        if not exists:
                            item = KnowledgeItem(
                                id=row.get('ID'), # Forzamos el ID del CSV
                                topic=row.get('Tema'),
                                content=row.get('Contenido'),
                                keywords=row.get('Keywords'),
                                technical_level=row.get('Nivel_Tecnico', 'General'),
                                application_sector=row.get('Sector_Aplicacion', 'Transversal'),
                                source_url=row.get('Fuente_URL')
                            )
                            db.add(item)
                            db.commit()
                    except IntegrityError:
                        db.rollback() # Si choca, ignoramos y seguimos
                    except Exception:
                        db.rollback()
                print("✅ Knowledge Base verificada.")
            except Exception as e:
                print(f"⚠️ Error procesando KB CSV: {e}")

        # 2. Ingestar Taxonomía
        if os.path.exists(tax_path):
            try:
                tax_df = pd.read_csv(tax_path)
                for _, row in tax_df.iterrows():
                    try:
                        exists = db.query(UserTaxonomy).filter(UserTaxonomy.code == row['Codigo']).first()
                        if not exists:
                            db.add(UserTaxonomy(code=row['Codigo'], description=row['Descripcion'], examples=row['Ejemplos']))
                            db.commit()
                    except IntegrityError:
                        db.rollback()
                print("✅ Taxonomía verificada.")
            except Exception: pass

        # 3. Ingestar Grafo
        if os.path.exists(graph_path):
            try:
                graph_df = pd.read_csv(graph_path)
                # Nodos
                for _, row in graph_df.iterrows():
                    try:
                        src = row['Origen']; dst = row['Destino']
                        if not db.query(GraphNode).filter(GraphNode.id == src).first():
                            db.add(GraphNode(id=src))
                        if not db.query(GraphNode).filter(GraphNode.id == dst).first():
                            db.add(GraphNode(id=dst))
                        db.commit()
                    except IntegrityError: db.rollback()
                
                # Aristas
                for _, row in graph_df.iterrows():
                    try:
                        # Aquí simplificamos: solo insertamos, si falla es que ya existe o hay conflicto
                        db.add(GraphEdge(source_id=row['Origen'], target_id=row['Destino'], relation=row['Relacion']))
                        db.commit()
                    except IntegrityError: db.rollback()
                    
                print("✅ Grafo verificado.")
            except Exception: pass
            
        # Inicializar pesos
        try:
            graph_service.init_weights(db)
        except: pass

ingestion_service = IngestionService()