@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 18+ is required. & pause & exit /b 1)
if not exist node_modules\@gradio\client\package.json (
  echo Installing VESTIRE dependencies...
  call npm install
  if errorlevel 1 (echo npm install failed. & pause & exit /b 1)
)
call npm start
pause
