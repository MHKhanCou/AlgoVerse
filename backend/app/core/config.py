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
    DEV_DATABASE_URL: str = "sqlite:///./algoverse.db"
    PROD_DATABASE_URL: str = "postgresql://algoverse:YlFdZFHcwaR7VjIOJu3sMMZtacMI9WfW@dpg-d5knpp94tr6s73clndv0-a/algoverse"
    
    # CORS Origins
    DEV_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    PROD_CORS_ORIGINS: str = "https://algo-verse-eight.vercel.app,https://algo-verse-mehedi-hasan-khans-projects.vercel.app,https://algo-verse-git-main-mehedi-hasan-khans-projects.vercel.app,https://algo-verse-la484m77d-mehedi-hasan-khans-projects.vercel.app"
    
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
    JWT_SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = "algoverse.mh@gmail.com"
    SMTP_PASSWORD: str = "rlif mhws ocyj gdmp"
    FROM_EMAIL: str = "AlgoVerse <algoverse.mh@gmail.com>"
    
    # Security
    BCRYPT_ROUNDS: int = 12
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    
    # Application Settings
    DEBUG: bool = False
    DISABLE_EMAIL: bool = False
    AUTO_CREATE_TABLES: bool = False
    
    # Python Version
    PYTHON_VERSION: str = "3.11.9"
    
    # Properties for automatic switching
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def database_url(self) -> str:
        """Get appropriate database URL based on environment"""
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

# Print configuration on startup (for debugging)
print(f"🚀 AlgoVerse Configuration:")
print(f"   Environment: {settings.ENVIRONMENT}")
print(f"   Database: {settings.database_url}")
print(f"   Frontend: {settings.frontend_url}")
print(f"   Backend: {settings.backend_url}")
print(f"   CORS Origins: {settings.cors_origins}")
print(f"   Debug Mode: {settings.debug_mode}")
print("=" * 50)
