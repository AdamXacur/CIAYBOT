import asyncio
import httpx
import time
import random
import json

# --- CONFIGURACIÓN DE LA DEMO ---
NUM_USERS = 15
MSGS_PER_USER = 10
TEST_DURATION_SECONDS = 60
API_URL = "http://localhost:8000/api/v1/chat"
# --------------------------------

FRASES = [
    "Soy Juan y tengo una startup de drones agrícolas.",
    "Me interesa aprender Python para análisis de datos.",
    "¿El gobierno ofrece apoyos para empresas de turismo?",
    "Trabajo en Google y quiero colaborar con el CIAY.",
    "Mi empresa SolarMaya busca ingenieros en energías renovables.",
    "Soy estudiante de la UADY y busco servicio social.",
    "¿Qué opinan de la ética en la IA generativa?",
    "Quiero invertir capital en tecnología de salud.",
    "Soy Ana, doctora, y quiero digitalizar expedientes.",
    "¿Tienen cursos de DeepSeek o Gemini?",
    "Represento a una ONG de conservación de cenotes.",
    "Busco mentoría para mi proyecto de Fintech.",
    "¿Cómo aplico IA para predecir el tráfico en Mérida?",
    "Soy arquitecto y uso IA para diseño generativo.",
    "¿El parque científico tiene oficinas disponibles?"
]

async def simulate_user(user_id, stats):
    print(f"👤 [Usuario_{user_id}] Conectado.")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for i in range(MSGS_PER_USER):
            msg = random.choice(FRASES)
            payload = {
                "message": msg,
                "session_id": f"stress_test_user_{user_id}"
            }
            
            start_req = time.time()
            try:
                # Usamos stream request porque el backend devuelve StreamingResponse
                async with client.stream("POST", API_URL, json=payload) as response:
                    if response.status_code == 200:
                        # Consumir el stream para completar la request
                        async for _ in response.aiter_text(): pass
                        stats["success"] += 1
                        print(f"   ✅ [Usuario_{user_id}] Msg {i+1}/{MSGS_PER_USER} enviado.")
                    else:
                        stats["errors"] += 1
                        print(f"   ❌ [Usuario_{user_id}] Error {response.status_code}")
            except Exception as e:
                stats["errors"] += 1
                print(f"   🔥 [Usuario_{user_id}] Excepción: {e}")
            
            # Calcular delay para distribuir los mensajes en el minuto
            elapsed = time.time() - start_req
            remaining_time = TEST_DURATION_SECONDS / MSGS_PER_USER
            sleep_time = max(0.1, remaining_time - elapsed + random.uniform(-0.5, 0.5))
            
            await asyncio.sleep(sleep_time)

async def main():
    print(f"🚀 INICIANDO STRESS TEST: {NUM_USERS} Usuarios | {MSGS_PER_USER} Msgs c/u | ~{TEST_DURATION_SECONDS}s")
    print("="*60)
    
    start_time = time.time()
    stats = {"success": 0, "errors": 0}
    
    tasks = [simulate_user(i, stats) for i in range(NUM_USERS)]
    await asyncio.gather(*tasks)
    
    total_time = time.time() - start_time
    print("="*60)
    print(f"🏁 TEST FINALIZADO en {total_time:.2f} segundos")
    print(f"📊 Total Mensajes: {stats['success'] + stats['errors']}")
    print(f"✅ Exitosos: {stats['success']}")
    print(f"❌ Errores:  {stats['errors']}")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())