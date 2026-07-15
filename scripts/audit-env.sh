#!/bin/bash
# Environment & Secrets Audit Script
# Run this to ensure no secrets have leaked into Git or the build

echo "Starting Environment Security Audit..."

# 1. Check for committed .env files
ENV_FILES=$(git ls-files | grep '\.env' | grep -v '\.example')
if [ -n "$ENV_FILES" ]; then
  echo "❌ FAILED: Found committed .env files:"
  echo "$ENV_FILES"
  exit 1
fi
echo "✅ Passed: No .env files committed."

# 2. Check for private keys in code
PRIVATE_KEYS=$(git grep -i "PRIVATE_KEY\|BEGIN RSA PRIVATE KEY\|BEGIN PRIVATE KEY")
if [ -n "$PRIVATE_KEYS" ]; then
  echo "❌ FAILED: Found potential private keys in codebase."
  echo "$PRIVATE_KEYS"
  exit 1
fi
echo "✅ Passed: No hardcoded private keys found."

# 3. Check for service accounts
SERVICE_ACCOUNTS=$(git ls-files | grep 'service-account.*\.json\|firebase-adminsdk.*\.json')
if [ -n "$SERVICE_ACCOUNTS" ]; then
  echo "❌ FAILED: Found committed service account JSON files."
  echo "$SERVICE_ACCOUNTS"
  exit 1
fi
echo "✅ Passed: No service account files committed."

# 4. Check for Firebase Admin SDK or explicit secrets in frontend code
# The frontend should only ever use import.meta.env.* (Vite env vars)
# We grep for 'process.env' inside apps/web-editor/src and packages/
FRONTEND_PROCESS_ENV=$(grep -r "process\.env" apps/web-editor/src packages/ | grep -v "node_modules" | grep -v "dist")
if [ -n "$FRONTEND_PROCESS_ENV" ]; then
  echo "❌ FAILED: Found 'process.env' usage in frontend code. Use 'import.meta.env.VITE_*' instead."
  echo "$FRONTEND_PROCESS_ENV"
  exit 1
fi
echo "✅ Passed: Frontend uses Vite environment variables."

echo "All environment security checks passed! 🚀"
exit 0
