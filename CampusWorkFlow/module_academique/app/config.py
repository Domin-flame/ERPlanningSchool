from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:mot_de_passe@localhost:5432/academic_service"
    RABBITMQ_URL: str = "amqp://campus_rabbit:rabbit_pass@localhost:5672/"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
