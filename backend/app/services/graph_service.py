from sqlalchemy.orm import Session
from app.models.knowledge import GraphNode, GraphEdge
from openai import OpenAI
from app.core.config import settings
import json
import math
import asyncio

class GraphService:
    def __init__(self):
        if settings.DEEPSEEK_API_KEY:
            self.client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_BASE_URL)
        else:
            self.client = None

    def get_topology(self, db: Session):
        # --- FIX: Limitar el crecimiento del grafo a los 150 nodos más importantes ---
        nodes = db.query(GraphNode).order_by(GraphNode.weight.desc()).limit(150).all()
        node_ids = {n.id for n in nodes}
        edges = db.query(GraphEdge).filter(GraphEdge.source_id.in_(node_ids), GraphEdge.target_id.in_(node_ids)).all()
        # -------------------------------------------------------------------------
        return self._format_graph(nodes, edges)

    async def get_dynamic_subgraph(self, db: Session, context: str):
        # ... (código sin cambios)
        if not self.client: return self.get_topology(db)
        if len(context) < 5: return self.get_topology(db)
        all_nodes = [n.id for n in db.query(GraphNode).all()]
        nodes_str = ", ".join(all_nodes[:150]) 
        prompt = f"""Selecciona 5 nodos relevantes para: "{context}"\nNodos: [{nodes_str}]\nJSON: {{ "selected_nodes": ["ID1"] }}"""
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
                model="deepseek-chat", messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}, temperature=0.1
            ))
            content = response.choices[0].message.content
            selection = json.loads(content)
            target_ids = selection.get("selected_nodes", [])
            if "CIAY" not in target_ids: target_ids.append("CIAY")
            nodes = db.query(GraphNode).filter(GraphNode.id.in_(target_ids)).all()
            edges = db.query(GraphEdge).filter(GraphEdge.source_id.in_(target_ids), GraphEdge.target_id.in_(target_ids)).all()
            return self._format_graph(nodes, edges)
        except: return self.get_topology(db)

    async def extract_knowledge_ai(self, user_msg: str, bot_msg: str):
        # ... (código sin cambios)
        if not self.client: return None
        prompt = f"""Extrae entidades y relaciones del chat.\nUser: {user_msg}\nBot: {bot_msg}\nJSON: {{ "new_nodes": [{{ "id": "X", "group": 2 }}], "new_edges": [{{ "source": "X", "target": "CIAY", "relation": "Y" }}] }}"""
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.client.chat.completions.create(
                model="deepseek-chat", messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}, temperature=0.1
            ))
            return json.loads(response.choices[0].message.content)
        except Exception as e: print(f"⚠️ Error DeepSeek: {e}"); return None

    def persist_knowledge(self, db: Session, data: dict):
        # ... (código sin cambios)
        if not data: return None
        nodes_added, edges_added = 0, 0
        try:
            for n in data.get("new_nodes", []):
                node_id = n["id"].strip()
                if len(node_id) > 50: continue
                existing = db.query(GraphNode).filter(GraphNode.id == node_id).first()
                if not existing: db.add(GraphNode(id=node_id, group=n.get("group", 2))); nodes_added += 1
                else: existing.weight += 1
            db.commit()
            for e in data.get("new_edges", []):
                src, tgt = e["source"].strip(), e["target"].strip()
                if db.query(GraphNode).filter(GraphNode.id == src).first() and db.query(GraphNode).filter(GraphNode.id == tgt).first():
                    if not db.query(GraphEdge).filter(GraphEdge.source_id == src, GraphEdge.target_id == tgt).first():
                        db.add(GraphEdge(source_id=src, target_id=tgt, relation=e["relation"])); edges_added += 1
            db.commit()
            if nodes_added > 0 or edges_added > 0: return f"Grafo +{nodes_added} nodos, +{edges_added} aristas."
        except Exception as e: db.rollback(); print(f"⚠️ Error DB: {e}")
        return None

    def _format_graph(self, nodes, edges):
        # ... (código sin cambios)
        formatted_nodes = []
        for n in nodes:
            w = max(1, n.weight); size = 4 + math.log(w) * 4 
            formatted_nodes.append({"id": n.id, "group": n.group, "val": size, "real_weight": w})
        return {"nodes": formatted_nodes, "links": [{"source": e.source_id, "target": e.target_id, "label": e.relation} for e in edges]}

    def init_weights(self, db: Session): pass

graph_service = GraphService()