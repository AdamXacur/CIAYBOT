from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.knowledge import InteractionLog, UserTaxonomy, ContactLead, CourseRegistration, CitizenReport
import json
from datetime import datetime, timedelta

router = APIRouter()

# --- DASHBOARD PRINCIPAL ---
@router.get("/dashboard/stats")
def get_real_dashboard_stats(db: Session = Depends(get_db)):
    total_interactions = db.query(InteractionLog).count()
    total_sessions = db.query(InteractionLog.session_id).distinct().count()
    
    intent_stats = db.query(InteractionLog.detected_intent, func.count(InteractionLog.id)).group_by(InteractionLog.detected_intent).all()
    formatted_intents = [{"name": i or "Desconocido", "value": c} for i, c in intent_stats]

    last_24h = datetime.utcnow() - timedelta(hours=24)
    hourly_activity = db.query(func.date_trunc('hour', InteractionLog.created_at).label('hour'), func.count(InteractionLog.id)).filter(InteractionLog.created_at >= last_24h).group_by('hour').order_by('hour').all()
    chart_data = [{"name": h.strftime("%H:00"), "tokens": c * 150, "latency": 0} for h, c in hourly_activity]
    if not chart_data: chart_data = [{"name": "Sin Datos", "tokens": 0, "latency": 0}]

    return {
        "kpis": {
            "total_interactions": total_interactions,
            "total_sessions": total_sessions,
            "avg_latency": "1.2s"
        },
        "intents_distribution": formatted_intents,
        "activity_chart": chart_data
    }

# --- NUEVOS ENDPOINTS PARA TOOLS (CRM / GOBIERNO) ---

@router.get("/leads")
def get_leads(db: Session = Depends(get_db)):
    leads = db.query(ContactLead).order_by(ContactLead.created_at.desc()).all()
    return leads

@router.get("/registrations")
def get_registrations(db: Session = Depends(get_db)):
    regs = db.query(CourseRegistration).order_by(CourseRegistration.created_at.desc()).all()
    return regs

@router.get("/reports")
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(CitizenReport).order_by(CitizenReport.created_at.desc()).all()
    return reports

# --- ENDPOINTS EXISTENTES ---

@router.get("/sessions")
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(InteractionLog.session_id, func.count(InteractionLog.id).label('message_count'), func.max(InteractionLog.created_at).label('last_activity')).group_by(InteractionLog.session_id).order_by(desc('last_activity')).limit(50).all()
    return [{"session_id": s.session_id, "message_count": s.message_count, "last_activity": s.last_activity.isoformat()} for s in sessions]

@router.get("/session/{session_id}")
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    logs = db.query(InteractionLog).filter(InteractionLog.session_id == session_id).order_by(InteractionLog.created_at.asc()).all()
    return [{"id": str(log.id), "timestamp": log.created_at.isoformat(), "user_input": log.user_input, "bot_response": log.bot_response, "metadata": {"intent": log.detected_intent, "sentiment": log.sentiment_label, "score": log.sentiment_score, "steps": json.loads(log.execution_steps) if log.execution_steps else []}} for log in logs]

@router.get("/profiles")
def get_user_profiles(db: Session = Depends(get_db)):
    profiles = db.query(UserTaxonomy).all()
    if not profiles:
        return [
            {"code": "INVERSIONISTA", "description": "Busca oportunidades de negocio", "examples": "Quiero invertir"},
            {"code": "ESTUDIANTE", "description": "Busca formación técnica", "examples": "Cursos de Python"},
            {"code": "GOBIERNO", "description": "Regulación y servicios", "examples": "Trámites"},
            {"code": "GENERAL", "description": "Ciudadanía", "examples": "¿Qué es el CIAY?"}
        ]
    return [{"code": p.code, "description": p.description, "examples": p.examples} for p in profiles]