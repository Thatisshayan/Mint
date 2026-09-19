@echo off
REM Installs GPT Researcher into a local venv and writes its .env for MINT.
REM Usage: download-gptresearcher.bat <install-dir>

set INSTALL_DIR=%~1
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%CD%

echo Checking for Python...
where python >nul 2>nul
if errorlevel 1 (
  echo Python not found. Please install Python 3.10+ from https://python.org and re-run.
  exit /b 1
)

echo Creating GPT Researcher venv...
python -m venv "%INSTALL_DIR%\gpt-researcher-venv"
call "%INSTALL_DIR%\gpt-researcher-venv\Scripts\activate.bat"
pip install gpt-researcher fastapi "uvicorn[standard]" python-dotenv

echo RETRIEVER=duckduckgo> "%INSTALL_DIR%\gpt-researcher.env"
echo FAST_LLM=ollama:llama3.2>> "%INSTALL_DIR%\gpt-researcher.env"
echo SMART_LLM=ollama:llama3.2>> "%INSTALL_DIR%\gpt-researcher.env"
echo OLLAMA_BASE_URL=http://localhost:11434>> "%INSTALL_DIR%\gpt-researcher.env"

echo GPT Researcher installed. Start it with:
echo   cd "%INSTALL_DIR%\gpt-researcher-venv" ^&^& python -m uvicorn main:app --port 8002
