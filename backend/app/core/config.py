"""
Configuration Management for AlgoVerse
Environment-based automatic switching without commenting/uncommenting
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import logging
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
    # Production origins. Localhost is deliberately NOT included: with
    # allow_credentials=True it would let any page on a developer's machine
    # make authenticated calls against production. Override with the
    # PROD_CORS_ORIGINS env var to add origins without editing code.
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
    SECRET_KEY: str = ""
    BCRYPT_ROUNDS: int = 12

    # Redis (optional contest cache)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    # App Settings
    DEBUG: bool = True
    DISABLE_EMAIL: bool = True
    AUTO_CREATE_TABLES: bool = False
    BASE_URL: str = "http://localhost:8000"

    # AI practice-problem suggestions (optional, OpenAI-compatible endpoint).
    # An empty AI_API_KEY disables only the model pass: suggestions still work,
    # ranked deterministically from the verified problem pool.
    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-4o-mini"
    AI_TIMEOUT_SECONDS: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        """Auto-detect production: explicit ENVIRONMENT=production OR DATABASE_URL is PostgreSQL"""
        if self.ENVIRONMENT.lower() == "production":
            return True
        # If DATABASE_URL is set to PostgreSQL, treat as production
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgresql"):
            return True
        return False

    @property
    def database_url(self) -> str:
        """Get the database URL based on environment"""
        # Prefer DATABASE_URL if set (Render-provided production URL)
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return self.PROD_DATABASE_URL if self.is_production else self.DEV_DATABASE_URL

    @property
    def cors_origins(self) -> List[str]:
        """Get appropriate CORS origins based on environment"""
        origins = self.PROD_CORS_ORIGINS if self.is_production else self.DEV_CORS_ORIGINS
        return [origin.strip() for origin in origins.split(",")]

    @property
    def auto_create_tables(self) -> bool:
        """
        Whether to create tables from the models on startup.

        On in development so a fresh checkout works with no migration step;
        in production it requires an explicit AUTO_CREATE_TABLES=true, because
        create_all() against a live database should be a deliberate choice
        rather than something inherited from a default.
        """
        if self.is_production:
            return self.AUTO_CREATE_TABLES
        return True

    def validate_for_production(self) -> None:
        """
        Fail fast on a production setup that would be silently unsafe.

        jwt_token.py binds JWT_SECRET_KEY at import time, and python-jose will
        sign an HS256 token with an empty key without complaining. A deploy
        that forgot the variable therefore still boots, still hands out access
        tokens, and accepts tokens forged by anyone who guesses the algorithm -
        the worst sort of failure, because nothing looks broken. Raising here
        turns it into a failed deploy instead.

        Only conditions that make the running app unsafe are fatal. Weaker
        problems are logged and left to the operator's judgement.
        """
        if not self.is_production:
            return

        if not self.JWT_SECRET_KEY:
            raise RuntimeError(
                "JWT_SECRET_KEY is empty while running in production. Access tokens would be "
                "signed with an empty HMAC key, so anyone could forge one. Set JWT_SECRET_KEY "
                "in the deploy environment, e.g. "
                'python -c "import secrets; print(secrets.token_hex(32))"'
            )

        local_origins = [
            origin
            for origin in self.cors_origins
            if "localhost" in origin or "127.0.0.1" in origin
        ]
        if local_origins:
            logging.getLogger(__name__).warning(
                "Running in production but PROD_CORS_ORIGINS allows %s. The API sends "
                "credentials, so a page served from a developer machine could make "
                "authenticated requests. Remove these origins.",
                local_origins,
            )

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

settings = Settings()
