@echo off
title Visor TV Sistemas - Digital Signage
color 0B
chcp 65001 > nul

echo ========================================================
echo        VISOR TV SISTEMAS - PANTALLAS DIGITALES
echo ========================================================
echo.

where php >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] No se encontro PHP en el sistema.
    echo Por favor asegurese de tener PHP en la variable PATH.
    pause
    exit /b 1
)

echo [1/3] Verificando compilacion de la interfaz React...
if not exist "client\dist\index.html" (
    echo Compilando cliente React por primera vez...
    cd client
    call npm run build
    cd ..
)

echo [2/3] Iniciando servidor web en http://localhost:8000 ...
:: Iniciar el navegador con 2 segundos de retraso para que PHP enlace el puerto primero
start /min cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

echo [3/3] Servidor listo.
echo.
echo ========================================================
echo   - Selector de Sedes:    http://localhost:8000
echo   - Panel Administracion: http://localhost:8000/admin
echo   - Usuario Administrador: admin
echo   - Clave Administrador:   admin123
echo ========================================================
echo.
echo Presione Ctrl + C para detener el servidor.
echo.

php -d upload_max_filesize=10G -d post_max_size=10G -d memory_limit=2048M -d max_execution_time=3600 -d max_input_time=3600 -S 0.0.0.0:8000 router.php
pause
