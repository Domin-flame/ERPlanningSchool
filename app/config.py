from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:Lagloire1.0@localhost:5432/academic_service"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
