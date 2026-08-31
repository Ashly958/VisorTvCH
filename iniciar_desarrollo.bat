@echo off
title Visor TV Sistemas (Modo Desarrollo)
color 0A
chcp 65001 > nul

echo ========================================================
echo      VISOR TV SISTEMAS - ENTORNO DE DESARROLLO
echo ========================================================
echo.
echo Iniciando backend PHP (Puerto 8000) y Frontend Vite (Puerto 5173)...
echo.

start "Visor TV Backend (PHP :8000)" php -d upload_max_filesize=10G -d post_max_size=10G -d memory_limit=2048M -d max_execution_time=3600 -d max_input_time=3600 -S 0.0.0.0:8000 router.php
cd client
start "Visor TV Frontend (Vite :5173)" npm run dev

echo Servidores iniciados en ventanas separadas.
echo Abriendo navegador en http://localhost:5173 ...
timeout /t 3 > nul
start "" http://localhost:5173
