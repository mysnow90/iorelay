Write-Host "Starting ioRelay..." -ForegroundColor Cyan
Write-Host "Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"
Start-Sleep -Seconds 2
Write-Host "Starting NMS..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd nms; npm start"
Start-Sleep -Seconds 2
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Write-Host "`nServices starting..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend: http://localhost:3001" -ForegroundColor White
Write-Host "NMS: http://localhost:8000" -ForegroundColor White
Write-Host "RTMP: rtmp://localhost/live" -ForegroundColor White
