#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Twilio SMS Test Script${NC}"
echo "This script will test the Twilio SMS integration by logging in and sending a test message."

# Ask for credentials
read -p "Enter your admin registration ID: " REGISTRATION_ID
read -s -p "Enter your password: " PASSWORD
echo ""

# Ask for the phone number to send the test message to
read -p "Enter the phone number to send the test SMS (include country code, e.g., +1234567890): " PHONE_NUMBER

echo -e "\n${YELLOW}Logging in...${NC}"

# Login and get access token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"registrationId\": \"$REGISTRATION_ID\", \"password\": \"$PASSWORD\"}")

# Extract access token from response
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "\n${RED}Login failed. Check your credentials.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "\n${GREEN}Successfully logged in!${NC}"
echo -e "\n${YELLOW}Sending test SMS to $PHONE_NUMBER...${NC}"

# Send test SMS
SMS_RESPONSE=$(curl -s -X POST http://localhost:3000/attendance/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"phoneNumber\": \"$PHONE_NUMBER\"}")

# Check if SMS was sent successfully
SUCCESS=$(echo $SMS_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" == "true" ]; then
  echo -e "\n${GREEN}Test SMS sent successfully!${NC}"
  echo "Check your phone for the message."
else
  echo -e "\n${RED}Failed to send test SMS.${NC}"
  echo "Response: $SMS_RESPONSE"
  echo "Check the server logs for more details."
fi

echo -e "\n${YELLOW}Test completed.${NC}"
