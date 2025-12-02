import os
import pandas as pd

# Este script simula la "Vectorización". 
# Lee los archivos de texto y los prepara para la base de datos.

DOCS_DIR = "documents"
OUTPUT_CSV = "data/knowledge_base_full.csv"

def ingest_documents():
    data = []
    print(f"📂 Leyendo documentos desde {DOCS_DIR}...")
    
    if not os.path.exists(DOCS_DIR):
        print("❌ No existe el directorio de documentos.")
        return

    for filename in os.listdir(DOCS_DIR):
        if filename.endswith(".txt"):
            filepath = os.path.join(DOCS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
                # Crear metadatos básicos basados en el nombre del archivo
                topic = filename.replace(".txt", "").replace("_", " ").title()
                
                data.append({
                    "ID": filename,
                    "Tema": topic,
                    "Contenido": content,
                    "Keywords": "ciai, yucatan, ia", # Placeholder
                    "Nivel_Tecnico": "General",
                    "Sector_Aplicacion": "Transversal",
                    "Fuente_URL": "Documentación Oficial CIAY"
                })
                print(f"  ✅ Procesado: {filename}")

    # Guardar como CSV listo para el sistema RAG
    df = pd.DataFrame(data)
    os.makedirs("data", exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"🚀 Base de conocimiento generada en: {OUTPUT_CSV}")
    print("   (Ahora el sistema RAG leerá de este archivo maestro)")

if __name__ == "__main__":
    ingest_documents()