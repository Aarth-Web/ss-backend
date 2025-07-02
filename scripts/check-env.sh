#!/bin/bash

# Environment variable check script for deployment
# Run this before deploying to ensure all required environment variables are set

echo "Checking required environment variables..."

# Function to check if variable exists
check_var() {
  VAR_NAME=$1
  if [ -z "${!VAR_NAME}" ]; then
    echo "❌ $VAR_NAME is not set"
    MISSING_VARS=1
  else
    echo "✅ $VAR_NAME is set"
  fi
}

# Source .env file if it exists
if [ -f .env ]; then
  echo "Loading .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check all required variables
check_var "MONGODB_URI"
check_var "JWT_SECRET"
check_var "JWT_EXPIRES_IN"
check_var "TWILIO_ACCOUNT_SID"
check_var "TWILIO_AUTH_TOKEN"
check_var "TWILIO_PHONE_NUMBER"
check_var "RAPIDAPI_KEY"
check_var "RAPIDAPI_HOST"
check_var "SUPERADMIN_SECRET"

# Check if any variables are missing
if [ "$MISSING_VARS" == "1" ]; then
  echo ""
  echo "❌ Some required environment variables are missing. Please set them before deploying."
  exit 1
else
  echo ""
  echo "✅ All required environment variables are set."
  echo "You can proceed with deployment."
  exit 0
fi
