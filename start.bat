@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   CampusWorkflow — Demarrage
echo ============================================================

REM Verifier que .env existe
if not exist ".env" (
    echo [ERREUR] Fichier .env introuvable.
    echo Copier .env.example vers .env :
    echo   copy .env.example .env
    echo Puis definir JWT_SECRET (voir .env.example) avant de relancer.
    pause & exit /b 1
)

REM Verifier Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker Desktop n'est pas demarre.
    pause & exit /b 1
)

echo [1/3] Arret des conteneurs existants (les donnees persistent)...
docker compose down --remove-orphans

if /I "%1"=="--reset" (
    echo [!] Option --reset : suppression de TOUTES les donnees ^(volumes^) !
    docker compose down -v --remove-orphans
)

echo [2/3] Construction et demarrage de tous les services...
docker compose up --build -d

if %errorlevel% neq 0 (
    echo [ERREUR] Echec du demarrage. Logs :
    docker compose logs --tail=50
    pause & exit /b 1
)

echo [3/3] Attente de l'initialisation des services (60 secondes)...
timeout /t 60 /nobreak >nul

echo.
echo ============================================================
echo   Services disponibles :
echo ============================================================
echo   Frontend          : http://localhost:5173
echo   API Gateway       : http://localhost:3000
echo   Swagger Docs      : http://localhost:3000/api/docs
echo   RabbitMQ Console  : http://localhost:15672
echo     (identifiants : voir RABBITMQ_USER / RABBITMQ_PASS dans .env)
echo ============================================================
echo.
echo   6 comptes de demonstration sont crees automatiquement
echo   (DB_AUTO_SEED=true dans .env). Voir README.md section 3
echo   ou QUICK_START.md pour la liste complete.
echo ============================================================

start http://localhost:5173
