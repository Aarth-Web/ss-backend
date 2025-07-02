# Twilio SMS Integration Guide

This guide explains how to set up and test the Twilio integration for sending SMS notifications in the attendance system.

## Configuration

1. Sign up for a Twilio account at [https://www.twilio.com](https://www.twilio.com) if you don't already have one.
2. From your Twilio dashboard, get your Account SID and Auth Token.
3. Purchase a Twilio phone number that can send SMS messages.
4. Add the following environment variables to your `.env` file:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here  # Include the + prefix, e.g., +14155238886
```

## Testing the Twilio Integration

You can test the Twilio integration by making a POST request to the `/attendance/test-sms` endpoint:

```
POST /attendance/test-sms
Content-Type: application/json
Authorization: Bearer your_auth_token

{
  "phoneNumber": "+1234567890"  // Replace with a real phone number including country code
}
```

This endpoint is only accessible to users with SUPERADMIN or SCHOOLADMIN roles.

### Response

If successful, you should receive:

```json
{
  "success": true,
  "message": "Test SMS sent successfully. Check your phone for the message."
}
```

If it fails, you'll get:

```json
{
  "success": false,
  "message": "Failed to send test SMS. Check the server logs for details."
}
```

### Testing with cURL

You can test the SMS functionality using cURL:

```bash
# First, login to get an access token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"registrationId": "your_admin_id", "password": "your_password"}'

# Then use the received token to test SMS
curl -X POST http://localhost:3000/attendance/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"phoneNumber": "+1234567890"}'
```

Replace `+1234567890` with the actual phone number you want to send the test message to. Make sure to include the country code.

## Using SMS in Attendance

When marking or updating attendance, you can request SMS notifications to be sent to parents by:

1. Setting `sendSmsToAllAbsent: true` to send messages to all absent students.
2. Providing specific student IDs in the `sendSmsTo` array.

The SMS will be sent to the mobile number stored in the student's user record.

### Message Format

The SMS message follows this format:

```
Your ward or child {student name} from class {classroom name} was absent today {formatted date}
```

## Troubleshooting

If your SMS is not being delivered:

1. Check that you've correctly configured the environment variables.
2. Verify that the phone number you're sending to is in the correct format (including country code).
3. Check the server logs for any error messages from Twilio.
4. Ensure your Twilio account has sufficient credit.
5. Make sure the phone number you're sending to is capable of receiving SMS (not a landline, etc.).
