"""
Configuration Management for AlgoVerse
Environment-based automatic switching without commenting/uncommenting
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings with environment-based switching"""

    # Environment
    ENVIRONMENT: str = "development"

    # Database URLs
    DATABASE_URL: str = ""  # Render sets this; overrides DEV/PROD when present
    DEV_DATABASE_URL: str = "sqlite:///./algoverse.db"
    PROD_DATABASE_URL: str = ""

    # CORS Origins
    DEV_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    PROD_CORS_ORIGINS: str = "https://algo-verse-eight.vercel.app,https://algo-verse-mehedi-hasan-khans-projects.vercel.app,https://algo-verse-git-main-mehedi-hasan-khans-projects.vercel.app,https://algo-verse-la484m77d-mehedi-hasan-khans-projects.vercel.app,https://algoverse.vercel.app"

    # Frontend URLs
    DEV_FRONTEND_URL: str = "http://localhost:5173"
    PROD_FRONTEND_URL: str = "https://algo-verse-eight.vercel.app"

    # Backend URLs
    DEV_BACKEND_URL: str = "http://localhost:8000"
    PROD_BACKEND_URL: str = "https://algoverse-kpwz.onrender.com"

    # JWT Configuration
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"
    JWT_SECRET_KEY: str = ""

    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "AlgoVerse"

    # Security
    BCRYPT_ROUNDS: int = 12
    SECRET_KEY: str = ""

    # Application Settings
    DEBUG: bool = False
    DISABLE_EMAIL: bool = False
    AUTO_CREATE_TABLES: bool = False
    BASE_URL: str = ""

    # Python Version
    PYTHON_VERSION: str = "3.11.9"
    
    # Properties for automatic switching
    @property
    def is_production(self) -> bool:
        """Auto-detect production: explicit ENVIRONMENT=production OR DATABASE_URL is PostgreSQL"""
        if self.ENVIRONMENT.lower() == "production":
            return True
        # If DATABASE_URL is set to PostgreSQL, treat as production
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgresql"):
            return True
        if self.PROD_DATABASE_URL and self.PROD_DATABASE_URL.startswith("postgresql"):
            return True
        return False
    
    @property
    def database_url(self) -> str:
        """Get appropriate database URL: DATABASE_URL > PROD/DEV based on environment"""
        # DATABASE_URL from env takes priority (Render sets this)
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return self.PROD_DATABASE_URL if self.is_production else self.DEV_DATABASE_URL
    
    @property
    def cors_origins(self) -> List[str]:
        """Get appropriate CORS origins based on environment"""
        origins = self.PROD_CORS_ORIGINS if self.is_production else self.DEV_CORS_ORIGINS
        return [origin.strip() for origin in origins.split(",")]
    
    @property
    def frontend_url(self) -> str:
        """Get appropriate frontend URL based on environment"""
        return self.PROD_FRONTEND_URL if self.is_production else self.DEV_FRONTEND_URL
    
    @property
    def backend_url(self) -> str:
        """Get appropriate backend URL based on environment"""
        return self.PROD_BACKEND_URL if self.is_production else self.DEV_BACKEND_URL
    
    @property
    def debug_mode(self) -> bool:
        """Get debug mode based on environment"""
        return self.DEBUG if self.is_production else True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()
