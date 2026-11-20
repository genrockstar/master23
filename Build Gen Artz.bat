@echo off
title Build Gen Artz
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org then run this file again.
  start https://nodejs.org
  pause
  exit /b 1
)
echo Installing build tools (first run takes a few minutes)...
call npm install
if errorlevel 1 ( echo Install failed. & pause & exit /b 1 )
echo Building the Windows installer and portable app...
call npm run dist
if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )
echo.
echo Done! Your installer and portable .exe are in the "dist" folder.
start "" "%~dp0dist"
pause
