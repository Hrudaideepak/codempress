# =====================================================================
# Codempress — Render CLI / Webhook Deployment Script (PowerShell)
# =====================================================================
$ErrorActionPreference = "Stop"

$RenderDeployHookUrl = $env:RENDER_DEPLOY_HOOK_URL
$RenderServiceId = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-codempress-backend" }

Write-Host "====================================================" -ForegroundColor Cipher
Write-Host "🚀 Triggering Codempress Backend Deployment on Render" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cipher

if ($RenderDeployHookUrl) {
    Write-Host "Executing Render Deploy Hook..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $RenderDeployHookUrl -Method Post
    Write-Host "✅ Render deployment triggered successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
}
elseif (Get-Command render -ErrorAction SilentlyContinue) {
    Write-Host "Executing Render CLI deploy..." -ForegroundColor Yellow
    & render deploy $RenderServiceId
}
else {
    Write-Host "⚠️ Neither RENDER_DEPLOY_HOOK_URL nor 'render' CLI was found." -ForegroundColor Red
    Write-Host "Please set `$env:RENDER_DEPLOY_HOOK_URL or install Render CLI." -ForegroundColor Yellow
    Write-Host "Example: `$env:RENDER_DEPLOY_HOOK_URL='https://api.render.com/deploy/srv-xxx?key=yyy'" -ForegroundColor Yellow
    exit 1
}

Write-Host "====================================================" -ForegroundColor Cipher
Write-Host "🎉 Render deployment triggered cleanly." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cipher
