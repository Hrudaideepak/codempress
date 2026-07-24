#!/usr/bin/env bash
# =====================================================================
# Codempress — Render CLI / Webhook Deployment Script (Bash)
# =====================================================================
set -e

RENDER_SERVICE_ID="${RENDER_SERVICE_ID:-srv-codempress-backend}"
RENDER_DEPLOY_HOOK_URL="${RENDER_DEPLOY_HOOK_URL:-}"

echo "===================================================="
echo "🚀 Triggering Codempress Backend Deployment on Render"
echo "===================================================="

if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
    echo "Executing Render Deploy Hook..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$RENDER_DEPLOY_HOOK_URL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 202 ]; then
        echo "✅ Deployment triggered successfully! HTTP $HTTP_CODE"
        echo "$BODY"
    else
        echo "❌ Failed to trigger Render deployment hook. HTTP $HTTP_CODE"
        echo "$BODY"
        exit 1
    fi
elif command -v render &> /dev/null; then
    echo "Executing Render CLI deploy..."
    render deploy "$RENDER_SERVICE_ID"
else
    echo "⚠️ Neither RENDER_DEPLOY_HOOK_URL nor 'render' CLI was found."
    echo "Please set RENDER_DEPLOY_HOOK_URL in your environment or install Render CLI."
    echo "Example: export RENDER_DEPLOY_HOOK_URL='https://api.render.com/deploy/srv-xxx?key=yyy'"
    exit 1
fi

echo "===================================================="
echo "🎉 Render deployment triggered cleanly."
echo "===================================================="
