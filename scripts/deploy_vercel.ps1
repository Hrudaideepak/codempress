# =====================================================================
# Codempress — Vercel CLI Deployment Script (PowerShell)
# =====================================================================
$ErrorActionPreference = "Stop"

$VercelToken = $env:VERCEL_TOKEN
$FrontendDir = Join-Path $PSScriptRoot "..\frontend"

Write-Host "====================================================" -ForegroundColor Cipher
Write-Host "🚀 Deploying Codempress Frontend to Vercel" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cipher

Set-Location $FrontendDir

if ($VercelToken) {
    Write-Host "Deploying with VERCEL_TOKEN..." -ForegroundColor Yellow
    npx vercel --prod --token="$VercelToken" --yes
}
else {
    Write-Host "Deploying with interactive / cached Vercel session..." -ForegroundColor Yellow
    npx vercel --prod --yes
}

Write-Host "====================================================" -ForegroundColor Cipher
Write-Host "🎉 Vercel frontend deployment completed." -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cipher
