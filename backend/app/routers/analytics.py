from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
# --- FIX DEFINITIVO: 'count' se usa a través de 'func' ---
from sqlalchemy import func, desc
# -------------------------------------------------------
from app.database import get_db
from app.models.knowledge import InteractionLog, UserTaxonomy, GraphNode
import json

router = APIRouter()

# --- ENDPOINT PARA INTELIGENCIA DE NEGOCIOS ---
@router.get("/intelligence")
def get_intelligence_dashboard(db: Session = Depends(get_db)):
    total_interactions = db.query(InteractionLog).count()
    total_sessions = db.query(InteractionLog.session_id).distinct().count()
    
    avg_sentiment = db.query(func.avg(InteractionLog.sentiment_score)).scalar() or 0.0
    
    intent_distribution = db.query(
        InteractionLog.detected_intent, 
        func.count(InteractionLog.id) # <-- USO CORRECTO DE COUNT
    ).group_by(InteractionLog.detected_intent).order_by(desc(func.count(InteractionLog.id))).all()

    latest_nodes = db.query(GraphNode).order_by(GraphNode.created_at.desc()).limit(5).all()

    return {
        "kpis": {
            "total_interactions": total_interactions,
            "total_sessions": total_sessions,
            "average_sentiment": round(avg_sentiment, 2)
        },
        "intent_distribution": [{"name": i[0], "value": i[1]} for i in intent_distribution],
        "new_entities": [{"id": n.id, "group": n.group} for n in latest_nodes]
    }

# --- ENDPOINTS PARA AUDITORÍA FORENSE ---
@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(
        InteractionLog.session_id,
        func.count(InteractionLog.id).label('message_count'),
        func.max(InteractionLog.created_at).label('last_activity')
    ).group_by(InteractionLog.session_id).order_by(desc('last_activity')).limit(100).all()
    
    return [
        {
            "session_id": s.session_id,
            "message_count": s.message_count,
            "last_activity": s.last_activity.isoformat()
        } for s in sessions
    ]

@router.get("/session/{session_id}")
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    logs = db.query(InteractionLog).filter(InteractionLog.session_id == session_id).order_by(InteractionLog.created_at.asc()).all()
    return [
        {
            "id": str(log.id),
            "timestamp": log.created_at.isoformat(),
            "user_input": log.user_input,
            "bot_response": log.bot_response,
            "metadata": {
                "intent": log.detected_intent,
                "sentiment": log.sentiment_label,
                "score": log.sentiment_score,
                "steps": json.loads(log.execution_steps) if log.execution_steps and log.execution_steps.startswith('[') else []
            }
        }
        for log in logs
    ]

# --- ENDPOINT PARA GESTIÓN DE PERFILES ---
@router.get("/profiles")
def get_user_profiles(db: Session = Depends(get_db)):
    profiles = db.query(UserTaxonomy).all()
    return [
        {
            "code": p.code,
            "description": p.description,
            "examples": p.examples
        }
        for p in profiles
    ]