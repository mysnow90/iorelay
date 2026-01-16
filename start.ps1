Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "     IORELAY888 - Streaming Server     " -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Starting all services..." -ForegroundColor Green
Write-Host ""

# Function to check if port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $null -ne $connection
    } catch {
        return $false
    }
}

# Kill processes on our ports
$ports = @(3001, 3100, 1936, 8001)
foreach ($port in $ports) {
    if (Test-PortInUse -Port $port) {
        Write-Host "Stopping process on port $port..." -ForegroundColor Yellow
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Milliseconds 500
    }
}

Write-Host ""
Write-Host "1. Starting RTMP/HLS Server (Port 1936, 8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\iorelay\nms'; node index.js`"" -WindowStyle Normal

Write-Host "   Waiting for RTMP server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "2. Starting Backend API (Port 3100)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\iorelay\backend'; node server.js`"" -WindowStyle Normal

Write-Host "   Waiting for API server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "3. Starting Frontend (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'C:\iorelay\frontend'; npm run dev`"" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 ACCESS URLS:" -ForegroundColor Yellow
Write-Host "   Dashboard:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "   API Server:   http://localhost:3100" -ForegroundColor Cyan
Write-Host "   RTMP Server:  rtmp://localhost:1936" -ForegroundColor Cyan
Write-Host "   HLS Server:   http://localhost:8001" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 HEALTH CHECK:" -ForegroundColor Yellow
Write-Host "   http://localhost:3100/health" -ForegroundColor White
Write-Host ""
Write-Host "📺 QUICK START:" -ForegroundColor Yellow
Write-Host "   1. Open browser to http://localhost:3001" -ForegroundColor White
Write-Host "   2. Click 'New Stream' to create a stream" -ForegroundColor White
Write-Host "   3. Use OBS with RTMP URL: rtmp://localhost:1936/live" -ForegroundColor White
Write-Host "   4. Watch stream at: http://localhost:8001/live/[stream_key]/index.m3u8" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop all services..."
Write-Host "=======================================" -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

# Cleanup
Write-Host "`nStopping all services..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Services stopped." -ForegroundColor Green
