#!/usr/bin/env bash
# Lovemaxxing — One-shot deploy script
# Run this after completing the steps in DEPLOY.md
# Requires: Node.js, Vercel CLI, Railway CLI

set -e

RAILWAY="/Users/zane/.local/bin/railway"

echo ""
echo "═══════════════════════════════════════════"
echo "  Lovemaxxing Deployment Script"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. Deploy backend to Railway ─────────────────────────────────────────────
echo "▶ Deploying backend to Railway..."
cd "$(dirname "$0")/backend"

# Check Railway auth
if ! $RAILWAY whoami &>/dev/null; then
  echo ""
  echo "Not logged in to Railway. Running browserless login..."
  $RAILWAY login --browserless
fi

# Link or create project
if ! $RAILWAY status &>/dev/null; then
  echo "Creating new Railway project..."
  $RAILWAY init
fi

# Set env vars from .env file
echo "Setting Railway environment variables..."
if [ -f .env ]; then
  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    # Skip empty values
    [[ -z "$val" ]] && continue
    $RAILWAY variables --set "$key=$val" 2>/dev/null || true
  done < .env
fi

# Deploy
echo "Deploying backend..."
$RAILWAY up --detach

BACKEND_URL=$($RAILWAY domain 2>/dev/null || echo "")
echo ""
echo "✓ Backend deployed!"
if [ -n "$BACKEND_URL" ]; then
  echo "  Backend URL: https://$BACKEND_URL"
fi

# ── 2. Deploy frontend to Vercel ─────────────────────────────────────────────
echo ""
echo "▶ Deploying frontend to Vercel..."
cd ..

if ! command -v vercel &>/dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Set API URL env var
if [ -n "$BACKEND_URL" ]; then
  echo "Setting NEXT_PUBLIC_API_URL=https://$BACKEND_URL"
  vercel env add NEXT_PUBLIC_API_URL production <<< "https://$BACKEND_URL" 2>/dev/null || true
fi

vercel --prod

echo ""
echo "═══════════════════════════════════════════"
echo "  ✓ Lovemaxxing is deployed!"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Fill in SMTP credentials in backend/.env then re-run Railway deploy"
echo "  2. Set up Cloudinary and add credentials to Railway env vars"
echo "  3. Update FRONTEND_URL in Railway env vars to your Vercel URL"
