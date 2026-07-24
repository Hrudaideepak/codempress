#!/usr/bin/env bash
# =====================================================================
# Codempress — Vercel CLI Deployment Script (Bash)
# =====================================================================
set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
PROD_FLAG="--prod"

echo "===================================================="
echo "🚀 Deploying Codempress Frontend to Vercel"
echo "===================================================="

cd "$(dirname "$0")/../frontend"

if [ -n "$VERCEL_TOKEN" ]; then
    echo "Deploying with VERCEL_TOKEN..."
    npx vercel $PROD_FLAG --token="$VERCEL_TOKEN" --yes
else
    echo "Deploying with interactive / cached Vercel session..."
    npx vercel $PROD_FLAG --yes
fi

echo "===================================================="
echo "🎉 Vercel frontend deployment completed."
echo "===================================================="
