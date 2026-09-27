@echo off
title GLOAMREACH - local server
cd /d "%~dp0"
echo.
echo   GLOAMREACH: Chronicle of the Last Lantern
echo   Serving on http://localhost:8765  (Ctrl+C to stop)
echo.
start "" http://localhost:8765
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8765
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8765
  goto :eof
)
where npx >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p 8765 -c-1
  goto :eof
)
echo No Python or Node found. Install Python 3 and run again.
pause
