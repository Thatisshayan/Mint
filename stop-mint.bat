@echo off
cd /d "%~dp0"

echo Stopping MINT services...

:: Stop ComfyUI
taskkill /FI "WINDOWTITLE eq ComfyUI*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq *ComfyUI*" /F >nul 2>&1

:: Stop Backend
taskkill /FI "WINDOWTITLE eq MINT-Backend*" /F >nul 2>&1

:: Stop Frontend (Vite dev server)
taskkill /FI "WINDOWTITLE eq MINT-Frontend*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *MINT-Frontend*" /F >nul 2>&1

:: Stop Ollama serve (only if we started it)
taskkill /FI "WINDOWTITLE eq Ollama*" /F >nul 2>&1

echo All services stopped.
