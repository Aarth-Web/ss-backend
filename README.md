# School System Backend

This is the backend API for the School System application, built with NestJS and MongoDB.

## Features

- User authentication with JWT
- Role-based access control
- School management
- Classroom management
- Attendance tracking with SMS notifications
- Reading paragraph assignments for English pronunciation practice

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Update the following environment variables in the `.env` file:

```properties
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority

# Super Admin Secret for special operations
SUPERADMIN_SECRET=your-very-secret-token

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=24h

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# RapidAPI Configuration (for translation service)
RAPIDAPI_KEY=your_rapid_api_key
RAPIDAPI_HOST=deep-translate1.p.rapidapi.com
```

```bash
cp .env.example .env
```

Edit the `.env` file and add your configuration values:

```
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

4. Start the development server:

```bash
npm run start:dev
```

## Authentication

The system uses JWT for authentication. Every request to protected endpoints must include an Authorization header with a valid token:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Login

```
POST /auth/login
```

Request body:

```json
{
  "registrationId": "user_registration_id",
  "password": "user_password"
}
```

Response:

```json
{
  "access_token": "jwt_token",
  "user": {
    "_id": "user_id",
    "name": "User Name",
    "role": "user_role",
    ...
  }
}
```

## SMS Notifications

SMS notifications are sent to parents of absent students using Twilio. See the [Twilio Setup Guide](src/attendance/TWILIO_SETUP.md) for more information.

To test the SMS configuration, run:

```bash
./test-twilio.sh
```

## API Documentation

### Authentication

- `POST /auth/login` - Login with registration ID and password
- `POST /auth/register` - Register a new user
- `POST /auth/reset-password` - Reset user password

### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Schools

- `GET /schools` - Get all schools
- `POST /schools` - Create a new school
- `GET /schools/:id` - Get school by ID
- `PUT /schools/:id` - Update school
- `DELETE /schools/:id` - Delete school

### Classrooms

- `GET /classrooms` - Get all classrooms
- `POST /classrooms` - Create a new classroom
- `GET /classrooms/:id` - Get classroom by ID
- `PUT /classrooms/:id` - Update classroom
- `DELETE /classrooms/:id` - Delete classroom
- `POST /classrooms/:id/students` - Add students to classroom

### Attendance

- `POST /attendance` - Mark attendance
- `GET /attendance` - Get attendance records
- `GET /attendance/:id` - Get attendance record by ID
- `PUT /attendance/:id` - Update attendance record
- `DELETE /attendance/:id` - Delete attendance record
- `POST /attendance/test-sms` - Test SMS notification

### Reading Paragraphs (English Pronunciation Practice)

- `GET /reading-paragraphs` - Get all reading paragraphs
- `POST /reading-paragraphs` - Create a new reading paragraph (Teachers only)
- `GET /reading-paragraphs/:id` - Get reading paragraph by ID
- `PATCH /reading-paragraphs/:id` - Update reading paragraph (Teachers only)
- `DELETE /reading-paragraphs/:id` - Delete reading paragraph (Teachers only)
- `POST /reading-paragraphs/assignments` - Create reading assignment (Teachers only)
- `GET /reading-paragraphs/assignments/my-assignments` - Get student assignments (Students only)
- `GET /reading-paragraphs/assignments/teacher-assignments` - Get teacher assignments (Teachers only)
- `GET /reading-paragraphs/assignments/:id` - Get assignment by ID
- `POST /reading-paragraphs/assignments/:id/complete` - Complete assignment (Students only)
- `POST /reading-paragraphs/completions/:id/feedback` - Add teacher feedback (Teachers only)

For detailed documentation, see [Reading Paragraph Module README](src/reading-paragraph/README.md).

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Aditya Shinde](https://github.com/adityasshinde)
<!-- - Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework) -->

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
