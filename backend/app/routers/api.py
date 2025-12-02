from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.chat import GraphData
from app.services.graph_service import graph_service

router = APIRouter()

@router.get("/graph", response_model=GraphData)
def graph_endpoint(db: Session = Depends(get_db)):
    return graph_service.get_topology(db)