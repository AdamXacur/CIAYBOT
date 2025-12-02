from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI(title="CIAY Neuro-Symbolic Engine")

# Configuración CORS para que tu Frontend React pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar Datos en Memoria al inicio (Simulando Bases de Datos)
try:
    # Ajustamos la ruta para que lea desde la carpeta data relativa
    knowledge_df = pd.read_csv("data/knowledge_base.csv")
    graph_df = pd.read_csv("data/grafo_relaciones.csv")
    taxonomy_df = pd.read_csv("data/taxonomia_usuarios.csv")
    print("✅ [SISTEMA] Datos semilla cargados correctamente en memoria.")
except Exception as e:
    print(f"❌ [ERROR] No se pudieron cargar los datos: {e}")

@app.get("/")
def read_root():
    return {"status": "online", "system": "CIAY Neuro-Symbolic Core", "version": "1.0.0"}

@app.get("/api/graph")
def get_graph_topology():
    """
    Retorna la topología del grafo para el visualizador 3D del Frontend.
    """
    nodes = set()
    links = []
    
    if 'graph_df' in globals():
        for _, row in graph_df.iterrows():
            nodes.add(row['Origen'])
            nodes.add(row['Destino'])
            links.append({
                "source": row['Origen'],
                "target": row['Destino'],
                "label": row['Relacion']
            })
    
    # Formato compatible con react-force-graph
    return {
        "nodes": [{"id": name, "group": 1} for name in nodes],
        "links": links
    }

@app.post("/api/chat")
def chat_interaction(message: str):
    """
    Endpoint principal. Aquí irá la lógica de Gemini + RAG.
    Por ahora, es un eco que simula los estados.
    """
    # Simulación de logs para la terminal
    logs = [
        "[STATE_01] Inicializando enlace seguro...",
        f"[STATE_02] Procesando input: '{message}'...",
        "[STATE_03] Consultando Vector DB...",
        "[STATE_07] Sintetizando respuesta..."
    ]
    
    return {
        "response": "Esta es una respuesta simulada del CIAY. (Conecta tu API Key para activar Gemini)",
        "logs": logs,
        "detected_intent": "CIUDADANO" # Esto luego lo hará la IA
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)