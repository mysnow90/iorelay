@echo off
title IORELAY888 - Streaming Server
echo =======================================
echo      IORELAY888 - Streaming Server
echo =======================================
echo.

echo Starting RTMP/HLS Server...
start powershell -NoExit -Command "cd /d C:\iorelay\nms && node index.js"
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend API...
start powershell -NoExit -Command "cd /d C:\iorelay\backend && node server.js"
timeout /t 2 /nobreak >nul

echo.
echo Starting Frontend...
start powershell -NoExit -Command "cd /d C:\iorelay\frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo =======================================
echo        SERVICES STARTED!
echo =======================================
echo.
echo Dashboard:    http://localhost:3001
echo API Server:   http://localhost:3100
echo RTMP Server:  rtmp://localhost:1936
echo HLS Server:   http://localhost:8001
echo.
echo Press any key to stop all services...
pause >nul

taskkill /f /im node.exe >nul 2>&1
echo Services stopped.
pause
