@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%" || goto :failed

echo ============================================================
echo   CampusWorkFlow - build local sans Docker
echo ============================================================

where node >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js est requis. Installez Node.js puis relancez.
    goto :failed
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] npm est introuvable. Verifiez l'installation de Node.js.
    goto :failed
)

where py >nul 2>&1
if not errorlevel 1 (
    py -3 --version >nul 2>&1
    if not errorlevel 1 (
        set "PYTHON_CMD=py -3"
        goto :python_found
    )
)
where python >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python 3 est requis. Installez Python 3 puis relancez.
    goto :failed
)
set "PYTHON_CMD=python"

:python_found
%PYTHON_CMD% --version
if errorlevel 1 goto :failed

echo.
echo [1/8] Installation et build du frontend...
pushd "%ROOT%frontend" || goto :failed
call npm ci
if errorlevel 1 (
    popd
    goto :failed
)
call npm run lint
if errorlevel 1 (
    popd
    goto :failed
)
call npm run build
if errorlevel 1 (
    popd
    goto :failed
)
popd

echo.
echo [2/8] Installation et verification de la passerelle...
pushd "%ROOT%gateway" || goto :failed
call npm install
if errorlevel 1 (
    popd
    goto :failed
)
node --check server.js
if errorlevel 1 (
    popd
    goto :failed
)
popd

echo.
echo Preparation des services Python dans des environnements isoles...
echo [3/8] Service authentification...
call :build_python_service "%ROOT%module_authentification"
if errorlevel 1 goto :failed
echo [4/8] Service academique...
call :build_python_service "%ROOT%module_academique"
if errorlevel 1 goto :failed
echo [5/8] Service finance...
call :build_python_service "%ROOT%module_finance_marketing\finance-service"
if errorlevel 1 goto :failed
echo [6/8] Service RH...
call :build_python_service "%ROOT%module_rh"
if errorlevel 1 goto :failed
echo [7/8] Service messagerie...
call :build_python_service "%ROOT%module_message"
if errorlevel 1 goto :failed
echo [8/8] Service notifications...
call :build_python_service "%ROOT%module_notification"
if errorlevel 1 goto :failed

echo.
echo ============================================================
echo   Build termine avec succes.
echo   Frontend compile : frontend\dist
echo   Environnements Python : .venv dans chaque service
echo.
echo   Ce script ne demarre pas les services ni leurs dependances.
echo   Pour executer l'application sans Docker, installez et configurez
echo   PostgreSQL, Redis et RabbitMQ localement, puis lancez les API.
echo ============================================================
exit /b 0

:build_python_service
set "SERVICE_DIR=%~1"
echo   - %SERVICE_DIR%
if not exist "%SERVICE_DIR%\requirements.txt" (
    echo [ERREUR] requirements.txt introuvable dans %SERVICE_DIR%
    exit /b 1
)
if not exist "%SERVICE_DIR%\.venv\Scripts\python.exe" (
    %PYTHON_CMD% -m venv "%SERVICE_DIR%\.venv"
    if errorlevel 1 exit /b 1
)
"%SERVICE_DIR%\.venv\Scripts\python.exe" -m pip install -r "%SERVICE_DIR%\requirements.txt"
if errorlevel 1 exit /b 1
"%SERVICE_DIR%\.venv\Scripts\python.exe" -m compileall -q "%SERVICE_DIR%\app"
if errorlevel 1 exit /b 1
if exist "%SERVICE_DIR%\main.py" (
    "%SERVICE_DIR%\.venv\Scripts\python.exe" -m compileall -q "%SERVICE_DIR%\main.py"
    if errorlevel 1 exit /b 1
)
exit /b 0

:failed
echo.
echo [ERREUR] Build interrompu. Corrigez l'erreur ci-dessus puis relancez build.bat.
exit /b 1
