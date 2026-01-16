@echo off
echo Starting ioRelay...
echo Starting Backend...
start "ioRelay Backend" powershell -NoExit -Command "cd backend; npm start"
timeout /t 2 >nul
echo Starting NMS...
start "ioRelay NMS" powershell -NoExit -Command "cd nms; npm start"
timeout /t 2 >nul
echo Starting Frontend...
start "ioRelay Frontend" powershell -NoExit -Command "cd frontend; npm run dev"
echo.
echo Services starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo NMS: http://localhost:8000
echo RTMP: rtmp://localhost/live
echo.
pause
