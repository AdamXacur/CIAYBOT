import os
from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str
    
    SQLALCHEMY_DATABASE_URI: str = ""

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: str, info) -> str:
        if isinstance(v, str) and v: return v
        return str(f"postgresql://{info.data.get('POSTGRES_USER')}:{info.data.get('POSTGRES_PASSWORD')}@{info.data.get('POSTGRES_SERVER')}:{info.data.get('POSTGRES_PORT')}/{info.data.get('POSTGRES_DB')}")

    BACKEND_CORS_ORIGINS: List[str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["): return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)): return v
        raise ValueError(v)

    # --- DEEPSEEK CONFIG ---
    DEEPSEEK_API_KEY: str
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()