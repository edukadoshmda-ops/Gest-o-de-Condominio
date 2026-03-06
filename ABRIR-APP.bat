@echo off
chcp 65001 >nul
title Gestor360
cd /d "%~dp0"

echo.
echo Gestor360 - Iniciando...
echo.
npm install
if errorlevel 1 (
    echo ERRO ao instalar.
    pause
    exit /b 1
)

echo.
echo Abrindo em 6 segundos...
echo.
start /B cmd /c "ping 127.0.0.1 -n 7 >nul & start http://localhost:5173"
npm run dev
pause
