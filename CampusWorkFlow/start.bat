@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   CampusWorkFlow — Demarrage
echo ============================================================

REM Verifier que .env existe
if not exist ".env" (
    echo [ERREUR] Fichier .env introuvable.
    echo Copier .env.example vers .env :
    echo   copy .env.example .env
    pause & exit /b 1
)

REM Verifier Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker Desktop n'est pas demarré.
    pause & exit /b 1
)

echo [1/4] Arrêt et nettoyage des conteneurs existants...
docker-compose down --remove-orphans

echo [2/4] Suppression des anciens volumes DB (evite conflits mot de passe)...
docker volume rm campusworkflow_identity-data 2>nul
docker volume rm campusworkflow_academic-data 2>nul
docker volume rm campusworkflow_finance-data  2>nul
docker volume rm campusworkflow_hr-data       2>nul
docker volume rm campusworkflow_message-data  2>nul
docker volume rm campusworkflow_notification-data 2>nul

echo [3/4] Construction et demarrage de tous les services...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo [ERREUR] Echec du demarrage. Logs :
    docker-compose logs --tail=30
    pause & exit /b 1
)

echo [4/4] Attente initialisation (60 secondes)...
timeout /t 60 /nobreak >nul

echo.
echo ============================================================
echo   Services disponibles :
echo ============================================================
echo   Frontend          : http://localhost:5173
echo   API Gateway       : http://localhost:3000
echo   Swagger Docs      : http://localhost:3000/api/docs
echo   RabbitMQ Console  : http://localhost:15672
echo     user: campus_rabbit / pass: rabbit_campus_2026
echo ============================================================
echo.
echo   Creer votre premier administrateur :
echo.
echo   curl -X POST http://localhost:3000/api/auth/register ^
echo     -H "Content-Type: application/json" ^
echo     -d "{\"full_name\":\"Admin\",\"email\":\"admin@campus.local\",\"password\":\"VotreMotDePasse123!\",\"role\":\"academic\"}"
echo.
echo ============================================================

start http://localhost:5173
