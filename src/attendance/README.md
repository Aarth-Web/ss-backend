# Attendance Module

This module handles attendance management for classrooms, including marking attendance, retrieving attendance records, and sending SMS notifications to parents of absent students.

## Features

- Mark attendance for students in a classroom
- Retrieve attendance records with filtering options (by classroom, date range, student)
- Send SMS notifications to parents of absent students
- Role-based access control for different operations

## API Endpoints

### Mark Attendance

```
POST /attendance
```

**Access:** SUPERADMIN, SCHOOLADMIN, TEACHER

**Request Body:**

```json
{
  "classroomId": "classroom-id",
  "date": "2023-07-01",
  "records": [
    { "student": "student-id-1", "present": true },
    { "student": "student-id-2", "present": false }
  ],
  "sendSmsTo": ["student-id-2"],
  "sendSmsToAllAbsent": false
}
```

### Get Attendance Records

```
GET /attendance
```

**Access:** All roles (Students can only see their own attendance)

**Query Parameters:**

- `classroomId` (optional): Filter by classroom
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `studentId` (optional): Filter by student (not available for students)

### Get Attendance by ID

```
GET /attendance/:id
```

**Access:** All roles

### Update Attendance

```
PUT /attendance/:id
```

**Access:** SUPERADMIN, SCHOOLADMIN, TEACHER

**Request Body:**

```json
{
  "date": "2023-07-01",
  "records": [
    { "student": "student-id-1", "present": true },
    { "student": "student-id-2", "present": false }
  ],
  "sendSmsTo": ["student-id-2"],
  "sendSmsToAllAbsent": false
}
```

### Delete Attendance

```
DELETE /attendance/:id
```

**Access:** SUPERADMIN, SCHOOLADMIN only

## SMS Notifications

The system can send SMS notifications to parents of absent students. This can be triggered in two ways:

1. Setting `sendSmsToAllAbsent` to `true` in the request
2. Providing specific student IDs in the `sendSmsTo` array

The SMS will be sent to the mobile number stored in the `mobile` field of the student's user record.

### SMS Message Format

The SMS sent to parents follows this format:

```
Your ward or child {student name} from class {classroom name} was absent today {formatted date}
```

For example:

```
Your ward or child John Smith from class 9A was absent today Monday, July 1, 2023
```

### SMS Provider Configuration (Twilio)

The application uses Twilio as the SMS provider. To configure Twilio:

1. Sign up for a Twilio account at [https://www.twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a Twilio phone number that can send SMS
4. Set up the following environment variables:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here  # Include the + prefix, e.g., +14155238886
```

**Note:** If Twilio credentials are not provided, the application will log SMS messages to the console instead of sending them.
