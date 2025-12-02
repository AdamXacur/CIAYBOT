from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from datetime import timedelta
from jose import jwt, JWTError # Importar JWTError para un manejo más específico

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Usuario Hardcodeado para la Demo
ADMIN_USER = "admin"
ADMIN_PASS_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW" # "admin123"

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Medida de seguridad para prevenir crash si se envía una contraseña > 72 bytes
    password_to_check = form_data.password[:72]
    
    if form_data.username != ADMIN_USER or not verify_password(password_to_check, ADMIN_PASS_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    --- FUNCIÓN DE SEGURIDAD RESTAURADA ---
    Decodifica el token JWT y valida al usuario. Ya no se salta la validación.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        # En un futuro, aquí se podría buscar el usuario en la base de datos
        # user = get_user_from_db(username)
        # if user is None:
        #     raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception